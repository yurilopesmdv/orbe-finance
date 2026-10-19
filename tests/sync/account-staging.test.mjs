import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createAccountStager } from '../../src/features/sync/account-staging.ts';
import { normalizeAccountPage } from '../../src/features/sync/accounts.ts';
import { runReadBatch } from '../../src/features/sync/read-batch.ts';
import { MemoryAssets } from '../../src/data/local/assets.ts';
const connectionId='00000000-0000-4000-8000-000000000021', ownerSubject='00000000-0000-4000-8000-000000000001', id='00000000-0000-4000-8000-000000000031', other='00000000-0000-4000-8000-000000000032', leaseId='00000000-0000-4000-8000-000000000041';
const enabled={enabled:true,privateDataApproved:true};
const stamp=new Date(Date.now()-10000).toISOString();
const account=(patch={})=>({id,connectionId,currency:'BRL',balanceCents:12345,balanceAsOf:'2026-10-19',relation:'distinct',...patch});
const page=(patch={})=>({connectionId,items:[account()],nextCursor:null,authoritative:true,sourceUpdatedAt:stamp,...patch});
const request=(cursor=null,patch={})=>({connectionId,revision:1,leaseId,product:'accounts',cursor,...patch});
const signal=()=>new AbortController().signal;
function fixture(){
 let principal={subject:ownerSubject,generation:1,unlocked:true};
 const context={connectionId,ownerSubject,institutionId:'bradesco',allowedAccountIds:[id,other]};
 const store=new MemoryAssets(()=>principal), scope={connectionId,institutionId:'bradesco',product:'account'};
 const initial=normalizeAccountPage(page({items:[account({id:other,balanceCents:500})]}),context,enabled);
 store.promote(store.beginImport(scope),initial.items,true,true);
 let begins=0; const begin=store.beginImport.bind(store); store.beginImport=(...args)=>{begins++;return begin(...args);};
 const stager=createAccountStager(store,context,enabled);
 return {store,context,stager,begins:()=>begins,lock:()=>{principal={...principal,unlocked:false};},total:()=>store.list({},true).summary.subtotalCents};
}
async function run(f,pages,overrides={}){
 const now=Date.now(), parent=new AbortController(); let index=0,finishes=0;
 const ports={acquire:async()=>({status:'acquired',leaseId,revision:1,expiresAt:new Date(now+120000).toISOString(),nextReadAt:new Date(now+900000).toISOString()}),readPage:async req=>f.stager.prepare(pages[index++],req),finalize:async()=>{finishes++;return true;},promote:(fresh,sig)=>f.stager.promote(fresh,sig),clearStaging:()=>f.stager.clear(),...overrides};
 const metadata={id:connectionId,institution:'bradesco',state:'active',revision:1,capabilities:{accounts:true,transactions:false,investments:false,reserves:false},openFinanceVerifiedAt:new Date(now-100000).toISOString(),proxyConsentExpiresAt:new Date(now+86400000).toISOString(),bankConsentExpiresAt:null};
 const result=await runReadBatch(metadata,ports,{...enabled,assertCurrent:()=>{if(parent.signal.aborted)throw new Error('locked');},signal:parent.signal});
 return {result,finishes};
}

