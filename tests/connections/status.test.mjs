import test from 'node:test';
import assert from 'node:assert/strict';
import { createConnectionStatusReader } from '../../src/features/connections/status.ts';
import { SessionModel } from '../../src/features/auth/session.ts';
const origin=`https://${'a'.repeat(20)}.supabase.co`,config={origin,publishableKey:'sb_publishable_invented'};
const connection={id:'00000000-0000-4000-8000-000000000021',institution:'bradesco',revision:1,state:'active',capabilities:{accounts:true,transactions:null,investments:false,reserves:null},openFinanceVerifiedAt:'2026-10-19T12:00:00.000Z',proxyConsentExpiresAt:'2027-01-01T00:00:00.000Z',bankConsentExpiresAt:null,authorizationExpiresAt:'2027-01-01T00:00:00.000Z',sourceUpdatedAt:null,lastReadAt:null};
const response=(value,status=200)=>new Response(JSON.stringify(value),{status,headers:{'Content-Type':'application/json'}});
const deferred=()=>{let resolve;const promise=new Promise(r=>{resolve=r;});return{resolve,promise};};
async function fixture(steps,policy={enabled:true},login=true){
 let now=Date.now(),resolves=0;const publicConfig={...config},calls=[];
 const session=new SessionModel({origin,signIn:async()=>({accessToken:'invented-private-token',expiresAt:now+600000}),signOut:async()=>{}},()=>now,()=>()=>{});
 if(login)await session.login('invented@example.invalid','invented-only');
 const reader=createConnectionStatusReader(session,()=>{resolves++;return publicConfig;},async(url,init)=>{calls.push({url,init});const step=steps.shift();if(typeof step==='function')return step();if(step instanceof Error)throw step;return step;},policy);
 return{session,reader,calls,publicConfig,resolves:()=>resolves,expire:()=>{now+=600001;}};
}
test('disabled status consults no ports config arguments or transport',async()=>{
 const poison=new Proxy({}, {get(){throw new Error('private');}});
 assert.deepEqual(await createConnectionStatusReader(poison,poison,poison).read(poison),{status:'disabled'});
});
test('locked and preaborted queries never consult public configuration',async()=>{
 const f=await fixture([],undefined,false);assert.deepEqual(await f.reader.read(),{status:'locked'});assert.equal(f.resolves(),0);
 const g=await fixture([]);const abort=new AbortController();abort.abort();assert.deepEqual(await g.reader.read(abort.signal),{status:'cancelled'});assert.equal(g.resolves(),0);
});
test('own fixed metadata route sends no identifiers in URL or body and captures config',async()=>{
 let f;f=await fixture([()=>{f.publicConfig.origin='https://untrusted.invalid';return response({connections:[connection]});}]);
 const out=await f.reader.read();assert.equal(out.status,'complete');const call=f.calls[0];assert.equal(call.url,origin+'/functions/v1/orbe-metadata/connections/status');assert.equal(call.init.body,'{}');assert.equal(call.init.method,'POST');assert.equal(call.init.headers.Authorization,'Bearer invented-private-token');assert.equal(call.init.headers.apikey,config.publishableKey);assert.match(call.init.headers['Cache-Control'],/no-store/);assert.match(call.init.headers['Cache-Control'],/no-cache/);assert.equal(call.init.headers.Pragma,'no-cache');assert.equal(call.init.credentials,'omit');assert.equal(call.init.redirect,'error');assert.equal(call.init.signal.aborted,true);
});
test('another valid Supabase origin and privileged keys never receive Bearer',async()=>{
 for(const patch of [{origin:`https://${'b'.repeat(20)}.supabase.co`},{publishableKey:'sb_secret_invented'},{origin:new String(origin)}]){
 const f=await fixture([]);Object.assign(f.publicConfig,patch);assert.deepEqual(await f.reader.read(),{status:'unavailable'});assert.equal(f.calls.length,0);}
});
test('empty confirmed list is distinct from error; unknown fields never leave projection',async()=>{
 const f=await fixture([response({connections:[]}),response({connections:[{...connection,owner_id:'invented-private',balance:999,capabilities:{...connection.capabilities,private:'invented'}}],token:'invented-private'})]);
 assert.deepEqual(await f.reader.read(),{status:'complete',connections:[]});const out=await f.reader.read();assert.deepEqual(out,{status:'complete',connections:[connection]});assert.ok(Object.isFrozen(out));assert.ok(Object.isFrozen(out.connections));assert.ok(Object.isFrozen(out.connections[0]));assert.ok(Object.isFrozen(out.connections[0].capabilities));
});
test('malformed duplicate over-limit and missing metadata never become a confirmed empty list',async()=>{
 const absent={...connection};delete absent.sourceUpdatedAt;
 for(const value of [null,[],{}, {connections:null},{connections:[connection,connection]}, {connections:Array(101).fill(connection)}, {connections:[absent]}]){
 const f=await fixture([response(value)]);assert.deepEqual(await f.reader.read(),{status:'unavailable'});}
});
test('metadata preserves unknowns and rejects unsafe enum revision date and consent projection',async()=>{
 for(const patch of [{id:'external-id'},{institution:'other'},{state:'connected'},{revision:1.5},{revision:Number.MAX_SAFE_INTEGER+1},{capabilities:{...connection.capabilities,accounts:'true'}},{openFinanceVerifiedAt:null},{sourceUpdatedAt:'2026-02-30T00:00:00.000Z'},{authorizationExpiresAt:null}]){
 const f=await fixture([response({connections:[{...connection,...patch}]})]);assert.deepEqual(await f.reader.read(),{status:'unavailable'});}
 const f=await fixture([response({connections:[{...connection,bankConsentExpiresAt:'2026-12-01T00:00:00.000Z',authorizationExpiresAt:'2026-12-01T00:00:00.000Z'}]})]);assert.equal((await f.reader.read()).status,'complete');
});
test('401 and 403 lock session without reading error details; rate limit stays sanitized',async()=>{
 for(const code of [401,403]){const f=await fixture([response({private:'invented'},code)]);assert.deepEqual(await f.reader.read(),{status:'locked'});assert.equal(f.session.getSnapshot().state,'locked');}
 const f=await fixture([response({private:'invented'},429)]);assert.deepEqual(await f.reader.read(),{status:'rate_limited'});assert.equal(f.session.getSnapshot().state,'unlocked');
});
test('server errors cancel bodies without reading or exposing content',async()=>{
 let reads=0,cancelled=false;const stream=new ReadableStream({pull(){reads++;},cancel(){cancelled=true;}},{highWaterMark:0});const f=await fixture([new Response(stream,{status:503})]);assert.deepEqual(await f.reader.read(),{status:'unavailable'});assert.equal(reads,0);assert.equal(cancelled,true);
});
test('oversize invalid JSON and redirects cannot publish metadata',async()=>{
 const redirected={status:200,ok:true,redirected:true,body:null};
 for(const step of [new Response('PRIVATE'.repeat(20000),{headers:{'Content-Type':'application/json'}}),new Response('PRIVATE_INVALID',{headers:{'Content-Type':'application/json'}}),redirected,new Error('PRIVATE_FAILURE')]){
 const f=await fixture([step]);assert.deepEqual(await f.reader.read(),{status:'unavailable'});}
});
test('external cancellation aborts transport and ignores late metadata',async()=>{
 const pending=deferred(),started=deferred();const f=await fixture([()=>{started.resolve();return pending.promise;}]);const cancel=new AbortController(),work=f.reader.read(cancel.signal);await started.promise;cancel.abort();assert.deepEqual(await work,{status:'cancelled'});assert.equal(f.calls[0].init.signal.aborted,true);pending.resolve(response({connections:[connection]}));assert.equal(f.session.getSnapshot().state,'unlocked');
});
test('lock clears access and ignores a transport that completes late',async()=>{
 const pending=deferred(),started=deferred();const f=await fixture([()=>{started.resolve();return pending.promise;}]);const work=f.reader.read();await started.promise;f.session.lock();assert.deepEqual(await work,{status:'cancelled'});pending.resolve(response({connections:[connection]}));assert.deepEqual(await f.reader.read(),{status:'locked'});
});
test('deadline also ends stalled body and allows next query',async()=>{
 let cancelled=false;const stream=new ReadableStream({pull(){return new Promise(()=>{});},cancel(){cancelled=true;}},{highWaterMark:0});const f=await fixture([new Response(stream,{headers:{'Content-Type':'application/json'}}),response({connections:[]})],{enabled:true,timeoutMs:5});assert.deepEqual(await f.reader.read(),{status:'unavailable'});assert.equal(cancelled,true);assert.equal((await f.reader.read()).status,'complete');
});
test('busy prevents duplicates and expiry after HTTP cannot publish a list',async()=>{
 const pending=deferred(),started=deferred();const f=await fixture([()=>{started.resolve();return pending.promise;}]);const work=f.reader.read();await started.promise;assert.deepEqual(await f.reader.read(),{status:'busy'});assert.equal(f.calls.length,1);pending.resolve(response({connections:[]}));assert.equal((await work).status,'complete');
 let g;g=await fixture([()=>{g.expire();return response({connections:[connection]});}]);assert.deepEqual(await g.reader.read(),{status:'cancelled'});assert.equal(g.session.getSnapshot().state,'locked');
});
