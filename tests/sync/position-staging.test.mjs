import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createPositionStager } from '../../src/features/sync/position-staging.ts';
import { createAssetStager } from '../../src/features/sync/asset-staging.ts';
import { normalizePositionPage } from '../../src/features/sync/positions.ts';
import { runReadBatch } from '../../src/features/sync/read-batch.ts';
import { MemoryAssets } from '../../src/data/local/assets.ts';
const ownerSubject='00000000-0000-4000-8000-000000000001',connectionId='00000000-0000-4000-8000-000000000021',id='00000000-0000-4000-8000-000000000041',second='00000000-0000-4000-8000-000000000042',accountId='00000000-0000-4000-8000-000000000031',leaseId='00000000-0000-4000-8000-000000000051';
const enabled={enabled:true,privateDataApproved:true},stamp=new Date(Date.now()-10000).toISOString();
const row=(product='investment',patch={})=>({id,connectionId,product,currency:'BRL',grossCents:15000,netCents:14000,valueBasis:'net',asOf:'2026-10-19',relation:'distinct',parent:null,assetClass:'fixed_income',kind:'asset',...patch});
const page=(product='investment',patch={})=>({connectionId,product,items:[row(product)],nextCursor:null,authoritative:true,sourceUpdatedAt:stamp,...patch});
const request=(product='investments',cursor=null,patch={})=>({connectionId,revision:1,leaseId,product,cursor,...patch});
const signal=()=>new AbortController().signal;
function fixture(product='investment',withAccount=false){
 let principal={subject:ownerSubject,generation:1,unlocked:true};const store=new MemoryAssets(()=>principal);
 const context={ownerSubject,connectionId,institutionId:'bradesco',product,allowedPositionIds:[id,second],allowedParents:[{product:'account',id:accountId},{product,id},{product,id:second}]};const scope={connectionId,institutionId:'bradesco',product};
 if(withAccount){const account={ownerSubject,...scope,product:'account',id:`account:${connectionId}:${accountId}`,currency:'BRL',amountCents:100000,asOf:'2026-10-19',kind:'asset',relation:'distinct'};store.promote(store.beginImport({...scope,product:'account'}),[account],true,true);}
 const initial=normalizePositionPage(page(product),context,enabled);store.promote(store.beginImport(scope),initial.items,true,true);
 let begins=0;const begin=store.beginImport.bind(store);store.beginImport=(...args)=>{begins++;return begin(...args);};
 const stager=createPositionStager(store,context,enabled);
 return {store,context,stager,scope,begins:()=>begins,list:()=>store.list({},true),lock:()=>{principal={...principal,unlocked:false};}};
}
async function run(f,pages,overrides={}){
 const now=Date.now();let index=0;const parent=new AbortController(),product=f.scope.product==='investment'?'investments':'reserves';
 const ports={acquire:async()=>({status:'acquired',leaseId,revision:1,expiresAt:new Date(now+120000).toISOString(),nextReadAt:new Date(now+900000).toISOString()}),readPage:async req=>f.stager.prepare(pages[index++],req),finalize:async()=>true,promote:(fresh,sig)=>f.stager.promote(fresh,sig),clearStaging:()=>f.stager.clear(),...overrides};
 const metadata={id:connectionId,institution:'bradesco',state:'active',revision:1,capabilities:{accounts:false,transactions:false,investments:product==='investments',reserves:product==='reserves'},openFinanceVerifiedAt:new Date(now-100000).toISOString(),proxyConsentExpiresAt:new Date(now+86400000).toISOString(),bankConsentExpiresAt:null};
 return runReadBatch(metadata,ports,{...enabled,assertCurrent:()=>{},signal:parent.signal});
}

