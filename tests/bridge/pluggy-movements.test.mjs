import test from 'node:test';
import assert from 'node:assert/strict';
import { createExactJsonDecoder } from '../../supabase/functions/_shared/exact-json.ts';
import { projectPluggyMovementPage } from '../../supabase/functions/_shared/pluggy-movements.ts';
import { normalizeMovementPage } from '../../src/features/sync/movements.ts';
import { MemoryLedger } from '../../src/data/local/ledger.ts';
const uid=n=>`00000000-0000-4000-8000-${String(n).padStart(12,'0')}`;
const ownerSubject=uid(1),connectionId=uid(2),accountId=uid(3),externalAccountId=uid(4),itemId=uid(5),id=uid(6);
const context={ownerSubject,connectionId,accountId,externalAccountId,itemId,accountKind:'BANK',month:'2026-10',window:{dateFrom:'2026-10-01',dateTo:'2026-10-31'},nextCursor:null,windowComplete:false,sourceUpdatedAt:null};
const row={id,accountId:externalAccountId,date:'2026-10-20T12:00:00Z',amount:-0.29,currencyCode:'BRL',type:'DEBIT',status:'POSTED',description:'Compra fictícia'};
const decode=createExactJsonDecoder(),key=()=>new Uint8Array(32).fill(7),policy={enabled:true,mode:'fixture'};
const page=(rows=[row],next=null)=>decode(JSON.stringify({results:rows,next}));
const project=(raw=page(),ctx=context,read=key,options=policy)=>projectPluggyMovementPage(raw,ctx,read,options);
const next='?accountId='+externalAccountId+'&dateFrom=2026-10-01&dateTo=2026-10-31&after=invented_cursor';

test('off gates never inspect source context key signal or read anything',async()=>{
  const poison=new Proxy({}, {get(){throw Error('private');},getOwnPropertyDescriptor(){throw Error('private');}});
  for(const options of [{},{enabled:true},{enabled:true,mode:'live'}])assert.deepEqual(await project(poison,poison,()=>{throw Error('private');},{...options,get signal(){throw Error('private');}}),{kind:'disabled'});
});

test('exact cents and explicit bank direction produce an internal minimal frozen DTO',async()=>{
  const result=await project();assert.equal(result.kind,'page');
  const movement=result.page.items[0];assert.equal(movement.amountCents,29);assert.equal(movement.direction,'debit');assert.equal(movement.type,'unknown');assert.equal(movement.categoryId,null);assert.equal(movement.reversalOf,null);assert.equal(movement.accountId,accountId);
  assert.notEqual(movement.movementId,id);assert.equal(movement.status,'posted');assert.equal(result.page.windowComplete,false);assert.equal(result.page.sourceUpdatedAt,null);
  assert.ok(Object.isFrozen(result.page)&&Object.isFrozen(result.page.items)&&Object.isFrozen(movement));
  for(const external of [id,externalAccountId,itemId])assert.ok(!JSON.stringify(result).includes(external));
});

test('PII extras balances raw descriptions paid categories and payment details are never accessed',async()=>{
  const raw=page();for(const name of ['identity','balance','paymentData','merchant','descriptionRaw','category','providerId'])Object.defineProperty(raw.results[0],name,{get(){throw Error('private field accessed');}});
  const result=await project(raw);assert.equal(result.kind,'page');assert.deepEqual(Object.keys(result.page.items[0]),['movementId','accountId','amountCents','currency','direction','type','status','occurredAt','description','categoryId','reversalOf']);
});

test('null amounts and PENDING do not become zero or posted income',async()=>{
  const result=await project(page([{...row,amount:null,type:'CREDIT',status:'PENDING'}]));
  assert.equal(result.kind,'page');assert.equal(result.page.items[0].amountCents,null);assert.equal(result.page.items[0].direction,'credit');assert.equal(result.page.items[0].status,'pending');assert.equal(result.page.items[0].type,'unknown');
});

test('bank sign mismatch unsupported currency status fractional cents and overflow fail without partial page',async()=>{
  for(const change of [{amount:1},{type:'CREDIT',amount:-1},{currencyCode:'JPY'},{status:'CANCELLED'},{type:'OTHER'},{amount:0.001},{amount:90071992547410},{date:'2026-02-30T12:00:00Z'},{description:'bad\ntext'}]){
    assert.deepEqual(await project(page([{...row,...change}])),{kind:'unavailable'});
  }
  const native={results:[{...row}],next:null};assert.deepEqual(await project(native),{kind:'unavailable'});
});

test('external account IDOR credit account scope window and page limits fail before key access',async()=>{
  let reads=0;const read=()=>{reads++;return key();};
  for(const [raw,ctx] of [[page([{...row,accountId:uid(99)}]),context],[page(),{...context,accountKind:'CREDIT'}],[page(),{...context,accountId:'invalid'}],[page(),{...context,window:{dateFrom:'2026-09-01',dateTo:'2026-09-30'}}],[page(Array(501).fill(row)),context]])assert.deepEqual(await project(raw,ctx,read),{kind:'unavailable'});
  assert.equal(reads,0);
});

