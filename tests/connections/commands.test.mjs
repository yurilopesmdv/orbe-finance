import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createConnectionCommands } from '../../src/features/connections/commands.ts';
import { SessionModel } from '../../src/features/auth/session.ts';
const origin=`https://${'a'.repeat(20)}.supabase.co`,config={origin,publishableKey:'sb_publishable_invented'};
const connectionId='00000000-0000-4000-8000-000000000021',input={connectionId,revision:1},approved={enabled:true,privateDataApproved:true};
const response=(value,status=200)=>new Response(status===204?null:JSON.stringify(value),{status,headers:{'Content-Type':'application/json'}});
const deferred=()=>{let resolve;const promise=new Promise(r=>{resolve=r;});return{promise,resolve};};
async function fixture(steps=[response(true)],policy=approved,login=true){
 let now=Date.now(),resolves=0;const calls=[],publicConfig={...config};
 const gateway={origin,signIn:async()=>({accessToken:'invented-private-token',expiresAt:now+600000}),signOut:async()=>{},requestRecovery:async()=>{},resetPassword:async()=>{}};
 const session=new SessionModel(gateway,()=>now,()=>()=>{});if(login)await session.login('invented@example.invalid','invented-password-only');
 const commands=createConnectionCommands(session,()=>{resolves++;return publicConfig;},async(url,init)=>{calls.push({url,init});const step=steps.shift();if(typeof step==='function')return step(url,init);if(step instanceof Error)throw step;return step;},policy);
 return{session,commands,calls,publicConfig,resolves:()=>resolves,setTime:value=>{now=value;},start:now};
}

