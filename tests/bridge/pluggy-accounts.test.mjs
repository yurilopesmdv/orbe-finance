import test from 'node:test';
import assert from 'node:assert/strict';
import { createExactJsonDecoder } from '../../supabase/functions/_shared/exact-json.ts';
import { providerCents, providerInstant, projectPluggyAccounts } from '../../supabase/functions/_shared/pluggy-accounts.ts';
import { normalizeAccountPage } from '../../src/features/sync/accounts.ts';
import { MemoryAssets } from '../../src/data/local/assets.ts';
const decode=createExactJsonDecoder(), uid=n=>`00000000-0000-4000-8000-${String(n).padStart(12,'0')}`;
const itemId=uid(1),connectionId=uid(2),externalId=uid(3),internalId=uid(4),ownerSubject=uid(5), date='2026-10-20T10:00:00Z';
const context={itemId,connectionId,bindings:[{externalId,internalId,balanceAsOf:date,relation:'distinct'}],sourceUpdatedAt:date,coverageApproved:true};
const policy={enabled:true,fixtureOnly:true};
const row={id:externalId,itemId,type:'BANK',currencyCode:'BRL',balance:0.29};
const page=(rows=[row],changes={})=>decode(JSON.stringify({page:1,total:rows.length,totalPages:1,results:rows,...changes}));
const project=(raw=page(),ctx=context)=>projectPluggyAccounts(raw,ctx,policy);
const fails=(raw,ctx)=>assert.throws(()=>project(raw,ctx),/^Error: provider_account_invalid$/);
test('disabled gates never inspect payload or context',()=>{
 const poison=new Proxy({},{get(){throw Error('PRIVATE');},getOwnPropertyDescriptor(){throw Error('PRIVATE');}});
 for(const gates of [{},{enabled:true},{fixtureOnly:true}])assert.deepEqual(projectPluggyAccounts(poison,poison,gates),{kind:'disabled'});
});
test('exact major units convert without floating point rounding',()=>{
 for(const [literal,expected] of [['0.29',29],['1.2300',123],['-15.10',-1510],['123e-2',123],['-0',0],['90071992547409.91',Number.MAX_SAFE_INTEGER]])assert.equal(providerCents(decode(literal)),expected);
 assert.equal(providerCents(null),null);
});
test('fractional cents overflow and unproven numeric inputs rejected',()=>{
 for(const literal of ['0.001','90071992547409.92','-90071992547409.92','1e400','1e-33'])assert.throws(()=>providerCents(decode(literal)));
 for(const value of [0.29,'0.29',{},undefined])assert.throws(()=>providerCents(value));
});
test('minimal frozen DTO discards provider PII limits names and external identity',()=>{
 const result=project(page([{...row,name:'SYNTHETIC_PRIVATE',taxNumber:'SYNTHETIC_PRIVATE',number:'SYNTHETIC_PRIVATE',bankData:{limit:999999},url:'https://private.invalid'}]));
 assert.equal(result.kind,'page');assert.equal(result.page.items[0].balanceCents,29);assert.equal(result.page.items[0].id,internalId);assert.equal(result.page.authoritative,true);
 const output=JSON.stringify(result);assert.ok(!output.includes('SYNTHETIC_PRIVATE')&&!output.includes(externalId)&&!output.includes(itemId));
 assert.ok(Object.isFrozen(result)&&Object.isFrozen(result.page)&&Object.isFrozen(result.page.items)&&Object.isFrozen(result.page.items[0]));
});
test('scope mapping and duplicate accounts fail closed',()=>{
 for(const change of [{itemId:uid(99)},{id:uid(99)},{id:'invalid'},{type:'INVESTMENT'}])fails(page([{...row,...change}]));
 fails(page([row,row]));fails(page(),{...context,bindings:[context.bindings[0],context.bindings[0]]});
 fails(page(),{...context,bindings:[context.bindings[0],{...context.bindings[0],externalId:uid(99)}]});
});
test('credit accounts excluded and never inflate wealth through limits',()=>{
 const result=project(page([{...row,type:'CREDIT',balance:999999,creditData:{availableCreditLimit:999999}}]));
 assert.deepEqual(result.page.items,[]);assert.equal(result.coverage.excludedCreditCount,1);assert.equal(result.page.authoritative,false);
});
test('unknown units preserve currency and unknown balance rather than assuming BRL',()=>{
 const result=project(page([{...row,currencyCode:'JPY'}]));assert.equal(result.page.items[0].currency,'JPY');assert.equal(result.page.items[0].balanceCents,null);assert.equal(result.coverage.unsupportedCurrencyCount,1);assert.equal(result.page.authoritative,false);
 for(const currencyCode of ['brl','R$','BRL ',null])fails(page([{...row,currencyCode}]));
 fails({...page(),results:[{...row,currencyCode:'JPY',balance:1}]});
});
test('unknown balance source valuation or relation prevents authoritative removal',()=>{
 for(const ctx of [{...context,sourceUpdatedAt:null},{...context,coverageApproved:false},{...context,bindings:[{...context.bindings[0],balanceAsOf:null}]},{...context,bindings:[{...context.bindings[0],relation:'unknown'}]}])assert.equal(project(page(),ctx).page.authoritative,false);
 for(const balance of [null,-1])assert.equal(project(page([{...row,balance}])).page.authoritative,false);
 assert.equal(project(page([]),{...context,coverageApproved:false}).page.authoritative,false);
});
test('malformed timestamps never inferred from provider status or updatedAt',()=>{
 for(const sourceUpdatedAt of ['2026-02-30T10:00:00Z','2026-10-20T24:00:00Z',undefined])fails(page(),{...context,sourceUpdatedAt});
 const result=project(page([{...row,updatedAt:date,status:'UPDATED'}]),{...context,bindings:[{...context.bindings[0],balanceAsOf:null}]});assert.equal(result.page.items[0].balanceAsOf,null);
});
test('bounded complete page requires original counters and consistent pagination',()=>{
 for(const changes of [{page:2},{total:2},{totalPages:2},{totalPages:0}])fails(page([row],changes));
 fails({...page(),page:1});fails({...page(),results:Array(1001).fill(page().results[0])});
 assert.equal(project(page([],{totalPages:0})).page.authoritative,true);
});
test('required fields must be own properties and errors do not echo payload',()=>{
 fails(Object.create(page()));fails(page(),Object.create(context));
 for(const key of ['coverageApproved','sourceUpdatedAt','bindings']){const ctx={...context};delete ctx[key];Object.setPrototypeOf(ctx,{[key]:context[key]});fails(page(),ctx);}
 for(const key of ['relation','balanceAsOf']){const binding={...context.bindings[0]};delete binding[key];Object.setPrototypeOf(binding,{[key]:context.bindings[0][key]});fails(page(),{...context,bindings:[binding]});}
 fails({...page(),get results(){throw Error('SYNTHETIC_PRIVATE');}});
});
test('exact provider projection integrates with normalization and invalid batch preserves cache',()=>{
 const normalize=raw=>normalizeAccountPage(project(raw).page,{ownerSubject,connectionId,institutionId:'bradesco',allowedAccountIds:[internalId]},{enabled:true,privateDataApproved:true});
 const store=new MemoryAssets(()=>({subject:ownerSubject,generation:1,unlocked:true})),scope={connectionId,institutionId:'bradesco',product:'account'};
 const result=normalize(page());store.promote(store.beginImport(scope),result.items,result.complete,result.authoritative);assert.equal(store.list({},true).summary.subtotalCents,29);
 const ticket=store.beginImport(scope);assert.throws(()=>normalize(page([{...row,balance:0.001}])));store.abortImport(ticket);assert.equal(store.list({},true).summary.subtotalCents,29);
});


