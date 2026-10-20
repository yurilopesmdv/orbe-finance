import { test } from 'node:test';
import assert from 'node:assert/strict';
import { runProductBatch } from '../../src/features/sync/product-batch.ts';
import { MemoryAssets } from '../../src/data/local/assets.ts';
import { MemoryLedger } from '../../src/data/local/ledger.ts';
const ownerSubject='00000000-0000-4000-8000-000000000001',connectionId='00000000-0000-4000-8000-000000000021',accountId='00000000-0000-4000-8000-000000000031',investmentId='00000000-0000-4000-8000-000000000041',reserveId='00000000-0000-4000-8000-000000000042',movementId='00000000-0000-4000-8000-000000000051',leaseId='00000000-0000-4000-8000-000000000061';
const month='2026-10',source=`connection:${connectionId}`;
function fixture(){
 const now=Date.now(),stamp=new Date(now-10000).toISOString(),principal={subject:ownerSubject,generation:1,unlocked:true},signal=new AbortController();
 const stores={assets:new MemoryAssets(()=>principal),ledger:new MemoryLedger(()=>principal)};
 const accountScope={connectionId,institutionId:'bradesco',product:'account'};
 stores.assets.promote(stores.assets.beginImport(accountScope),[{...accountScope,ownerSubject,id:`account:${connectionId}:${accountId}`,currency:'BRL',amountCents:100,asOf:'2026-10-19',kind:'asset',relation:'distinct'}],true,true);
 stores.ledger.promote(stores.ledger.beginImport({source,accountId,month}),[{ownerSubject,source,accountId,externalId:movementId,amountCents:100,currency:'BRL',direction:'debit',type:'expense',status:'posted',occurredAt:'2026-10-19',institutionId:'bradesco',description:'Compra fictícia',categoryId:null}],true);
 const base={ownerSubject,connectionId,institutionId:'bradesco'};
 const contexts={ownerSubject,accounts:{...base,allowedAccountIds:[accountId]},transactions:{...base,month,accountIds:[accountId],allowedAccountIds:[accountId],categoryIds:[],confirmedOwnTransfers:[]},investments:{...base,product:'investment',allowedPositionIds:[investmentId],allowedParents:[]},reserves:{...base,product:'reserve',allowedPositionIds:[reserveId],allowedParents:[{product:'account',id:accountId}]}};
 const position=(product,id,patch={})=>({id,connectionId,product,currency:'BRL',grossCents:15000,netCents:14000,valueBasis:'net',asOf:'2026-10-19',relation:'distinct',parent:null,assetClass:'fixed_income',kind:'asset',...patch});
 const data={accounts:{connectionId,items:[{id:accountId,connectionId,currency:'BRL',balanceCents:100000,balanceAsOf:'2026-10-19',relation:'distinct'}],nextCursor:null,authoritative:true,sourceUpdatedAt:stamp},transactions:{accountCursor:null,nextCursor:null,page:{connectionId,accountId,items:[{movementId,accountId,amountCents:2000,currency:'BRL',direction:'debit',type:'expense',status:'posted',occurredAt:'2026-10-19',description:'Compra fictícia',categoryId:null,reversalOf:null}],nextCursor:null,windowComplete:true,sourceUpdatedAt:stamp}},investments:{connectionId,product:'investment',items:[position('investment',investmentId)],nextCursor:null,authoritative:true,sourceUpdatedAt:stamp},reserves:{connectionId,product:'reserve',items:[position('reserve',reserveId,{grossCents:20000,netCents:20000,relation:'included',parent:{product:'account',id:accountId}})],nextCursor:null,authoritative:true,sourceUpdatedAt:stamp}};
 const calls=[];
 const transport={acquire:async()=>{calls.push('acquire');return{status:'acquired',leaseId,revision:1,expiresAt:new Date(now+120000).toISOString(),nextReadAt:new Date(now+900000).toISOString()};},readPage:async request=>{calls.push(request.product);return data[request.product];},finalize:async()=>{calls.push('finalize');return true;}};
 const metadata={id:connectionId,institution:'bradesco',state:'active',revision:1,capabilities:{accounts:true,transactions:true,investments:true,reserves:true},openFinanceVerifiedAt:new Date(now-100000).toISOString(),proxyConsentExpiresAt:new Date(now+86400000).toISOString(),bankConsentExpiresAt:null};
 const options={enabled:true,privateDataApproved:true,assertCurrent:()=>{if(!principal.unlocked)throw new Error('locked');},signal:signal.signal};
 return {stores,contexts,data,metadata,options,transport,calls,signal,principal,run:()=>runProductBatch(metadata,contexts,stores,transport,options),assets:()=>stores.assets.list({},true),ledger:()=>stores.ledger.list({month},true)};
}

