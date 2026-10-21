import test from 'node:test';
import assert from 'node:assert/strict';
import { createExactJsonDecoder } from '../../supabase/functions/_shared/exact-json.ts';
import { projectAccountInventory, projectMovementBankManifest } from '../../supabase/functions/_shared/account-inventory.ts';
const id=n=>`00000000-0000-4000-8000-${String(n).padStart(12,'0')}`,item=id(1),decode=createExactJsonDecoder(),policy={enabled:true,fixtureOnly:true};
const row=(n=2,patch={})=>({id:id(n),itemId:item,type:'BANK',currencyCode:'BRL',...patch});
const page=(rows=[row()],patch={})=>decode(JSON.stringify({page:1,total:rows.length,totalPages:1,results:rows,...patch}));
test('off and independent gates never read raw metadata',()=>{const poison=new Proxy({},{get(){throw Error('PRIVATE');}});for(const p of [{},{enabled:true},{fixtureOnly:true}])assert.deepEqual(projectAccountInventory(poison,poison,p),{kind:'disabled'});});
test('private projection contains only technical metadata and does not infer checking or bank',()=>{const value=projectAccountInventory(page([row(2,{balance:98.76,name:'PRIVATE',number:'PRIVATE',owner:'PRIVATE'})]),item,policy);assert.equal(value.kind,'inventory');assert.deepEqual(value.accounts,[{externalId:id(2),kind:'unknown',currency:'BRL'}]);assert.ok(Object.isFrozen(value)&&Object.isFrozen(value.accounts)&&Object.isFrozen(value.accounts[0]));assert.ok(!JSON.stringify(value).includes('PRIVATE'));});
test('financial and PII getters are never accessed even for credit rows',()=>{const value=page([row(),row(3,{type:'CREDIT'})]);for(const row of value.results){for(const key of ['balance','owner','number','name','creditData','identity'])Object.defineProperty(row,key,{get(){throw Error('PRIVATE');}});}Object.defineProperty(value.results[1],'currencyCode',{get(){throw Error('PRIVATE');}});const result=projectAccountInventory(value,item,policy);assert.equal(result.creditAccounts,1);assert.deepEqual(result.accounts[1],{externalId:id(3),kind:'unknown',currency:null});});
test('wrong item invalid IDs duplicates and unsupported account types fail closed',()=>{for(const rows of [[row(2,{itemId:id(9)})],[row(),row()],[row(2,{id:'not-id'})],[row(2,{type:'INVESTMENT'})]])assert.throws(()=>projectAccountInventory(page(rows),item,policy),/account_inventory_invalid/);});
test('numeric provenance incomplete pagination and count mismatches are rejected',()=>{for(const raw of [{page:1,total:0,totalPages:0,results:[]},page([row()],{total:2}),page([row()],{totalPages:2}),page([row()],{page:2})])assert.throws(()=>projectAccountInventory(raw,item,policy));});
test('empty page is metadata only and does not imply bank removal',()=>{assert.deepEqual(projectAccountInventory(page([],{totalPages:0}),item,policy),{kind:'inventory',accounts:[],creditAccounts:0});});
test('invalid BANK currency and page overflow rejected',()=>{for(const currency of [null,'brl','BRLL'])assert.throws(()=>projectAccountInventory(page([row(2,{currencyCode:currency})]),item,policy));assert.throws(()=>projectAccountInventory(page(Array.from({length:1001},(_,n)=>row(n+2))),item,policy));});
test('errors never propagate private field contents',()=>{const raw=page();Object.defineProperty(raw.results[0],'id',{get(){throw Error('PRIVATE');}});assert.throws(()=>projectAccountInventory(raw,item,policy),e=>e.message==='account_inventory_invalid');});

const manifestContext={itemId:item,bindings:[{externalId:id(2),internalId:id(12),kind:'unknown'},{externalId:id(3),internalId:id(13),kind:'unknown'}]};
const manifest=(raw=page([row(2),row(3,{type:'CREDIT'})]),context=manifestContext,p=policy)=>projectMovementBankManifest(raw,context,p);

test('movement manifest gates do not inspect source or context',()=>{
  const poison=new Proxy({}, {get(){throw Error('private');},getOwnPropertyDescriptor(){throw Error('private');}});
  for(const p of [{},{enabled:true},{mode:'fixture'}])assert.deepEqual(manifest(poison,poison,p),{kind:'disabled'});
});

