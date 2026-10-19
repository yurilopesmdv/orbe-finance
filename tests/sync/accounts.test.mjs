import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normalizeAccountPage } from '../../src/features/sync/accounts.ts';
import { MemoryAssets } from '../../src/data/local/assets.ts';
const connectionId='00000000-0000-4000-8000-000000000021', ownerSubject='00000000-0000-4000-8000-000000000001', id='00000000-0000-4000-8000-000000000031', other='00000000-0000-4000-8000-000000000032';
const context={ownerSubject,connectionId,institutionId:'bradesco',allowedAccountIds:[id,other]};
const enabled={enabled:true,privateDataApproved:true};
const row={id,connectionId,currency:'BRL',balanceCents:12345,balanceAsOf:'2026-10-19',relation:'distinct'};
const page={connectionId,items:[row],nextCursor:null,authoritative:true,sourceUpdatedAt:'2026-10-19T10:00:00Z'};
const normalize=(changes={},ctx=context)=>normalizeAccountPage({...page,...changes},ctx,enabled);
const fails=(changes,ctx)=>assert.throws(()=>normalize(changes,ctx),/^Error: invalid_account_page$/);

test('both gates return disabled before reading raw or context',()=>{
 const poison=new Proxy({}, {get(){throw new Error('sensitive');},ownKeys(){throw new Error('sensitive');}});
 for(const policy of [{},{enabled:true},{privateDataApproved:true}]) assert.deepEqual(normalizeAccountPage(poison,poison,policy),{kind:'disabled'});
});
test('canonical account output is minimal frozen and independent from input',()=>{
 const input={...row,name:'PRIVATE_SYNTHETIC_NAME',number:'SYNTHETIC_ACCOUNT',cpf:'SYNTHETIC_CPF',url:'https://invalid.example'};
 const result=normalize({items:[input],secret:'SYNTHETIC_SECRET'});
 assert.equal(result.kind,'page'); assert.equal(result.complete,true); assert.equal(result.authoritative,true); assert.equal(result.partial,false);
 assert.deepEqual(result.items[0],{ownerSubject,connectionId,institutionId:'bradesco',product:'account',id:`account:${connectionId}:${id}`,currency:'BRL',amountCents:12345,asOf:'2026-10-19',kind:'asset',relation:'distinct'});
 assert.ok(Object.isFrozen(result)&&Object.isFrozen(result.items)&&Object.isFrozen(result.items[0]));
 assert.ok(!JSON.stringify(result).includes('SYNTHETIC')); input.balanceCents=1; assert.equal(result.items[0].amountCents,12345);
});
test('valid UUID alone does not permit foreign account or connection',()=>{
 fails({items:[{...row,id:'00000000-0000-4000-8000-000000000099'}]}); fails({connectionId:other}); fails({items:[{...row,connectionId:other}]});
});
test('context requires canonical owner connection institution and bounded bindings',()=>{
 for(const ctx of [{...context,ownerSubject:'bad'},{...context,connectionId:'bad'},{...context,institutionId:'unknown'},{...context,allowedAccountIds:[1]},{...context,allowedAccountIds:Array(10001).fill(id)},Object.create(context)]) fails({},ctx);
});
test('null amount date and relation remain unknown rather than invented zero',()=>{
 const result=normalize({items:[{...row,balanceCents:null,balanceAsOf:null,relation:'unknown'}]});
 assert.equal(result.items[0].amountCents,null); assert.equal(result.items[0].asOf,null); assert.equal(result.partial,true); assert.equal(result.authoritative,false);
});
test('negative account balance preserved and not counted as positive wealth',()=>{
 const result=normalize({items:[{...row,balanceCents:-123}]}); assert.equal(result.items[0].amountCents,-123); assert.equal(result.partial,true);
 const store=new MemoryAssets(()=>({subject:ownerSubject,generation:1,unlocked:true})); const ticket=store.beginImport({connectionId,institutionId:'bradesco',product:'account'}); store.promote(ticket,result.items,true,result.authoritative); assert.equal(store.list({},true).summary.subtotalCents,0);
});
test('safe integer cents and explicit currencies prohibit coercion and false BRL',()=>{
 for(const balanceCents of [undefined,'1',1.2,NaN,Infinity,Number.MAX_SAFE_INTEGER+1]) fails({items:[{...row,balanceCents}]});
 for(const currency of [undefined,null,'brl','R$','BRL ']) fails({items:[{...row,currency}]});
 assert.equal(normalize({items:[{...row,currency:'USD',balanceCents:Number.MAX_SAFE_INTEGER}]}).items[0].currency,'USD');
});
test('invalid civil dates time fields and source dates reject whole page',()=>{
 for(const balanceAsOf of [undefined,'2026-02-30','2026-10-19T24:00:00Z','2026-10-19T12:99:00Z','today',123]) fails({items:[{...row,balanceAsOf}]});
 for(const sourceUpdatedAt of [undefined,'2026-10-19','2026-02-30T12:00:00Z',123]) fails({sourceUpdatedAt});
 const result=normalize({items:[{...row,balanceAsOf:'2026-10-19T07:00:00-03:00'}]}); assert.equal(result.items[0].asOf,'2026-10-19T10:00:00.000Z');
});
test('missing source cannot authorize removal even for empty or UPDATED collections',()=>{
 const result=normalize({items:[],sourceUpdatedAt:null,status:'UPDATED'}); assert.equal(result.partial,true); assert.equal(result.authoritative,false);
 assert.equal(normalize({items:[],authoritative:false}).authoritative,false); assert.equal(normalize({items:[]}).authoritative,true);
});
test('identical duplicates deduplicate but conflicting rows invalidate the page',()=>{
 assert.equal(normalize({items:[row,{...row}]}).items.length,1);
 for(const altered of [{balanceCents:1},{currency:'USD'},{balanceAsOf:null},{relation:'unknown'}]) fails({items:[row,{...row,...altered}]});
});
test('strict page limits and cursor prevent unbounded traversal',()=>{
 fails({items:Array(1001).fill(row)}); assert.equal(normalize({items:Array(1000).fill(row)}).items.length,1);
 for(const nextCursor of ['',1,undefined,'x'.repeat(513),'abc\n','abc\u007f']) fails({nextCursor});
 const result=normalize({nextCursor:'cursor-2'}); assert.equal(result.complete,false); assert.equal(result.nextCursor,'cursor-2');
});
test('required own fields and relation prevent inferred or inherited balances',()=>{
 fails({items:[Object.create(row)]}); for(const relation of [undefined,null,'included','other']) fails({items:[{...row,relation}]});
 fails({authoritative:'true'}); assert.throws(()=>normalizeAccountPage(Object.create(page),context,enabled),/invalid_account_page/);
});
test('getter failure sanitizes errors without echoing private input',()=>{
 assert.throws(()=>normalize({items:[{...row,get balanceCents(){throw new Error('SYNTHETIC_PRIVATE_ERROR');}}]}),/^Error: invalid_account_page$/);
});
test('failed second page leaves last store snapshot unchanged and empty unconfirmed preserves it',()=>{
 const store=new MemoryAssets(()=>({subject:ownerSubject,generation:1,unlocked:true})); const scope={connectionId,institutionId:'bradesco',product:'account'};
 let result=normalize(); store.promote(store.beginImport(scope),result.items,result.complete,result.authoritative);
 const ticket=store.beginImport(scope); assert.throws(()=>normalize({items:[{...row,balanceCents:'bad'}]}),/invalid_account_page/); store.abortImport(ticket);
 assert.equal(store.list({},true).summary.subtotalCents,12345);
 result=normalize({items:[],sourceUpdatedAt:null}); store.promote(store.beginImport(scope),result.items,result.complete,result.authoritative); assert.equal(store.list({},true).summary.subtotalCents,12345); assert.equal(store.list({},true).summary.partial,true);
});
test('local identity is namespaced per connection and explicit account binding',()=>{
 const first=normalize().items[0]; const secondContext={...context,connectionId:other}; const second=normalize({connectionId:other,items:[{...row,connectionId:other}]},secondContext).items[0]; assert.notEqual(first.id,second.id);
});
