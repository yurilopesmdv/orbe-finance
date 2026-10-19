import { test } from 'node:test';
import assert from 'node:assert/strict';
import { MemoryAssets } from '../../src/data/local/assets.ts';
import { normalizePositionPage } from '../../src/features/sync/positions.ts';
import { projectPositionValuation } from '../../src/domain/valuation.ts';
const ownerSubject='00000000-0000-4000-8000-000000000001',connectionId='00000000-0000-4000-8000-000000000021',id='00000000-0000-4000-8000-000000000041';
const context={ownerSubject,connectionId,institutionId:'bradesco',product:'investment',allowedPositionIds:[id],allowedParents:[]};
const raw={connectionId,product:'investment',items:[{id,connectionId,product:'investment',currency:'BRL',grossCents:15000,netCents:14000,valueBasis:'net',asOf:'2026-10-19',relation:'distinct',parent:null,assetClass:'fixed_income',kind:'asset'}],nextCursor:null,authoritative:true,sourceUpdatedAt:'2026-10-19T10:00:00Z'};
const position=()=>normalizePositionPage(raw,context,{enabled:true,privateDataApproved:true}).items[0];
function fixture(){const store=new MemoryAssets(()=>({subject:ownerSubject,generation:1,unlocked:true}));const scope={connectionId,institutionId:'bradesco',product:'investment'};const promote=(items=[position()],guard)=>store.promote(store.beginImport(scope),items,true,true,guard);return {store,promote,scope,list:()=>store.list({},true)};}

test('normalizer to cache preserves gross net selected basis and class in minimal copies',()=>{
 const f=fixture();f.promote([{...position(),unused:'SYNTHETIC_PRIVATE'}]);const result=f.list();assert.equal(result.summary.subtotalCents,14000);const cached=result.items[0];assert.equal(cached.grossCents,15000);assert.equal(cached.netCents,14000);assert.equal(cached.valueBasis,'net');assert.equal(cached.assetClass,'fixed_income');assert.equal('ownerSubject'in cached,false);assert.equal('unused'in cached,false);cached.netCents=1;assert.equal(f.list().items[0].netCents,14000);
});
test('partial valuation fields invalid enums unsafe cents or inconsistent chosen basis reject before swap',()=>{
 const f=fixture();f.promote();const original=position();
 for(const patch of [{grossCents:undefined},{netCents:'1'},{grossCents:1.2},{grossCents:Number.MAX_SAFE_INTEGER+1},{valueBasis:'available'},{assetClass:'guaranteed'},{amountCents:15000},{valueBasis:'unknown'}])assert.throws(()=>f.promote([{...original,...patch}]),/invalid_position_valuation/);
 const {grossCents,...partial}=original;assert.throws(()=>f.promote([partial]),/invalid_position_valuation/);assert.equal(f.list().items[0].grossCents,15000);assert.equal(f.list().summary.subtotalCents,14000);
});
test('duplicate id cannot hide conflicting valuation even when selected amount is identical',()=>{
 const f=fixture();f.promote();for(const patch of [{grossCents:15001},{assetClass:'fund'}])assert.throws(()=>f.promote([position(),{...position(),...patch}]),/conflicting_component/);assert.equal(f.list().items[0].grossCents,15000);assert.equal(f.list().items[0].assetClass,'fixed_income');
});
test('legacy components stay without valuation instead of inventing gross or net',()=>{
 const f=fixture();const {grossCents,netCents,valueBasis,assetClass,...legacy}=position();f.promote([legacy]);const cached=f.list().items[0];assert.equal('grossCents'in cached,false);assert.equal('netCents'in cached,false);assert.equal('assetClass'in cached,false);assert.equal(cached.amountCents,14000);
 assert.equal(projectPositionValuation(Object.create({grossCents:1,netCents:1,valueBasis:'net',assetClass:'fund'}),'investment',1),undefined);
});
test('account metadata cannot accidentally be labeled gross or net',()=>{
 const f=fixture(),account={...position(),product:'account',id:'account-synthetic'};assert.throws(()=>f.store.promote(f.store.beginImport({...f.scope,product:'account'}),[account],true,true),/invalid_position_valuation/);assert.equal(f.list().items.length,0);
});
test('null foreign and negative positions preserve explicit metadata and subtotal semantics',()=>{
 const f=fixture();f.promote([{...position(),currency:'USD',amountCents:null,netCents:null}]);assert.equal(f.list().items[0].netCents,null);assert.equal(f.store.list({currency:'USD'},true).summary.partial,true);
 f.promote([{...position(),amountCents:-100,netCents:-100}]);assert.equal(f.list().items[0].netCents,-100);assert.equal(f.list().summary.subtotalCents,0);assert.equal(f.list().summary.partial,true);
 f.promote([{...position(),amountCents:null,valueBasis:'unknown'}]);assert.equal(f.list().items[0].grossCents,15000);assert.equal(f.list().items[0].amountCents,null);
});
test('failed guard preserves old valuation and stale ticket cannot overwrite it',()=>{
 const f=fixture();f.promote();assert.throws(()=>f.promote([{...position(),grossCents:16000,netCents:15500,amountCents:15500}],()=>{throw new Error('expired');}),/expired/);assert.equal(f.list().items[0].grossCents,15000);
 const old=f.store.beginImport(f.scope),newer=f.store.beginImport(f.scope);f.store.promote(newer,[{...position(),assetClass:'fund'}],true,true);assert.throws(()=>f.store.promote(old,[position()],true,true),/stale_import/);assert.equal(f.list().items[0].assetClass,'fund');
});