test('factory and internal engine gates touch no raw context store or normalizer',()=>{
 const poison=new Proxy({}, {get(){throw new Error('sensitive');}});assert.deepEqual(createPositionStager(poison,poison),{kind:'disabled'});assert.deepEqual(createPositionStager(poison,poison,{enabled:true}),{kind:'disabled'});assert.deepEqual(createAssetStager(poison,poison,poison,'invalid_position_staging'),{kind:'disabled'});
});
test('coordinator stages two position pages and preserves all valuation fields at commit',async()=>{
 const f=fixture(),prepared=f.stager.prepare(page('investment',{nextCursor:'next'}),request());assert.equal(f.begins(),0);assert.equal(f.list().summary.subtotalCents,14000);
 const result=await run(f,[page('investment',{nextCursor:'next',items:[row('investment',{grossCents:16000,netCents:15000})]}),page('investment',{items:[row('investment',{id:second,grossCents:1000,netCents:1000,assetClass:'fund'})]})]);
 assert.equal(result.status,'complete');assert.equal(result.products[0].product,'investments');assert.equal(result.products[0].pages,2);assert.equal(f.begins(),1);assert.equal(f.list().summary.subtotalCents,16000);assert.equal(f.list().items.find(p=>p.id.endsWith(id)).grossCents,16000);assert.equal(f.list().items.find(p=>p.id.endsWith(second)).assetClass,'fund');assert.throws(()=>prepared.stage(signal()),/invalid_position_staging/);
});
test('reserve product maps correctly and included account does not gain extra wealth',async()=>{
 const f=fixture('reserve',true);const result=await run(f,[page('reserve',{items:[row('reserve',{relation:'included',parent:{product:'account',id:accountId}})]})]);assert.equal(result.status,'complete');assert.equal(result.products[0].product,'reserves');assert.equal(f.list().summary.subtotalCents,100000);assert.equal(f.list().items.find(item=>item.product==='reserve').netCents,14000);
});
test('product swap or malformed final page preserves previous snapshot and valuation',async()=>{
 const f=fixture();assert.equal((await run(f,[page('investment',{nextCursor:'next'}),page('reserve')])).status,'failed');assert.equal(f.list().summary.subtotalCents,14000);assert.equal(f.list().items[0].grossCents,15000);
 const g=fixture();assert.throws(()=>g.stager.prepare(page(),request('reserves')),/invalid_position_staging/);
});
test('cycle between pages is rejected before cache swap',async()=>{
 const f=fixture();const result=await run(f,[page('investment',{nextCursor:'next',items:[row('investment',{relation:'included',parent:{product:'investment',id:second}})]}),page('investment',{items:[row('investment',{id:second,relation:'included',parent:{product:'investment',id}})]})]);assert.equal(result.status,'failed');assert.equal(f.list().summary.subtotalCents,14000);assert.equal(f.list().items[0].relation,'distinct');
});
test('valuation conflict across pages cannot hide behind identical selected amount',async()=>{
 const f=fixture();assert.equal((await run(f,[page('investment',{nextCursor:'next'}),page('investment',{items:[row('investment',{grossCents:15001})]})])).status,'failed');assert.equal(f.list().items[0].grossCents,15000);
});
test('mixed or missing source and unconfirmed empty preserve previous positions',async()=>{
 const f=fixture();const result=await run(f,[page('investment',{nextCursor:'next',items:[row('investment',{id:second})]}),page('investment',{items:[],sourceUpdatedAt:new Date(Date.parse(stamp)-1000).toISOString()})]);assert.equal(result.status,'complete');assert.equal(result.products[0].authoritative,false);assert.equal(f.list().items.length,2);assert.equal(f.list().summary.partial,true);
 const g=fixture();await run(g,[page('investment',{items:[],sourceUpdatedAt:null})]);assert.equal(g.list().items.length,1);assert.equal(g.list().items[0].netCents,14000);
 const h=fixture();await run(h,[page('investment',{items:[]})]);assert.equal(h.list().items.length,0);
});
test('captured allowed position and parent arrays cannot be expanded or changed',async()=>{
 const f=fixture('reserve',true);f.context.allowedPositionIds.length=0;f.context.allowedParents[0].id=second;f.context.product='investment';const result=await run(f,[page('reserve',{items:[row('reserve',{relation:'included',parent:{product:'account',id:accountId}})]})]);assert.equal(result.status,'complete');assert.equal(f.list().summary.subtotalCents,100000);
 const g=fixture();g.context.allowedPositionIds.push(accountId);assert.throws(()=>g.stager.prepare(page('investment',{items:[row('investment',{id:accountId})]}),request()),/invalid_position_staging/);
});
test('clear abort and stale callbacks do not recreate stage or erase valid snapshot',()=>{
 const f=fixture(),work=f.stager.prepare(page(),request());f.stager.clear();f.stager.clear();assert.throws(()=>work.stage(signal()),/invalid_position_staging/);assert.equal(f.begins(),0);assert.equal(f.list().items[0].netCents,14000);
 const g=fixture(),controller=new AbortController();controller.abort();assert.throws(()=>g.stager.prepare(page(),request()).stage(controller.signal),/invalid_position_staging/);assert.equal(g.begins(),0);
});
test('guard failure and lock prevent position commit while preserving appropriate lifecycle',()=>{
 const f=fixture();f.stager.prepare(page('investment',{items:[row('investment',{grossCents:16000,netCents:15500})]}),request()).stage(signal());let checks=0;assert.throws(()=>f.stager.promote(()=>{if(++checks===2)throw new Error('expired');},signal()),/invalid_position_staging/);assert.equal(f.list().items[0].grossCents,15000);
 const g=fixture();g.stager.prepare(page(),request()).stage(signal());g.lock();assert.throws(()=>g.stager.promote(()=>{},signal()),/invalid_position_staging/);assert.throws(()=>g.list(),/repository_locked/);
});