test('factory gates avoid reading store or context',()=>{
 const poison=new Proxy({}, {get(){throw new Error('sensitive');}});
 assert.deepEqual(createAccountStager(poison,poison),{kind:'disabled'}); assert.deepEqual(createAccountStager(poison,poison,{enabled:true}),{kind:'disabled'});
});
test('prepare makes no ticket or cache change; full coordinator promotes two pages once',async()=>{
 const f=fixture();const prepared=f.stager.prepare(page({nextCursor:'next'}),request()); assert.equal(f.begins(),0);assert.equal(f.total(),500);assert.equal(prepared.receipt.rowCount,1); assert.ok(Object.isFrozen(prepared.receipt));
 const {result,finishes}=await run(f,[page({nextCursor:'next'}),page({items:[account({id:other,balanceCents:200})]})]);
 assert.equal(result.status,'complete'); assert.equal(result.products[0].pages,2); assert.equal(finishes,1); assert.equal(f.begins(),1); assert.equal(f.total(),12545);
 assert.throws(()=>prepared.stage(signal()),/invalid_account_staging/);
});
test('invalid second page discards first page and keeps last valid snapshot',async()=>{
 const f=fixture();const {result,finishes}=await run(f,[page({nextCursor:'next'}),page({items:[account({balanceCents:'bad'})]})]);assert.equal(result.status,'failed'); assert.equal(finishes,0);assert.equal(f.total(),500);
});
test('unconfirmed finalize never promotes',async()=>{
 const f=fixture(); const {result}=await run(f,[page()],{finalize:async()=>false});assert.equal(result.status,'failed');assert.equal(f.total(),500);
});
test('clear invalidates prepared callbacks and is idempotent',()=>{
 const f=fixture(), work=f.stager.prepare(page(),request());f.stager.clear();f.stager.clear();assert.throws(()=>work.stage(signal()),/invalid_account_staging/);assert.equal(f.begins(),0);assert.equal(f.total(),500);assert.throws(()=>f.stager.prepare(page(),request()),/invalid_account_staging/);
});
test('aborted stage never creates a ticket',()=>{
 const f=fixture(), work=f.stager.prepare(page(),request()), controller=new AbortController();controller.abort();assert.throws(()=>work.stage(controller.signal),/invalid_account_staging/);assert.equal(f.begins(),0);assert.equal(f.total(),500);
});
test('callback is single-use and cannot promote a replayed prefix',()=>{
 const f=fixture(), work=f.stager.prepare(page({nextCursor:'next'}),request());work.stage(signal());assert.throws(()=>work.stage(signal()),/invalid_account_staging/);assert.throws(()=>f.stager.promote(()=>{},signal()),/invalid_account_staging/);assert.equal(f.total(),500);
});
test('cursor ordering revision lease product and connection cannot change within batch',()=>{
 for(const req of [request('wrong'),request('next',{revision:2}),request('next',{leaseId:other}),request('next',{product:'transactions'}),request('next',{connectionId:other})]){
  const f=fixture();f.stager.prepare(page({nextCursor:'next'}),request()).stage(signal());assert.throws(()=>f.stager.prepare(page(),req),/invalid_account_staging/);assert.equal(f.total(),500);
 }
});
test('captured context and request cannot be mutated to expand account bindings',()=>{
 const f=fixture();const foreign='00000000-0000-4000-8000-000000000099';f.context.allowedAccountIds.push(foreign);assert.throws(()=>f.stager.prepare(page({items:[account({id:foreign})]}),request()),/invalid_account_staging/);
 const g=fixture(), req=request();const work=g.stager.prepare(page(),req);req.connectionId=other;req.revision=99;g.context.ownerSubject=other;work.stage(signal());g.stager.promote(()=>{},signal());assert.equal(g.total(),12345);
});
test('identical duplicate across pages deduplicates; conflicting duplicate retains old cache',async()=>{
 const f=fixture();assert.equal((await run(f,[page({nextCursor:'next'}),page()])).result.status,'complete');assert.equal(f.total(),12345);
 const g=fixture();assert.equal((await run(g,[page({nextCursor:'next'}),page({items:[account({balanceCents:1})]})])).result.status,'failed');assert.equal(g.total(),500);
});
test('received rows are counted before dedupe and capped across pages',()=>{
 const f=fixture();let cursor=null;
 for(let i=0;i<10;i++){const next=`page-${i}`;const work=f.stager.prepare(page({items:Array(1000).fill(account()),nextCursor:next}),request(cursor));assert.equal(work.receipt.rowCount,1000);work.stage(signal());cursor=next;}
 const last=f.stager.prepare(page(),request(cursor));assert.throws(()=>last.stage(signal()),/invalid_account_staging/);assert.equal(f.total(),500);
});
test('zero-row pages still count toward page limit and cycles are rejected',()=>{
 const f=fixture();let cursor=null;for(let i=0;i<100;i++){const next=`p-${i}`;f.stager.prepare(page({items:[],nextCursor:next}),request(cursor)).stage(signal());cursor=next;}
 assert.throws(()=>f.stager.prepare(page({items:[]}),request(cursor)).stage(signal()),/invalid_account_staging/);assert.equal(f.total(),500);
 const g=fixture();g.stager.prepare(page({nextCursor:'repeat'}),request()).stage(signal());assert.throws(()=>g.stager.prepare(page({nextCursor:'repeat'}),request('repeat')).stage(signal()),/invalid_account_staging/);
});
test('mixed or missing source in any page prevents removing absent accounts',async()=>{
 for(const sourceUpdatedAt of [null,new Date(Date.parse(stamp)-1000).toISOString()]){
  const f=fixture();const {result}=await run(f,[page({nextCursor:'next'}),page({items:[],sourceUpdatedAt})]);assert.equal(result.status,'complete');assert.equal(result.products[0].authoritative,false);assert.equal(f.total(),12845);assert.equal(f.store.list({},true).summary.partial,true);
 }
});
test('partial or unconfirmed first page cannot be overridden by authoritative final page',async()=>{
 const f=fixture();const {result}=await run(f,[page({nextCursor:'next',authoritative:false}),page({items:[]})]);assert.equal(result.status,'complete');assert.equal(f.total(),12845);assert.equal(f.store.list({},true).summary.partial,true);
});
test('promotion requires final page fresh guard and live signal',()=>{
 const f=fixture();f.stager.prepare(page({nextCursor:'next'}),request()).stage(signal());assert.throws(()=>f.stager.promote(()=>{},signal()),/invalid_account_staging/);assert.equal(f.total(),500);
 for(const guard of [()=>{throw new Error('SYNTHETIC_PRIVATE');},()=>Promise.resolve()]){const g=fixture();g.stager.prepare(page(),request()).stage(signal());assert.throws(()=>g.stager.promote(guard,signal()),/^Error: invalid_account_staging$/);assert.equal(g.total(),500);}
 const g=fixture();g.stager.prepare(page(),request()).stage(signal());let calls=0;assert.throws(()=>g.stager.promote(()=>{if(++calls===2)throw new Error('expired_at_commit');},signal()),/invalid_account_staging/);assert.equal(calls,2);assert.equal(g.total(),500);
});
test('session lock purges cache instead of allowing a pending page to recreate it',()=>{
 const f=fixture();f.stager.prepare(page(),request()).stage(signal());f.lock();assert.throws(()=>f.stager.promote(()=>{},signal()),/invalid_account_staging/);assert.throws(()=>f.total(),/repository_locked/);
});
