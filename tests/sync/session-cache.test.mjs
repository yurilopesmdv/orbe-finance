import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createSyncSession } from '../../src/features/sync/session-cache.ts';
import { SessionModel } from '../../src/features/auth/session.ts';
const scopeId='00000000-0000-4000-8000-000000000071',nextScope='00000000-0000-4000-8000-000000000072',connectionId='00000000-0000-4000-8000-000000000021',accountId='00000000-0000-4000-8000-000000000031',leaseId='00000000-0000-4000-8000-000000000061';
const approved={enabled:true,privateDataApproved:true};
const deferred=()=>{let resolve;const promise=new Promise(r=>{resolve=r;});return{promise,resolve};};
async function fixture(){
 let now=Date.now(),generated=0;const auth=new SessionModel({signIn:async()=>({accessToken:'invented-token-only',expiresAt:now+600000}),signOut:async()=>{},requestRecovery:async()=>{},resetPassword:async()=>{}},()=>now,()=>()=>{});
 await auth.login('invented@example.invalid','invented-password-only');
 const cache=createSyncSession(auth,()=>{generated++;return scopeId;},approved),parentNow=now;
 const metadata={id:connectionId,institution:'bradesco',state:'active',revision:1,capabilities:{accounts:true,transactions:false,investments:false,reserves:false},openFinanceVerifiedAt:new Date(now-100000).toISOString(),proxyConsentExpiresAt:new Date(now+86400000).toISOString(),bankConsentExpiresAt:null};
 const contexts={ownerSubject:scopeId,accounts:{ownerSubject:scopeId,connectionId,institutionId:'bradesco',allowedAccountIds:[accountId]}};
 const data={connectionId,items:[{id:accountId,connectionId,currency:'BRL',balanceCents:100000,balanceAsOf:'2026-10-19',relation:'distinct'}],nextCursor:null,authoritative:true,sourceUpdatedAt:new Date(now-10000).toISOString()};
 const calls=[];const transport={acquire:async()=>{calls.push('acquire');return{status:'acquired',leaseId,revision:1,expiresAt:new Date(now+120000).toISOString(),nextReadAt:new Date(now+900000).toISOString()};},readPage:async()=>{calls.push('read');return data;},finalize:async()=>{calls.push('finalize');return true;}};
 const options={clock:{now:()=>now,setTimer:(callback,ms)=>setTimeout(callback,ms),clearTimer:timer=>clearTimeout(timer)}};
 return {cache,auth,metadata,contexts,transport,data,options,calls,generated:()=>generated,setTime:value=>{now=value;},start:parentNow,run:()=>cache.run(metadata,contexts,transport,options)};
}

