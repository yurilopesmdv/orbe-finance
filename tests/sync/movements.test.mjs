import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normalizeMovementPage } from '../../src/features/sync/movements.ts';
import { MemoryLedger } from '../../src/data/local/ledger.ts';
import { calculateExpenses } from '../../src/domain/expenses.ts';
const ownerSubject='00000000-0000-4000-8000-000000000001',connectionId='00000000-0000-4000-8000-000000000021',accountId='00000000-0000-4000-8000-000000000031',other='00000000-0000-4000-8000-000000000032';
const id='00000000-0000-4000-8000-000000000041',second='00000000-0000-4000-8000-000000000042',third='00000000-0000-4000-8000-000000000043';
const enabled={enabled:true,privateDataApproved:true};
const context={ownerSubject,connectionId,accountId,institutionId:'bradesco',month:'2026-10',allowedAccountIds:[accountId,other],categoryIds:['food','health'],confirmedOwnTransferIds:[]};
const row={movementId:id,accountId,amountCents:10000,currency:'BRL',direction:'debit',type:'expense',status:'posted',occurredAt:'2026-10-19',description:'Compra fictícia',categoryId:'food',reversalOf:null};
const page={connectionId,accountId,items:[row],nextCursor:null,windowComplete:true,sourceUpdatedAt:'2026-10-19T10:00:00Z'};
const normalize=(changes={},ctx=context)=>normalizeMovementPage({...page,...changes},ctx,enabled);
const fails=(changes,ctx)=>assert.throws(()=>normalize(changes,ctx),/^Error: invalid_movement_page$/);
const ledger=()=>new MemoryLedger(()=>({subject:ownerSubject,generation:1,unlocked:true}));
function promote(store,result,month='2026-10'){store.promote(store.beginImport({source:`connection:${connectionId}`,accountId,month}),result.items,true);}

