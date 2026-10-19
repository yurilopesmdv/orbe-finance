import { test } from 'node:test';
import assert from 'node:assert/strict';
import { MemoryLedger } from '../../src/data/local/ledger.ts';
const source='connection-synthetic',month='2026-10',ownerSubject='synthetic-owner';
const movement=(accountId,patch={})=>({source,accountId,externalId:'movement',ownerSubject,amountCents:1000,currency:'BRL',direction:'debit',type:'expense',status:'posted',occurredAt:'2026-10-19',institutionId:'bradesco',description:'Compra fictícia',categoryId:null,...patch});
function fixture(){
 let principal={subject:ownerSubject,generation:1,unlocked:true};const store=new MemoryLedger(()=>principal);
 const batch=(accountId,items=[movement(accountId)],scope={source,accountId,month})=>({ticket:store.beginImport(scope),items,complete:true});
 store.promoteBatches([batch('a'),batch('b')]);
 return {store,batch,summary:()=>store.list({month},true),lock:()=>{principal={...principal,unlocked:false};}};
}
test('two accounts publish in one batch and tickets are consumed only on success',()=>{
 const f=fixture(),batches=[f.batch('a',[movement('a',{amountCents:2000})]),f.batch('b',[movement('b',{amountCents:3000})])];f.store.promoteBatches(batches);assert.equal(f.summary().summary.netCents,5000);assert.throws(()=>f.store.promoteBatches(batches),/stale_import/);
});
test('invalid second account keeps both prior snapshots and permits corrected retry',()=>{
 const f=fixture(),first=f.batch('a',[movement('a',{amountCents:2000})]),second=f.batch('b',[movement('b',{amountCents:-1})]);
 assert.throws(()=>f.store.promoteBatches([first,second]),/negative_movement_magnitude/);assert.equal(f.summary().summary.netCents,2000);
 f.store.promoteBatches([first,{...second,items:[movement('b',{amountCents:3000})]}]);assert.equal(f.summary().summary.netCents,5000);
});
test('stale ticket in any account prevents all publication',()=>{
 const f=fixture(),first=f.batch('a',[movement('a',{amountCents:2000})]),second=f.batch('b');f.batch('b');assert.throws(()=>f.store.promoteBatches([first,second]),/stale_import/);assert.equal(f.summary().summary.netCents,2000);
});
test('guard errors non synchronous returns and reentrant new ticket preserve prior rows',()=>{
 for(const guard of [()=>{throw new Error('expired');},()=>Promise.resolve()]){const f=fixture();assert.throws(()=>f.store.promoteBatches([f.batch('a',[movement('a',{amountCents:2000})]),f.batch('b')],guard));assert.equal(f.summary().summary.netCents,2000);}
 const f=fixture();const batches=[f.batch('a',[movement('a',{amountCents:2000})]),f.batch('b')];assert.throws(()=>f.store.promoteBatches(batches,()=>{f.batch('b');}),/stale_import/);assert.equal(f.summary().summary.netCents,2000);
});
test('a lock inside commit guard purges rather than exposing pending or prior rows',()=>{
 const f=fixture();assert.throws(()=>f.store.promoteBatches([f.batch('a'),f.batch('b')],()=>{f.lock();}),/repository_locked/);assert.throws(()=>f.summary(),/repository_locked/);
});
test('source month duplicated scope incomplete and owner mismatch all reject atomically',()=>{
 for(const failure of ['source','month','duplicate','incomplete','owner']){
  const f=fixture(),first=f.batch('a',[movement('a',{amountCents:2000})]);let second=f.batch('b');
  if(failure==='source')second=f.batch('b',[],{source:'other-source',accountId:'b',month});
  if(failure==='month')second=f.batch('b',[],{source,accountId:'b',month:'2026-09'});
  if(failure==='duplicate')second=first;
  if(failure==='incomplete')second={...second,complete:false};
  if(failure==='owner')second={...second,items:[movement('b',{ownerSubject:'other'})]};
  assert.throws(()=>f.store.promoteBatches([first,second]));assert.equal(f.summary().summary.netCents,2000);
 }
});
test('scope count and total received row limits apply before deduplication',()=>{
 const f=fixture();assert.throws(()=>f.store.promoteBatches([]),/invalid_batch_size/);assert.throws(()=>f.store.promoteBatches(Array(1001).fill({})),/invalid_batch_size/);
 assert.throws(()=>f.store.promoteBatches([f.batch('a',Array(5001).fill(movement('a'))),f.batch('b',Array(5000).fill(movement('b')))]),/invalid_batch_size/);assert.equal(f.summary().summary.netCents,2000);
});
test('explicit cancellation updates while absence and user overrides survive',()=>{
 const f=fixture();f.store.createCategory({ownerSubject,id:'health',name:'Saúde'});const ref=movement('a');f.store.setOverride(ref,{categoryId:'health'});
 f.store.promoteBatches([f.batch('a',[movement('a',{amountCents:2000})]),f.batch('b',[movement('b',{status:'cancelled'})])]);assert.equal(f.summary().summary.netCents,2000);assert.equal(f.store.classificationFor(ref).categoryId,'health');assert.equal(f.summary().totalCount,2);
 f.store.promoteBatches([f.batch('a',[]),f.batch('b',[])]);assert.equal(f.summary().totalCount,2);assert.equal(f.store.classificationFor(ref).categoryId,'health');
});
test('cross account refund evidence and foreign currency remain consistent after atomic merge',()=>{
 const f=fixture();const refund=movement('b',{amountCents:200,direction:'credit',type:'refund',reversalOf:{source,accountId:'a',externalId:'movement'}});
 f.store.promoteBatches([f.batch('a',[movement('a'),movement('a',{externalId:'usd',currency:'USD',amountCents:500})]),f.batch('b',[refund])]);assert.equal(f.summary().summary.netCents,800);assert.equal(f.store.list({month,currency:'USD'},true).summary.netCents,500);
});
test('period conflict in last account cannot update the first account',()=>{
 const f=fixture();f.store.promote(f.store.beginImport({source,accountId:'b',month:'2026-09'}),[movement('b',{externalId:'older',occurredAt:'2026-09-01'})],true);
 assert.throws(()=>f.store.promoteBatches([f.batch('a',[movement('a',{amountCents:9000})]),f.batch('b',[movement('b',{externalId:'older'})])]),/movement_period_conflict/);assert.equal(f.summary().summary.netCents,2000);
});
test('ticket scalar captured before guard cannot be swapped by mutating wrapper',()=>{
 const f=fixture(),first=f.batch('a',[movement('a',{amountCents:2000})]),second=f.batch('b');const token=first.ticket.token;first.ticket={token};f.store.promoteBatches([first,second],()=>{first.ticket={token:Symbol('other')};});assert.equal(f.summary().summary.netCents,3000);
});