test('off commands touch no input session config or transport',async()=>{
 const poison=new Proxy({}, {get(){throw new Error('sensitive');},ownKeys(){throw new Error('sensitive');}});const commands=createConnectionCommands(poison,poison,poison);assert.deepEqual(await commands.pause(poison),{status:'disabled'});assert.deepEqual(await commands.remove(poison),{status:'disabled'});
});
test('locked session never resolves config or starts a request',async()=>{
 const f=await fixture([],approved,false);const poison=new Proxy({}, {get(){throw new Error('sensitive');}});assert.deepEqual(await f.commands.pause(poison),{status:'locked'});assert.equal(f.resolves(),0);assert.equal(f.calls.length,0);
});
test('pause and remove use fixed own RPCs bodies and private Bearer headers',async()=>{
 const f=await fixture([response(true),response(true)]);assert.deepEqual(await f.commands.pause(input),{status:'complete'});assert.deepEqual(await f.commands.remove(input),{status:'complete'});
 for(const [index,name]of ['orbe_pause_connection','orbe_remove_connection'].entries()){const call=f.calls[index];assert.equal(call.url,origin+'/rest/v1/rpc/'+name);assert.equal(call.init.method,'POST');assert.deepEqual(JSON.parse(call.init.body),{p_connection_id:connectionId,p_revision:1});assert.equal(call.init.headers.Authorization,'Bearer invented-private-token');assert.equal(call.init.headers.apikey,config.publishableKey);assert.equal(call.init.credentials,'omit');assert.equal(call.init.redirect,'error');assert.equal(call.init.signal.aborted,true);assert.ok(!call.url.includes(connectionId));}
 assert.ok(Object.isFrozen(f.commands));
});
test('only exact primitive input reaches the network with no client owner or reauth flags',async()=>{
 const f=await fixture([]);for(const raw of [null,[],Object.create(input),{...input,ownerId:'other'},{...input,recentAuth:true},{...input,connectionId:new String(connectionId)},{...input,revision:'1'},{...input,revision:0},{...input,revision:1.5},{...input,revision:Number.MAX_SAFE_INTEGER+1}])assert.equal((await f.commands.remove(raw)).status,'invalid_input');assert.equal((await f.commands.pause({...input,revision:Number.MAX_SAFE_INTEGER})).status,'invalid_input');assert.equal(f.calls.length,0);assert.equal(f.resolves(),0);
});
test('configuration must stay on the public origin captured by the session',async()=>{
 const f=await fixture([]);f.publicConfig.origin=`https://${'b'.repeat(20)}.supabase.co`;assert.equal((await f.commands.pause(input)).status,'unavailable');assert.equal(f.calls.length,0);
 for(const patch of [{origin:'https://attacker.invalid'},{publishableKey:'sb_secret_invented'},{origin:new String(origin)}]){const g=await fixture([]);Object.assign(g.publicConfig,patch);assert.equal((await g.commands.pause(input)).status,'unavailable');assert.equal(g.calls.length,0);}
});
test('caller mutation cannot change a request body or validated origin after initiation',async()=>{
 const value={...input};let f;f=await fixture([async(url,init)=>{value.connectionId='changed';value.revision=9;f.publicConfig.origin='https://attacker.invalid';assert.equal(url,origin+'/rest/v1/rpc/orbe_pause_connection');assert.deepEqual(JSON.parse(init.body),{p_connection_id:connectionId,p_revision:1});return response(true);}]);assert.equal((await f.commands.pause(value)).status,'complete');
});
test('false means not confirmed and malformed or empty success never becomes confirmation',async()=>{
 for(const [value,status]of [[false,'not_confirmed'],[{ok:true},'unavailable'],['true','unavailable'],[null,'unavailable']]){const f=await fixture([response(value)]);assert.deepEqual(await f.commands.remove(input),{status});}
 const f=await fixture([response(null,204)]);assert.equal((await f.commands.remove(input)).status,'unavailable');
});
test('large malformed JSON and provider error bodies expose only metadata status',async()=>{
 const large=new Response(JSON.stringify('PRIVATE_SYNTHETIC'.repeat(2000)),{headers:{'Content-Type':'application/json'}});const malformed=new Response('PRIVATE_SYNTHETIC_INVALID',{headers:{'Content-Type':'application/json'}});
 for(const item of [large,malformed,new Error('PRIVATE_SYNTHETIC_NETWORK')]){const f=await fixture([item]);assert.deepEqual(await f.commands.remove(input),{status:'unavailable'});}
 let reads=0,cancelled=false;const body=new ReadableStream({pull(){reads++;},cancel(){cancelled=true;}},{highWaterMark:0});const f=await fixture([new Response(body,{status:500})]);assert.equal((await f.commands.pause(input)).status,'unavailable');assert.equal(reads,0);assert.equal(cancelled,true);
});
test('401 and 403 invalidate session while 429 remains a sanitized rate limit',async()=>{
 for(const status of [401,403]){const f=await fixture([response({private:'invented'},status)]);assert.equal((await f.commands.remove(input)).status,'locked');assert.equal(f.session.getSnapshot().state,'locked');}
 const g=await fixture([response({},429)]);assert.equal((await g.commands.pause(input)).status,'rate_limited');assert.equal(g.session.getSnapshot().state,'unlocked');
});
test('deadline returns without waiting for a transport that ignores abort and releases busy state',async()=>{
 const pending=deferred();const f=await fixture([()=>pending.promise,response(true)],{...approved,timeoutMs:5});assert.equal((await f.commands.pause(input)).status,'unavailable');assert.equal(f.calls[0].init.signal.aborted,true);assert.equal((await f.commands.remove(input)).status,'complete');pending.resolve(response(true));
});
test('deadline also cancels a stalled response stream',async()=>{
 let cancelled=false;const stream=new ReadableStream({pull(){return new Promise(()=>{});},cancel(){cancelled=true;}},{highWaterMark:0});const f=await fixture([new Response(stream,{headers:{'Content-Type':'application/json'}})],{...approved,timeoutMs:5});assert.equal((await f.commands.pause(input)).status,'unavailable');assert.equal(cancelled,true);
});
test('lock aborts pending command and ignores a late confirmation',async()=>{
 const pending=deferred(),started=deferred();const f=await fixture([()=>{started.resolve();return pending.promise;}]);const work=f.commands.remove(input);await started.promise;f.session.lock();assert.equal((await work).status,'cancelled');pending.resolve(response(true));assert.equal(f.session.getSnapshot().state,'locked');assert.equal((await f.commands.pause(input)).status,'locked');
});
test('expired session after successful HTTP does not confirm the command',async()=>{
 let f;f=await fixture([()=>{f.setTime(f.start+600000);return response(true);}]);assert.equal((await f.commands.remove(input)).status,'cancelled');assert.equal(f.session.getSnapshot().state,'locked');
});
test('busy command reads no second input and never sends a duplicate request',async()=>{
 const pending=deferred(),started=deferred();const f=await fixture([()=>{started.resolve();return pending.promise;}]);const first=f.commands.pause(input);await started.promise;const poison=new Proxy({}, {get(){throw new Error('sensitive');}});assert.deepEqual(await f.commands.remove(poison),{status:'busy'});assert.equal(f.calls.length,1);pending.resolve(response(true));assert.equal((await first).status,'complete');
});