test('off gates do not access input or context',()=>{
 const poison=new Proxy({}, {get(){throw new Error('sensitive');},ownKeys(){throw new Error('sensitive');}});
 for(const policy of [{},{enabled:true},{privateDataApproved:true}])assert.deepEqual(normalizeMovementPage(poison,poison,policy),{kind:'disabled'});
});
test('minimum projection omits extras and freezes financial values and references',()=>{
 const result=normalize({items:[{...row,cpf:'PRIVATE_SYNTHETIC',iban:'PRIVATE_SYNTHETIC',raw:{secret:'PRIVATE_SYNTHETIC'},url:'https://invalid.example'}]});
 assert.equal(result.rowCount,1);assert.equal(result.complete,true);assert.equal(result.partial,false);assert.equal(result.items[0].source,`connection:${connectionId}`);assert.equal(result.items[0].externalId,id);assert.equal(result.items[0].ownerSubject,ownerSubject);assert.ok(!JSON.stringify(result).includes('PRIVATE_SYNTHETIC'));assert.ok(Object.isFrozen(result)&&Object.isFrozen(result.items)&&Object.isFrozen(result.items[0]));
});
test('connection and account swaps reject before projection',()=>{
 fails({connectionId:other});fails({accountId:other});fails({items:[{...row,accountId:other}]});fails({}, {...context,allowedAccountIds:[other]});
});
test('trusted context and bindings must be canonical bounded own fields',()=>{
 for(const ctx of [{...context,ownerSubject:'bad'},{...context,connectionId:'bad'},{...context,institutionId:'other'},{...context,month:'2026-13'},{...context,allowedAccountIds:Array(10001).fill(accountId)},{...context,categoryIds:Array(1001).fill('food')},{...context,confirmedOwnTransferIds:['bad']},Object.create(context)])fails({},ctx);
});
test('money is nonnegative integer magnitude with independent explicit direction',()=>{
 for(const amountCents of [-1,1.2,'100',undefined,NaN,Infinity,Number.MAX_SAFE_INTEGER+1])fails({items:[{...row,amountCents}]});
 for(const direction of [null,undefined,'DEBIT','negative'])fails({items:[{...row,direction}]});
 assert.equal(normalize({items:[{...row,amountCents:0}]}).items[0].amountCents,0);
 const result=normalize({items:[{...row,amountCents:null}]});assert.equal(result.items[0].amountCents,null);assert.equal(result.partial,true);
});
test('currency never defaults to BRL or converts foreign amounts',()=>{
 for(const currency of [undefined,null,'brl','R$'])fails({items:[{...row,currency}]});
 const result=normalize({items:[{...row,currency:'USD'}]});assert.equal(result.items[0].currency,'USD');assert.equal(calculateExpenses(result.items,'2026-10').netCents,0);
});
test('civil and instant dates respect Brazil month and reject invalid times',()=>{
 assert.equal(normalize({items:[{...row,occurredAt:'2026-11-01T01:00:00Z'}]}).items[0].occurredAt,'2026-11-01T01:00:00.000Z');
 for(const occurredAt of [undefined,'2026-09-30','2026-02-30','2026-10-19T24:00:00Z','2026-10-19T12:99:00Z','2026-11-01T05:00:00Z'])fails({items:[{...row,occurredAt}]});
});
test('window completeness is independent from last page and missing source',()=>{
 for(const changes of [{windowComplete:false},{sourceUpdatedAt:null}]){const result=normalize(changes);assert.equal(result.complete,true);assert.equal(result.partial,true);}
 assert.equal(normalize({nextCursor:'p2'}).complete,false);assert.equal(normalize({items:[],windowComplete:false}).partial,true);
 for(const sourceUpdatedAt of [undefined,'2026-10-19','bad'])fails({sourceUpdatedAt});fails({windowComplete:'true'});
});
test('pending and cancelled remain visible inputs and never become posted expenses',()=>{
 const result=normalize({items:[row,{...row,movementId:second,status:'pending'},{...row,movementId:third,status:'cancelled'}]});assert.equal(result.items.length,3);assert.equal(calculateExpenses(result.items,'2026-10').netCents,10000);
 for(const status of [undefined,'UPDATED','deleted'])fails({items:[{...row,status}]});
});
test('classification requires explicit types and consistent direction',()=>{
 for(const type of [undefined,null,'pix'])fails({items:[{...row,type}]});
 for(const type of ['income','redemption','yield','refund'])fails({items:[{...row,type}]});fails({items:[{...row,direction:'credit'}]});
 assert.equal(normalize({items:[{...row,type:'unknown'}]}).partial,true);
});
test('own transfer requires a trusted identifier not Pix text or client evidence',()=>{
 const input={...row,type:'own_transfer',description:'PIX ENTRE CONTAS',trustedOwnTransfer:true};const result=normalize({items:[input]});assert.equal(result.items[0].type,'unknown');assert.equal(result.partial,true);
 const proven=normalize({items:[input]}, {...context,confirmedOwnTransferIds:[id]});assert.equal(proven.items[0].type,'own_transfer');assert.equal(calculateExpenses(proven.items,'2026-10').netCents,0);
});
test('provider category cannot escape authorized local catalog',()=>{
 for(const categoryId of [undefined,'foreign','https://bad.example',1])fails({items:[{...row,categoryId}]});
 assert.equal(normalize({items:[{...row,categoryId:null}]}).items[0].categoryId,null);
});
test('refund matches stable canonical reference: purchase100 refund20 gives80',()=>{
 const refund={...row,movementId:second,amountCents:2000,type:'refund',direction:'credit',reversalOf:{accountId,movementId:id,unused:'PRIVATE_SYNTHETIC'}};
 const result=normalize({items:[row,refund]});assert.equal(calculateExpenses(result.items,'2026-10').netCents,8000);assert.ok(Object.isFrozen(result.items[1].reversalOf));assert.ok(!JSON.stringify(result).includes('PRIVATE_SYNTHETIC'));
});
test('unlinked refund stays partial and does not reduce expense without evidence',()=>{
 const result=normalize({items:[{...row,movementId:second,type:'refund',direction:'credit',reversalOf:null}]});assert.equal(result.partial,true);const summary=calculateExpenses(result.items,'2026-10');assert.equal(summary.netCents,0);assert.equal(summary.partial,true);
});
test('refund references cannot cross unbound accounts or self-reference',()=>{
 for(const reversalOf of [{accountId,movementId:id},{accountId:'00000000-0000-4000-8000-000000000099',movementId:second},{accountId,movementId:'bad'}])fails({items:[{...row,type:'refund',direction:'credit',reversalOf}]});
 fails({items:[{...row,reversalOf:{accountId,movementId:second}}]});
});
test('description is bounded literal data with no interpreted URL or HTML',()=>{
 const description='  <script>fetch("https://invalid.example")</script>  ';const result=normalize({items:[{...row,description}]});assert.equal(result.items[0].description,description.trim());
 for(const description of [undefined,null,'x'.repeat(241),'line\nsecret','nul\u0000'])fails({items:[{...row,description}]});
});
test('dedupe counts input rows and rejects conflicting change within a page',()=>{
 assert.equal(normalize({items:[row,{...row}]}).items.length,1);assert.equal(normalize({items:[row,{...row}]}).rowCount,2);
 for(const patch of [{amountCents:1},{description:'different'},{status:'pending'},{categoryId:null}])fails({items:[row,{...row,...patch}]});
});
test('page limits cursor and own fields reject malformed input with generic errors',()=>{
 fails({items:Array(1001).fill(row)});assert.equal(normalize({items:Array(1000).fill(row)}).rowCount,1000);
 for(const nextCursor of [undefined,'',1,'x'.repeat(513),'a\n'])fails({nextCursor});fails({items:[Object.create(row)]});
 assert.throws(()=>normalize({items:[{...row,get description(){throw new Error('PRIVATE_SYNTHETIC');}}]}),/^Error: invalid_movement_page$/);
});
test('ledger override survives updated provider classification and absent rows',()=>{
 const store=ledger();for(const category of ['food','health'])store.createCategory({ownerSubject,id:category,name:category});
 const result=normalize();promote(store,result);const ref=result.items[0];store.setOverride(ref,{categoryId:'health'});
 promote(store,normalize({items:[{...row,amountCents:11000,categoryId:'food'}]}));assert.equal(store.classificationFor(ref).categoryId,'health');assert.equal(store.list({month:'2026-10'},true).summary.netCents,11000);
 promote(store,normalize({items:[],windowComplete:false}));assert.equal(store.list({month:'2026-10'},false).totalCount,1);
});
test('refund from prior month uses ledger evidence without moving original occurrence',()=>{
 const store=ledger();promote(store,normalize({items:[{...row,occurredAt:'2026-09-30'}]}, {...context,month:'2026-09'}),'2026-09');
 const refund={...row,movementId:second,type:'refund',direction:'credit',amountCents:2000,reversalOf:{accountId,movementId:id}};promote(store,normalize({items:[refund]}));
 assert.equal(store.list({month:'2026-09'},true).summary.netCents,10000);assert.equal(store.list({month:'2026-10'},true).summary.netCents,-2000);
});