test('PostgreSQL RPC offsets and microseconds normalize without rejecting valid account bindings',()=>{
 for(const [raw,expected] of [['2026-10-23T10:00:00.123456+00:00','2026-10-23T10:00:00.123Z'],['2026-10-23T07:00:00.123456-03:00','2026-10-23T10:00:00.123Z'],['2026-10-23T23:30:00+14:00','2026-10-23T09:30:00.000Z']]){
  assert.equal(providerInstant(raw),expected);const result=project(page(),{...context,sourceUpdatedAt:raw,bindings:[{...context.bindings[0],balanceAsOf:raw}]});assert.equal(result.page.sourceUpdatedAt,expected);assert.equal(result.page.items[0].balanceAsOf,expected);assert.equal(result.page.items[0].balanceCents,29);
 }
 assert.equal(providerInstant(null),null);
});
test('invalid calendar clock timezone and excess precision remain rejected',()=>{
 for(const raw of ['2026-02-30T10:00:00+00:00','2026-10-23T24:00:00+00:00','2026-10-23T10:60:00Z','2026-10-23T10:00:60Z','2026-10-23T10:00:00+14:01','2026-10-23T10:00:00-15:00','2026-10-23T10:00:00+03:99','2026-10-23T10:00:00.1234567Z','2026-10-23T10:00:00','0000-01-01T00:00:00Z'])assert.throws(()=>providerInstant(raw),/^Error: provider_account_invalid$/);
});
