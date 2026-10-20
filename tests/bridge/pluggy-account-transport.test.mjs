import test from 'node:test';
import assert from 'node:assert/strict';
import { createPluggyAccountsPort } from '../../supabase/functions/_shared/pluggy-auth.ts';
const uid=n=>`00000000-0000-4000-8000-${String(n).padStart(12,'0')}`;
const ctx=()=>({itemId:uid(1),connectionId:uid(2),bindings:[{externalId:uid(3),internalId:uid(4),balanceAsOf:null,relation:'unknown'}],coverageApproved:false,sourceUpdatedAt:null});
const data={page:1,total:1,totalPages:1,results:[{id:uid(3),itemId:uid(1),type:'BANK',currencyCode:'BRL',balance:0.29,owner:'SYNTHETIC_PRIVATE'}]};
const json=(body,status=200)=>new Response(JSON.stringify(body),{status,headers:{'Content-Type':'application/json'}});
const secret='invented-provider-key-12345',config={clientId:'invented-client',clientSecret:'invented-secret-12345'};
const signal=()=>new AbortController().signal,flush=()=>new Promise(r=>setImmediate(r));
class Clock{value=1000;id=0;timers=new Map();now(){return this.value;}setTimer(cb,ms){const id=++this.id;this.timers.set(id,{cb,at:this.value+ms});return id;}clearTimer(id){this.timers.delete(id);}tick(ms){this.value+=ms;for(const [id,t]of [...this.timers])if(t.at<=this.value){this.timers.delete(id);t.cb();}}}
function fixture(read=async()=>json(data)){
 const calls=[],clock=new Clock();const port=createPluggyAccountsPort(()=>config,{enabled:true,fixtureOnly:true,clock,transport:async(url,init)=>{calls.push({url,init});return url.endsWith('/auth')?json({apiKey:secret}):read(url,init);}});return{port,calls,clock};
}
test('disabled ports do not inspect credentials options input or signal',async()=>{
 const poison=new Proxy({},{get(){throw Error('PRIVATE');}});
 for(const policy of [{},{enabled:true},{fixtureOnly:true}]){const port=createPluggyAccountsPort(()=>{throw Error();},{...policy,get transport(){throw Error();}});assert.equal((await port.readAccounts(poison,poison)).status,'disabled');port.close();}
});
test('auth and fixed account GET produce minimal exact DTO without key or PII',async()=>{
 const{port,calls}=fixture();const result=await port.readAccounts(ctx(),signal());assert.equal(result.status,'complete');assert.equal(result.page.items[0].balanceCents,29);
 assert.deepEqual(Object.keys(port),['readAccounts','close']);assert.equal(calls.length,2);assert.equal(calls[1].url,'https://api.pluggy.ai/accounts?itemId='+uid(1));
 const init=calls[1].init;assert.equal(init.method,'GET');assert.equal(init.headers['X-API-KEY'],secret);assert.equal(init.body,undefined);
 for(const [k,v]of Object.entries({redirect:'error',credentials:'omit',cache:'no-store',referrerPolicy:'no-referrer'}))assert.equal(init[k],v);
 assert.ok(!JSON.stringify(result).includes(secret)&&!JSON.stringify(result).includes('SYNTHETIC_PRIVATE'));port.close();
});
test('context captured before network cannot be swapped during await',async()=>{
 let resolve;const{port}=fixture(()=>new Promise(r=>resolve=r));const context=ctx(),pending=port.readAccounts(context,signal());await flush();context.itemId=uid(99);context.bindings[0].internalId=uid(99);resolve(json(data));const result=await pending;assert.equal(result.status,'complete');assert.equal(result.page.items[0].id,uid(4));port.close();
});
test('invalid or inherited context fails before auth',async()=>{
 const{port,calls}=fixture();for(const context of [{...ctx(),itemId:'https://evil.invalid'},Object.create(ctx()),{...ctx(),bindings:[]}]){const result=await port.readAccounts(context,signal());if(context.itemId!=='00000000-0000-4000-8000-000000000001'||Object.getPrototypeOf(context)!==Object.prototype)assert.equal(result.status,'unavailable');}
 // Empty bindings are valid context but provider rows will not match.
 assert.equal(calls.filter(c=>c.url.endsWith('/auth')).length,1);port.close();
});
test('unauthorized response purges technical key and never retries in same call',async()=>{
 const{port,calls}=fixture(async()=>json({secret:'PRIVATE'},401));assert.equal((await port.readAccounts(ctx(),signal())).status,'unavailable');assert.equal(calls.length,2);
 await port.readAccounts(ctx(),signal());assert.equal(calls.filter(c=>c.url.endsWith('/auth')).length,2);port.close();
});
test('rate limit is returned without retry or response body',async()=>{
 const{port,calls}=fixture(async()=>json({secret:'PRIVATE'},429));assert.deepEqual(await port.readAccounts(ctx(),signal()),{status:'rate_limited'});assert.equal(calls.length,2);port.close();
});
test('invalid JSON schema MIME precision or oversized response fail generically',async()=>{
 const responses=[()=>new Response('PRIVATE'),()=>json({...data,results:[{...data.results[0],balance:0.001}]}),()=>json({...data,total:2}),()=>new Response('x'.repeat(131073),{headers:{'Content-Type':'application/json'}}),()=>new Response('{PRIVATE',{headers:{'Content-Type':'application/json'}})];
 for(const response of responses){const{port}=fixture(async()=>response());assert.deepEqual(await port.readAccounts(ctx(),signal()),{status:'unavailable'});port.close();}
});
test('redirected response rejected without following supplied URL',async()=>{
 const{port,calls}=fixture(async()=>{const response=json(data);Object.defineProperty(response,'redirected',{value:true});return response;});assert.equal((await port.readAccounts(ctx(),signal())).status,'unavailable');assert.equal(calls.length,2);port.close();
});
test('one in flight and parent abort cancels uncooperative transport',async()=>{
 let resolve;const{port}=fixture(()=>new Promise(r=>resolve=r));const parent=new AbortController(),pending=port.readAccounts(ctx(),parent.signal);await flush();assert.equal((await port.readAccounts(ctx(),signal())).status,'busy');parent.abort();assert.equal((await pending).status,'cancelled');resolve(json(data));await flush();port.close();
});
test('close cancels in flight and late result cannot reopen instance',async()=>{
 let resolve;const{port}=fixture(()=>new Promise(r=>resolve=r));const pending=port.readAccounts(ctx(),signal());await flush();port.close();assert.equal((await pending).status,'cancelled');resolve(json(data));await flush();assert.equal((await port.readAccounts(ctx(),signal())).status,'unavailable');
});
test('total read deadline returns even when transport ignores abort',async()=>{
 let resolve;const{port,clock}=fixture(()=>new Promise(r=>resolve=r));const pending=port.readAccounts(ctx(),signal());await flush();clock.tick(20000);assert.equal((await pending).status,'unavailable');resolve(json(data));await flush();port.close();assert.equal(clock.timers.size,0);
});
test('already aborted input does not start auth and key reused only while valid',async()=>{
 const{port,calls}=fixture();const parent=new AbortController();parent.abort();assert.equal((await port.readAccounts(ctx(),parent.signal)).status,'cancelled');assert.equal(calls.length,0);await port.readAccounts(ctx(),signal());await port.readAccounts(ctx(),signal());assert.equal(calls.filter(c=>c.url.endsWith('/auth')).length,1);port.close();
});