test('only trusted opaque cursor is projected and raw next keeps account window and origin restricted',async()=>{
  const ctx={...context,nextCursor:'opaque_internal_cursor_123456'};
  const result=await project(page([row],next),ctx);assert.equal(result.kind,'page');assert.equal(result.page.nextCursor,ctx.nextCursor);assert.ok(!JSON.stringify(result).includes(next));
  for(const [raw,c] of [[page([row],next),context],[page(),ctx],[page([row],'https://evil.invalid'),ctx],[page([row],next.replace(externalAccountId,uid(99))),ctx],[page([row],next.replace('2026-10-31','2026-11-01')),ctx],[page([row],next),{...ctx,nextCursor:next}]])assert.deepEqual(await project(raw,c),{kind:'unavailable'});
});

test('the following UTC day belongs to the prior Brasília month and outside rows are not promoted',async()=>{
  const ctx={...context,window:{dateFrom:'2026-11-01',dateTo:'2026-11-01'}};
  const result=await project(page([{...row,date:'2026-11-01T02:59:59Z'},{...row,id:uid(7),date:'2026-11-01T03:00:00Z'}]),ctx);
  assert.equal(result.kind,'page');assert.equal(result.page.items.length,1);assert.equal(result.page.items[0].occurredAt,'2026-11-01T02:59:59.000Z');
  assert.deepEqual(await project(page([{...row,date:'2026-10-31T12:00:00Z'}]),ctx),{kind:'unavailable'});
});

test('identical duplicate is idempotent but conflicting movement invalidates the whole page',async()=>{
  assert.equal((await project(page([row,row]))).page.items.length,1);
  assert.deepEqual(await project(page([row,{...row,amount:-2}])),{kind:'unavailable'});
});

test('description is literal NFC and bounded without splitting a Unicode character',async()=>{
  const result=await project(page([{...row,description:'e\u0301'+'x'.repeat(238)+'😀'+'z'.repeat(10)}]));
  assert.equal(result.kind,'page');assert.equal(result.page.items[0].description,'é'+'x'.repeat(238));
  const url=await project(page([{...row,description:'https://example.invalid/<script>'}]));assert.equal(url.page.items[0].description,'https://example.invalid/<script>');
});

test('payload and trusted scope are snapshotted before async key acquisition and abort discards late result',async()=>{
  let release;const pending=new Promise(resolve=>{release=resolve;});
  const raw=page(),ctx={...context};const result=project(raw,ctx,()=>pending);
  raw.results[0].description='changed after validation';ctx.accountId=uid(99);release(key());
  const complete=await result;assert.equal(complete.kind,'page');assert.equal(complete.page.accountId,accountId);assert.equal(complete.page.items[0].description,row.description);
  const controller=new AbortController();let finish;const waiting=new Promise(resolve=>{finish=resolve;});
  const cancelled=project(page(),context,()=>waiting,{...policy,signal:controller.signal});controller.abort();finish(key());assert.deepEqual(await cancelled,{kind:'unavailable'});
});

test('projection integrates with local normalizer and preserves manual classification across updates',async()=>{
  const local={ownerSubject,connectionId,accountId,institutionId:'bradesco',month:'2026-10',allowedAccountIds:[accountId],categoryIds:['food'],confirmedOwnTransferIds:[]};
  const normalize=async raw=>{const p=await project(raw);assert.equal(p.kind,'page');return normalizeMovementPage(p.page,local,{enabled:true,privateDataApproved:true});};
  const ledger=new MemoryLedger(()=>({subject:ownerSubject,generation:1,unlocked:true}));
  ledger.createCategory({ownerSubject,id:'food',name:'Food'});
  const promote=rows=>ledger.promote(ledger.beginImport({source:'connection:'+connectionId,accountId,month:'2026-10'}),rows.items,rows.complete);
  const first=await normalize(page());assert.equal(first.partial,true);promote(first);const ref=first.items[0];
  ledger.setOverride(ref,{categoryId:'food',type:'expense'});
  const second=await normalize(page([{...row,amount:-1.29}]));promote(second);
  assert.equal(ledger.classificationFor(ref).categoryId,'food');assert.equal(ledger.classificationFor(ref).type,'expense');assert.equal(ledger.list({month:'2026-10'},true).summary.netCents,129);
  promote(await normalize(page([])));assert.equal(ledger.list({month:'2026-10'},false).totalCount,1);ledger.close();
});


test('explicit month continuation permits a trusted encrypted cursor only before the next UTC window',async()=>{
  const cursor='v1.'+'x'.repeat(50);
  assert.equal((await project(page(),{...context,nextCursor:cursor,continueMonth:true})).kind,'page');
  assert.deepEqual(await project(page(),{...context,nextCursor:cursor}),{kind:'unavailable'});
  assert.deepEqual(await project(page(),{...context,nextCursor:cursor,continueMonth:true,window:{dateFrom:'2026-11-01',dateTo:'2026-11-01'}}),{kind:'unavailable'});
  assert.deepEqual(await project(page([row],next),{...context,nextCursor:cursor,continueMonth:true}),{kind:'unavailable'});
});