test('disabled and locked paths do not touch metadata context stores transport or clock',async()=>{
 const poison=new Proxy({}, {get(){throw new Error('sensitive');}});assert.deepEqual(await runProductBatch(poison,poison,poison,poison),{status:'disabled',publishedProducts:[]});
 const options={enabled:true,privateDataApproved:true,assertCurrent(){throw new Error('locked');},get clock(){throw new Error('sensitive');}};assert.deepEqual(await runProductBatch(poison,poison,poison,poison,options),{status:'cancelled',publishedProducts:[]});
});
test('all products route through concrete normalizers and commit with valuation and no double count',async()=>{
 const f=fixture(),result=await f.run();assert.equal(result.status,'complete');assert.deepEqual(result.publishedProducts,['accounts','transactions','investments','reserves']);assert.deepEqual(f.calls,['acquire','accounts','transactions','investments','reserves','finalize']);assert.equal(f.assets().summary.subtotalCents,114000);assert.equal(f.ledger().summary.netCents,2000);assert.equal(f.assets().items.find(item=>item.product==='investment').grossCents,15000);assert.ok(Object.isFrozen(result)&&Object.isFrozen(result.publishedProducts));assert.ok(!JSON.stringify(result).includes(ownerSubject));
});
test('unknown paused or expired metadata returns unavailable before contexts or transport',async()=>{
 const poison=new Proxy({}, {get(){throw new Error('sensitive');}});for(const patch of [{state:'paused'},{proxyConsentExpiresAt:null},{proxyConsentExpiresAt:'2020-01-01T00:00:00Z'}]){const f=fixture();const result=await runProductBatch({...f.metadata,...patch},poison,poison,poison,f.options);assert.equal(result.status,'unavailable');}
});
test('missing context or foreign owner connection institution fails before acquiring lease',async()=>{
 for(const patch of ['missing','owner','connection','institution','product']){const f=fixture();if(patch==='missing')delete f.contexts.reserves;if(patch==='owner')f.contexts.reserves.ownerSubject=accountId;if(patch==='connection')f.contexts.reserves.connectionId=accountId;if(patch==='institution')f.contexts.reserves.institutionId='nubank';if(patch==='product')f.contexts.reserves.product='investment';const result=await f.run();assert.equal(result.status,'failed');assert.deepEqual(result.publishedProducts,[]);assert.deepEqual(f.calls,[]);assert.equal(f.assets().summary.subtotalCents,100);}
});
test('only eligible products access their context store and transport operation',async()=>{
 const f=fixture();f.metadata.capabilities={accounts:true,transactions:false,investments:null,reserves:false};const stores={assets:f.stores.assets,get ledger(){throw new Error('must_not_read');}};
 const result=await runProductBatch(f.metadata,{ownerSubject,accounts:f.contexts.accounts},stores,f.transport,f.options);assert.equal(result.status,'complete');assert.deepEqual(result.publishedProducts,['accounts']);assert.deepEqual(f.calls,['acquire','accounts','finalize']);
});
test('mutating metadata contexts and transport methods after acquire cannot change captured operation',async()=>{
 const f=fixture(),acquire=f.transport.acquire;f.transport.acquire=async(...args)=>{f.metadata.id=accountId;f.metadata.revision=99;f.metadata.capabilities.accounts=false;f.contexts.accounts.allowedAccountIds.length=0;f.contexts.transactions.month='2026-09';f.transport.readPage=async()=>{throw new Error('mutated');};return acquire(...args);};const result=await f.run();assert.equal(result.status,'complete');assert.equal(f.assets().summary.subtotalCents,114000);assert.equal(f.ledger().summary.netCents,2000);
});
test('transport data never executes a server supplied stage callback',async()=>{
 const f=fixture();let invoked=0;f.data.accounts.stage=()=>{invoked++;};assert.equal((await f.run()).status,'complete');assert.equal(invoked,0);
 const g=fixture();g.data.accounts={receipt:{},stage(){invoked++;}};assert.equal((await g.run()).status,'failed');assert.equal(invoked,0);assert.equal(g.assets().summary.subtotalCents,100);
});
test('failure in late page or finalization preserves all previous product snapshots',async()=>{
 const f=fixture();f.data.investments.items[0].grossCents='bad';const result=await f.run();assert.equal(result.status,'failed');assert.deepEqual(result.publishedProducts,[]);assert.equal(f.assets().summary.subtotalCents,100);assert.equal(f.ledger().summary.netCents,100);assert.ok(!f.calls.includes('finalize'));
 const g=fixture();g.transport.finalize=async()=>false;assert.equal((await g.run()).status,'failed');assert.equal(g.assets().summary.subtotalCents,100);assert.equal(g.ledger().summary.netCents,100);
});
test('later product commit failure reports the already published prefix without claiming global rollback',async()=>{
 const f=fixture();f.stores.ledger.promoteBatches=()=>{throw new Error('PRIVATE_SYNTHETIC_ERROR');};const result=await f.run();assert.equal(result.status,'failed');assert.deepEqual(result.publishedProducts,['accounts']);assert.equal(f.assets().summary.subtotalCents,100000);assert.equal(f.ledger().summary.netCents,100);assert.ok(!JSON.stringify(result).includes('PRIVATE_SYNTHETIC_ERROR'));
});
test('abort ignores a late raw response before any normalizer or stage can access it',async()=>{
 const f=fixture();f.transport.readPage=async()=>{f.signal.abort();return new Proxy({}, {get(){throw new Error('must_not_parse');},ownKeys(){throw new Error('must_not_parse');}});};const result=await f.run();assert.equal(result.status,'cancelled');assert.deepEqual(result.publishedProducts,[]);assert.equal(f.assets().summary.subtotalCents,100);assert.equal(f.ledger().summary.netCents,100);
});
test('busy acquisition cleans unused stages and a later execution can start with new instances',async()=>{
 const f=fixture(),acquire=f.transport.acquire;f.transport.acquire=async()=>({status:'busy'});assert.deepEqual(await f.run(),{status:'busy',publishedProducts:[]});assert.equal(f.assets().summary.subtotalCents,100);f.transport.acquire=acquire;assert.equal((await f.run()).status,'complete');
});
test('partial window preserves manual category correction and exposes product coverage',async()=>{
 const f=fixture();f.stores.ledger.createCategory({ownerSubject,id:'health',name:'Saúde'});const ref={source,accountId,externalId:movementId};f.stores.ledger.setOverride(ref,{categoryId:'health'});f.data.transactions.page.windowComplete=false;const result=await f.run();assert.equal(result.status,'complete');assert.equal(result.products.find(product=>product.product==='transactions').partial,true);assert.equal(f.stores.ledger.classificationFor(ref).categoryId,'health');
});

test('expected local owner scope is checked before transport rather than inferred from contexts',async()=>{
 const f=fixture();const result=await runProductBatch(f.metadata,f.contexts,f.stores,f.transport,{...f.options,expectedOwnerSubject:accountId});assert.equal(result.status,'failed');assert.deepEqual(f.calls,[]);
});

test('accounts-only scope requires no other contexts and preserves unrequested ledger',async()=>{
 const f=fixture();f.options.products=['accounts'];for(const name of ['transactions','investments','reserves'])delete f.contexts[name];const result=await f.run();assert.equal(result.status,'complete');assert.equal(result.partial,true);assert.deepEqual(result.publishedProducts,['accounts']);assert.deepEqual(f.calls,['acquire','accounts','finalize']);assert.equal(f.ledger().summary.netCents,100);assert.equal(f.metadata.capabilities.transactions,true);
});
test('invalid product subset fails before lease or touching previous stores',async()=>{
 for(const products of [[],['accounts','accounts'],['unknown']]){const f=fixture();f.options.products=products;assert.equal((await f.run()).status,'failed');assert.deepEqual(f.calls,[]);assert.equal(f.assets().summary.subtotalCents,100);}
});
