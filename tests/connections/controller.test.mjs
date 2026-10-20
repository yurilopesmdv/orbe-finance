import test from 'node:test';
import assert from 'node:assert/strict';
import { createConnectionsController } from '../../src/features/connections/controller.ts';
import { SessionModel } from '../../src/features/auth/session.ts';
const id='00000000-0000-4000-8000-000000000021';
const row=Object.freeze({id,revision:1,institution:'bradesco',state:'active',capabilities:Object.freeze({accounts:true,transactions:null,investments:false,reserves:null}),openFinanceVerifiedAt:'2026-10-19T12:00:00.000Z',proxyConsentExpiresAt:'2027-01-01T00:00:00.000Z',bankConsentExpiresAt:null,authorizationExpiresAt:'2027-01-01T00:00:00.000Z',sourceUpdatedAt:null,lastReadAt:null});
const input={connectionId:id,revision:1},complete=(connections=[row])=>({status:'complete',connections});
const deferred=()=>{let resolve;const promise=new Promise(r=>{resolve=r;});return{resolve,promise};};
async function fixture(reads=[complete()],commands=[{status:'complete'}]){
 const session=new SessionModel({signIn:async()=>({accessToken:'invented-only',expiresAt:Date.now()+600000}),signOut:async()=>{}},Date.now,()=>()=>{});await session.login('invented@example.invalid','invented-only');
 const calls=[];
 const reader={async read(signal){calls.push({action:'read',signal});const next=reads.shift();if(typeof next==='function')return next(signal);if(next instanceof Error)throw next;return next;}};
 const command=action=>async(value,signal)=>{calls.push({action,value,signal});const next=commands.shift();if(typeof next==='function')return next(signal);if(next instanceof Error)throw next;return next;};
 const model=createConnectionsController(session,reader,{pause:command('pause'),remove:command('remove')},{enabled:true});return{model,session,calls};
}
test('off controller consults no dependency',async()=>{
 const poison=new Proxy({}, {get(){throw new Error('private');}});const model=createConnectionsController(poison,poison,poison);assert.equal(model.getSnapshot().phase,'closed');await model.refresh();await model.remove(poison);assert.equal(model.getSnapshot().connections.length,0);
});
test('confirmed refresh publishes immutable snapshot; no polling or automatic read',async()=>{
 const f=await fixture();assert.equal(f.calls.length,0);await f.model.refresh();assert.deepEqual(f.calls.map(c=>c.action),['read']);const state=f.model.getSnapshot();assert.equal(state.phase,'ready');assert.equal(state.notice,'updated');assert.deepEqual(state.connections,[row]);assert.ok(Object.isFrozen(state));assert.ok(Object.isFrozen(state.connections));assert.equal(f.model.getSnapshot(),state);
});
test('lock immediately clears prior metadata and controller cannot reopen after login',async()=>{
 const f=await fixture();await f.model.refresh();f.session.lock();assert.equal(f.model.getSnapshot().phase,'closed');assert.deepEqual(f.model.getSnapshot().connections,[]);await f.session.login('invented@example.invalid','invented-only');await f.model.refresh();assert.equal(f.calls.length,1);assert.equal(f.model.getSnapshot().phase,'closed');
});
test('close aborts active read and late completion never restores list',async()=>{
 const pending=deferred(),f=await fixture([()=>pending.promise]);const work=f.model.refresh();assert.equal(f.model.getSnapshot().phase,'loading');f.model.close();assert.equal(f.calls[0].signal.aborted,true);pending.resolve(complete());await work;assert.equal(f.model.getSnapshot().phase,'closed');assert.deepEqual(f.model.getSnapshot().connections,[]);
});
test('only current row revision can mutate; pause requires active; extra fields rejected',async()=>{
 const f=await fixture();await f.model.refresh();for(const value of [{...input,revision:2},{...input,connectionId:'foreign'}, {...input,ownerId:'foreign'},null])await f.model.remove(value);assert.equal(f.calls.length,1);
 const g=await fixture([complete([{...row,state:'paused'}])]);await g.model.refresh();await g.model.pause(input);assert.equal(g.calls.length,1);
});
test('pause clears previous status before request and publishes only fresh confirmation',async()=>{
 const pending=deferred();const f=await fixture([complete(),complete([{...row,state:'paused',revision:2}])],[()=>pending.promise]);await f.model.refresh();const work=f.model.pause(input);assert.equal(f.model.getSnapshot().phase,'working');assert.deepEqual(f.model.getSnapshot().connections,[]);assert.deepEqual(f.calls[1].value,input);pending.resolve({status:'complete'});await work;assert.deepEqual(f.calls.map(c=>c.action),['read','pause','read']);assert.equal(f.model.getSnapshot().connections[0].revision,2);assert.equal(f.model.getSnapshot().notice,'paused');
});
test('removal refresh can confirm empty list without pretending bank consent was revoked',async()=>{
 const f=await fixture([complete(),complete([])]);await f.model.refresh();await f.model.remove(input);assert.equal(f.model.getSnapshot().phase,'ready');assert.equal(f.model.getSnapshot().notice,'removed');assert.deepEqual(f.model.getSnapshot().connections,[]);
});
test('false errors and timeout have no automatic command retry or stale list restoration',async()=>{
 for(const status of ['not_confirmed','unavailable','cancelled','rate_limited']){
 const f=await fixture([complete(),complete()],[{status}]);await f.model.refresh();await f.model.remove(input);assert.equal(f.model.getSnapshot().phase,'uncertain');assert.deepEqual(f.model.getSnapshot().connections,[]);assert.deepEqual(f.calls.map(c=>c.action),['read','remove']);await f.model.refresh();assert.equal(f.model.getSnapshot().phase,'ready');assert.equal(f.calls.length,3);}
});
test('failed reconciliation after confirmed command never restores old status',async()=>{
 const f=await fixture([complete(),{status:'unavailable'}]);await f.model.refresh();await f.model.pause(input);assert.equal(f.model.getSnapshot().phase,'error');assert.deepEqual(f.model.getSnapshot().connections,[]);
});
test('close during mutation aborts command and ignores late confirmation without new read',async()=>{
 const pending=deferred(),f=await fixture([complete()],[()=>pending.promise]);await f.model.refresh();const work=f.model.remove(input);f.model.close();assert.equal(f.calls[1].signal.aborted,true);pending.resolve({status:'complete'});await work;assert.equal(f.calls.length,2);assert.equal(f.model.getSnapshot().phase,'closed');
});
test('busy operations cannot start another refresh or command',async()=>{
 const pending=deferred(),f=await fixture([complete()],[()=>pending.promise]);await f.model.refresh();const work=f.model.remove(input);await f.model.refresh();await f.model.pause(input);await f.model.remove(input);assert.equal(f.calls.length,2);pending.resolve({status:'not_confirmed'});await work;
});
test('listener-triggered lock during working state prevents command from starting',async()=>{
 const f=await fixture();await f.model.refresh();f.model.subscribe(()=>{if(f.model.getSnapshot().phase==='working')f.session.lock();});await f.model.remove(input);assert.equal(f.calls.length,1);assert.equal(f.model.getSnapshot().phase,'closed');
});
test('session revoked while subscribing fails closed and removes listener',()=>{
 let state='unlocked',stopped=false;const session={assertUnlocked(){if(state!=='unlocked')throw new Error();},getSnapshot:()=>({state}),subscribe(listener){state='locked';listener();return()=>{stopped=true;};}};const poison=new Proxy({}, {get(){throw new Error('private');}});const model=createConnectionsController(session,poison,poison,{enabled:true});assert.equal(model.getSnapshot().phase,'closed');assert.equal(stopped,true);
});