test('disabled factory accesses no session generator or configuration dependencies',()=>{
 const poison=new Proxy({}, {get(){throw new Error('sensitive');}});let generated=0;for(const policy of [{},{enabled:true},{privateDataApproved:true}])assert.deepEqual(createSyncSession(poison,()=>{generated++;throw new Error();},policy),{kind:'disabled'});assert.equal(generated,0);
});
test('locked session cannot call scope factory or create usable cache',()=>{
 let generated=0;const locked={assertUnlocked(){throw new Error('private');},getSnapshot(){return{state:'locked'};},subscribe(){throw new Error();}};assert.throws(()=>createSyncSession(locked,()=>{generated++;return scopeId;},approved),/^Error: sync_session_unavailable$/);assert.equal(generated,0);
});
test('verified synthetic session imports and queries only local scoped cache',async()=>{
 const f=await fixture();assert.equal(f.generated(),1);assert.equal(f.cache.scopeId,scopeId);assert.equal((await f.run()).status,'complete');const result=f.cache.queryAssets({},true);assert.equal(result.summary.subtotalCents,100000);assert.equal('ownerSubject'in result.items[0],false);assert.deepEqual(f.cache.getSnapshot(),{state:'active',running:false});assert.ok(!JSON.stringify(f.cache.getSnapshot()).includes('invented-token'));
});
test('background lock closes cache immediately and a late response cannot recreate it',async()=>{
 const f=await fixture();await f.run();const pending=deferred(),started=deferred();f.transport.readPage=async()=>{started.resolve();return pending.promise;};const work=f.run();await started.promise;f.auth.setActive(false);assert.deepEqual(f.cache.getSnapshot(),{state:'closed',running:false});assert.throws(()=>f.cache.queryAssets(),/sync_session_unavailable/);pending.resolve(f.data);assert.equal((await work).status,'cancelled');assert.throws(()=>f.cache.queryAssets(),/sync_session_unavailable/);
});
test('expiry without timer is enforced before query and purges the local scope',async()=>{
 const f=await fixture();await f.run();f.setTime(f.start+600000);assert.throws(()=>f.cache.queryAssets(),/sync_session_unavailable/);assert.equal(f.cache.getSnapshot().state,'closed');assert.equal(f.auth.getSnapshot().state,'locked');
});
test('new login never reopens old controller and new cache starts empty',async()=>{
 const f=await fixture();await f.run();f.auth.lock();await f.auth.login('invented@example.invalid','invented-password-only');assert.equal(f.cache.getSnapshot().state,'closed');assert.throws(()=>f.cache.queryAssets(),/sync_session_unavailable/);const next=createSyncSession(f.auth,()=>nextScope,approved);assert.equal(next.queryAssets({},true).items.length,0);assert.equal(next.scopeId,nextScope);next.close();
});
test('cancel aborts only the search and keeps previous cache available for retry',async()=>{
 const f=await fixture();await f.run();const read=f.transport.readPage,pending=deferred(),started=deferred();f.transport.readPage=async()=>{started.resolve();return pending.promise;};const work=f.run();await started.promise;f.cache.cancel();assert.equal((await work).status,'cancelled');assert.equal(f.cache.queryAssets({},true).summary.subtotalCents,100000);assert.equal(f.cache.getSnapshot().state,'active');pending.resolve(f.data);f.transport.readPage=read;assert.equal((await f.run()).status,'complete');
});
test('one in-flight execution returns busy without accessing the second call arguments',async()=>{
 const f=await fixture(),pending=deferred(),started=deferred();f.transport.readPage=async()=>{started.resolve();return pending.promise;};const first=f.run();await started.promise;const poison=new Proxy({}, {get(){throw new Error('sensitive');}});assert.deepEqual(await f.cache.run(poison,poison,poison,poison),{status:'busy',publishedProducts:[]});pending.resolve(f.data);assert.equal((await first).status,'complete');
});
test('closed instance touches no run arguments and rejects both query families',async()=>{
 const f=await fixture();f.cache.close();f.cache.close();const poison=new Proxy({}, {get(){throw new Error('sensitive');}});assert.deepEqual(await f.cache.run(poison,poison,poison,poison),{status:'cancelled',publishedProducts:[]});assert.throws(()=>f.cache.queryAssets(poison),/sync_session_unavailable/);assert.throws(()=>f.cache.queryMovements(poison),/sync_session_unavailable/);
});
test('foreign local scope is rejected before any lease request',async()=>{
 const f=await fixture();f.contexts.ownerSubject=nextScope;f.contexts.accounts.ownerSubject=nextScope;const result=await f.run();assert.equal(result.status,'failed');assert.deepEqual(f.calls,[]);assert.equal(f.cache.queryAssets({},true).items.length,0);
});
test('session subscription is removed on close including a lock during registration',()=>{
 let state='unlocked',listeners=new Set();const session={assertUnlocked(){if(state!=='unlocked')throw new Error();},getSnapshot:()=>({state}),subscribe(listener){listeners.add(listener);return()=>listeners.delete(listener);}};const cache=createSyncSession(session,()=>scopeId,approved);assert.equal(listeners.size,1);state='locked';for(const listener of listeners)listener();assert.equal(listeners.size,0);assert.equal(cache.getSnapshot().state,'closed');
 let stopped=false;const racing={assertUnlocked(){},getSnapshot:()=>({state:'locked'}),subscribe(){return()=>{stopped=true;};}};assert.throws(()=>createSyncSession(racing,()=>scopeId,approved),/sync_session_unavailable/);assert.equal(stopped,false);
 let calls=0;const during={assertUnlocked(){},getSnapshot:()=>({state:calls===0?'unlocked':'locked'}),subscribe(listener){calls++;listener();return()=>{stopped=true;};}};assert.throws(()=>createSyncSession(during,()=>scopeId,approved),/sync_session_unavailable/);assert.equal(stopped,true);
});
test('invalid local factory UUID and subscription failures expose only generic errors',()=>{
 const ready={assertUnlocked(){},getSnapshot:()=>({state:'unlocked'}),subscribe(){return()=>{};}};for(const factory of [()=> 'not-uuid',()=>{throw new Error('PRIVATE_SYNTHETIC');}])assert.throws(()=>createSyncSession(ready,factory,approved),/^Error: sync_session_unavailable$/);
 assert.throws(()=>createSyncSession({...ready,subscribe(){throw new Error('PRIVATE_SYNTHETIC');}},()=>scopeId,approved),/^Error: sync_session_unavailable$/);
});

test('session cache forwards explicit product scope without requiring other product contexts',async()=>{
 const f=await fixture();f.metadata.capabilities.transactions=true;f.options.products=['accounts'];assert.equal((await f.run()).status,'complete');assert.deepEqual(f.calls,['acquire','read','finalize']);assert.equal(f.cache.queryAssets({},true).summary.subtotalCents,100000);f.cache.close();
});