test('BANK proof comes from validated source while unknown binding is never treated as a bank',()=>{
  const result=manifest();assert.equal(result.kind,'manifest');assert.deepEqual(result.accounts,[{accountId:id(12),externalAccountId:id(2),currency:'BRL'}]);assert.equal(result.excludedCreditCount,1);assert.equal(result.partial,true);
  assert.ok(Object.isFrozen(result)&&Object.isFrozen(result.accounts)&&Object.isFrozen(result.accounts[0]));
});

test('BANK manifest does not read names balances identity account numbers credit limits or credit currency',()=>{
  const raw=page([row(2),row(3,{type:'CREDIT'})]);
  for(const account of raw.results)for(const key of ['balance','name','identity','number','creditData','owner'])Object.defineProperty(account,key,{get(){throw Error('private accessed');}});
  Object.defineProperty(raw.results[1],'currencyCode',{get(){throw Error('credit currency not needed');}});
  assert.equal(manifest(raw).accounts.length,1);
});

test('unbound missing duplicated or invalid mappings fail instead of enlarging ownership',()=>{
  const cases=[
    [page([row(2),row(4)]),manifestContext],
    [page([row(2)]),manifestContext],
    [page([row(2),row(2)]),manifestContext],
    [page([row(2),row(3)]),{...manifestContext,bindings:[manifestContext.bindings[0],manifestContext.bindings[0]]}],
    [page([row(2),row(3)]),{...manifestContext,bindings:[manifestContext.bindings[0],{externalId:id(3),internalId:id(12)}]}],
    [page([row(2),row(3)]),{...manifestContext,bindings:[manifestContext.bindings[0],{externalId:id(3),internalId:'invalid'}]}],
    [page([row(2,{id:id(2)+'\n'}),row(3)]),manifestContext],
  ];
  for(const [raw,context] of cases)assert.throws(()=>manifest(raw,context),/^Error: movement_manifest_invalid$/);
});

test('unsupported currency is counted as exclusion and never silently interpreted as BRL',()=>{
  const context={itemId:item,bindings:[{externalId:id(2),internalId:id(12)},{externalId:id(3),internalId:id(13)},{externalId:id(4),internalId:id(14)}]};
  const result=manifest(page([row(2),row(3,{currencyCode:'JPY'}),row(4,{type:'CREDIT'})]),context);
  assert.equal(result.accounts.length,1);assert.equal(result.unsupportedCurrencyCount,1);assert.equal(result.excludedCreditCount,1);assert.equal(result.partial,true);
});

test('source ordering does not change internal account ordering or cursor AAD',async()=>{
  const {createTransactionCursor}=await import('../../supabase/functions/_shared/transaction-cursor.ts');
  const raw=page([row(2),row(3)]),reverse=page([row(3),row(2)]);
  const a=manifest(raw),b=manifest(reverse);assert.deepEqual(a.accounts,b.accounts);assert.deepEqual(a.accounts.map(row=>row.accountId),[id(12),id(13)]);
  const scope={ownerSubject:id(20),sessionId:id(21),connectionId:id(22),revision:1,leaseId:id(23),expiresAt:121000,month:'2026-10',itemId:item,accounts:a.accounts};
  const p={enabled:true,mode:'fixture',now:()=>1000},key=()=>new Uint8Array(32).fill(7);
  const writer=createTransactionCursor(key,scope,p),reader=createTransactionCursor(key,{...scope,accounts:b.accounts},p);
  const query='?accountId='+id(2)+'&dateFrom=2026-10-01&dateTo=2026-10-31&after=invented_cursor';
  const result=await writer.seal(id(12),0,query);assert.equal(result.kind,'cursor');assert.equal((await reader.open(result.cursor)).kind,'position');writer.close();reader.close();
});

test('bank scope cap is explicit rather than truncating or promoting partial inventory',()=>{
  const rows=Array.from({length:101},(_,n)=>row(n+100));
  const context={itemId:item,bindings:rows.map((row,n)=>({externalId:row.id,internalId:id(n+1000)}))};
  assert.throws(()=>manifest(page(rows),context),/^Error: movement_manifest_invalid$/);
  assert.deepEqual(manifest(page([],{totalPages:0}),{itemId:item,bindings:[]}),{kind:'manifest',accounts:[],excludedCreditCount:0,unsupportedCurrencyCount:0,partial:false});
});
