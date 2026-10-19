import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normalizePositionPage } from '../../src/features/sync/positions.ts';
import { reconcilePortfolio } from '../../src/domain/portfolio.ts';
const ownerSubject='00000000-0000-4000-8000-000000000001',connectionId='00000000-0000-4000-8000-000000000021',id='00000000-0000-4000-8000-000000000041',second='00000000-0000-4000-8000-000000000042',accountId='00000000-0000-4000-8000-000000000031';
const enabled={enabled:true,privateDataApproved:true};
const context={ownerSubject,connectionId,institutionId:'bradesco',product:'investment',allowedPositionIds:[id,second],allowedParents:[{product:'account',id:accountId},{product:'investment',id},{product:'investment',id:second},{product:'reserve',id},{product:'reserve',id:second}]};
const row={id,connectionId,product:'investment',currency:'BRL',grossCents:15000,netCents:14000,valueBasis:'net',asOf:'2026-10-19',relation:'distinct',parent:null,assetClass:'fixed_income',kind:'asset'};
const page={connectionId,product:'investment',items:[row],nextCursor:null,authoritative:true,sourceUpdatedAt:'2026-10-19T10:00:00Z'};
const normalize=(changes={},ctx=context)=>normalizePositionPage({...page,...changes},ctx,enabled);
const fails=(changes,ctx)=>assert.throws(()=>normalize(changes,ctx),/^Error: invalid_position_page$/);
const reserve=(patch={})=>({...row,product:'reserve',grossCents:2000,netCents:2000,...patch});
const reserveContext={...context,product:'reserve'};
const account={id:`account:${connectionId}:${accountId}`,currency:'BRL',amountCents:100000,asOf:'2026-10-19',kind:'asset',relation:'distinct'};

test('both gates avoid raw and context access',()=>{const poison=new Proxy({}, {get(){throw new Error('sensitive');},ownKeys(){throw new Error('sensitive');}});for(const policy of [{},{enabled:true},{privateDataApproved:true}])assert.deepEqual(normalizePositionPage(poison,poison,policy),{kind:'disabled'});});
test('gross net and selected basis stay distinct without inferred availability',()=>{
 const net=normalize();assert.equal(net.items[0].amountCents,14000);assert.equal(net.items[0].grossCents,15000);assert.equal(net.items[0].netCents,14000);assert.equal(net.items[0].valueBasis,'net');assert.equal(net.items[0].assetClass,'fixed_income');assert.equal(net.partial,false);assert.equal('availableCents'in net.items[0],false);
 const gross=normalize({items:[{...row,valueBasis:'gross'}]});assert.equal(gross.items[0].amountCents,15000);
 const unknown=normalize({items:[{...row,valueBasis:'unknown'}]});assert.equal(unknown.items[0].amountCents,null);assert.equal(unknown.partial,true);assert.equal(unknown.authoritative,false);
});
test('missing selected value remains null rather than falling back to another value',()=>{
 const result=normalize({items:[{...row,netCents:null}]});assert.equal(result.items[0].amountCents,null);assert.equal(result.items[0].grossCents,15000);assert.equal(result.partial,true);
 assert.equal(normalize({items:[{...row,grossCents:null}]}).items[0].amountCents,14000);
});
test('internal bindings connection product institution and own fields are required',()=>{
 fails({connectionId:accountId});fails({product:'reserve'});fails({items:[{...row,id:accountId}]});fails({items:[{...row,connectionId:accountId}]});fails({items:[{...row,product:'reserve'}]});fails({}, {...context,institutionId:'other'});fails({},Object.create(context));fails({items:[Object.create(row)]});
});
test('cent values never coerce decimals strings overflow or missing fields',()=>{
 for(const value of [undefined,'12',1.2,NaN,Infinity,Number.MAX_SAFE_INTEGER+1])for(const field of ['grossCents','netCents'])fails({items:[{...row,[field]:value}]});
 for(const currency of [undefined,null,'brl','R$'])fails({items:[{...row,currency}]});
 const result=normalize({items:[{...row,currency:'USD',grossCents:0,netCents:0}]});assert.equal(result.items[0].amountCents,0);assert.equal(reconcilePortfolio(result.items).subtotalCents,0);assert.deepEqual(reconcilePortfolio(result.items).otherCurrencies,['USD']);
});
test('negative value is retained and excluded from positive assets',()=>{const result=normalize({items:[{...row,grossCents:-100,netCents:-100}]});assert.equal(result.items[0].amountCents,-100);assert.equal(result.partial,true);assert.equal(reconcilePortfolio(result.items).subtotalCents,0);});
test('reserve included in account does not increase consolidated assets',()=>{
 const result=normalize({product:'reserve',items:[reserve({relation:'included',parent:{product:'account',id:accountId}})]},reserveContext);assert.equal(result.items[0].includedIn,account.id);assert.equal(reconcilePortfolio([...result.items,account]).subtotalCents,100000);assert.equal(reconcilePortfolio(result.items).partial,true);
});
test('automatic investment included in account and reserve allocation never duplicate assets',()=>{
 const included=normalize({items:[{...row,relation:'included',parent:{product:'account',id:accountId}}]});assert.equal(reconcilePortfolio([...included.items,account]).subtotalCents,100000);
 const allocation=normalize({product:'reserve',items:[reserve({kind:'allocation',relation:'included',parent:{product:'account',id:accountId}})]},reserveContext);assert.equal(reconcilePortfolio([...allocation.items,account]).subtotalCents,100000);
 fails({items:[{...row,kind:'allocation'}]});
});
test('unknown overlap excludes component and never guesses relation from name',()=>{
 const result=normalize({items:[{...row,relation:'unknown',name:'Cofrinho disponível'}]});assert.equal(result.partial,true);assert.equal(reconcilePortfolio([...result.items,account]).subtotalCents,100000);assert.equal(result.items[0].relation,'unknown');assert.equal('name'in result.items[0],false);
});
test('parent must be explicitly permitted and self inconsistent or cyclic relations fail',()=>{
 fails({items:[{...row,relation:'included',parent:{product:'account',id:second}}]});fails({items:[{...row,relation:'included',parent:{product:'investment',id}}]});fails({items:[{...row,parent:{product:'account',id:accountId}}]});fails({items:[{...row,relation:'included',parent:null}]});
 const one={...row,relation:'included',parent:{product:'investment',id:second}},two={...row,id:second,relation:'included',parent:{product:'investment',id}};fails({items:[one,two]});
});
test('same-page inclusion requires matching currency valid parent and bounded child value',()=>{
 const root=reserve({grossCents:10000,netCents:10000}),child=reserve({id:second,relation:'included',parent:{product:'reserve',id}});
 assert.equal(reconcilePortfolio(normalize({product:'reserve',items:[root,child]},reserveContext).items).subtotalCents,10000);
 fails({product:'reserve',items:[root,{...child,currency:'USD'}]},reserveContext);fails({product:'reserve',items:[root,{...child,netCents:20000}]},reserveContext);fails({product:'reserve',items:[{...root,kind:'allocation'},child]},reserveContext);
});
test('dates are strict source unknown never confirms empty deletion',()=>{
 for(const asOf of [undefined,'2026-02-30','2026-10-19T24:00:00Z','today'])fails({items:[{...row,asOf}]});
 assert.equal(normalize({items:[{...row,asOf:null}]}).partial,true);assert.equal(normalize({items:[{...row,asOf:'2026-10-19T07:00:00-03:00'}]}).items[0].asOf,'2026-10-19T10:00:00.000Z');
 const unknown=normalize({items:[],sourceUpdatedAt:null});assert.equal(unknown.authoritative,false);assert.equal(unknown.partial,true);fails({sourceUpdatedAt:'2026-10-19'});
});
test('identical duplicate is idempotent but divergent valuations or classes reject whole page',()=>{
 const result=normalize({items:[row,{...row}]});assert.equal(result.items.length,1);assert.equal(result.rowCount,2);
 for(const patch of [{grossCents:15001},{netCents:14001},{assetClass:'equity'},{valueBasis:'gross'}])fails({items:[row,{...row,...patch}]});
});
test('limits and enums forbid unbounded or ambiguous position contents',()=>{
 fails({items:Array(1001).fill(row)});assert.equal(normalize({items:Array(1000).fill(row)}).rowCount,1000);fails({}, {...context,allowedPositionIds:Array(10001).fill(id)});fails({}, {...context,allowedParents:Array(10001).fill({product:'account',id:accountId})});
 for(const nextCursor of [undefined,'',1,'x'.repeat(513),'a\n'])fails({nextCursor});assert.equal(normalize({nextCursor:'page2'}).complete,false);
 for(const patch of [{valueBasis:null},{assetClass:'guaranteed'},{kind:'credit_limit'},{relation:undefined}])fails({items:[{...row,...patch}]});
});
test('projection frozen and minimal does not retain PII or raw error text',()=>{
 const result=normalize({items:[{...row,cpf:'PRIVATE_SYNTHETIC',number:'PRIVATE_SYNTHETIC',raw:{secret:'PRIVATE_SYNTHETIC'}}],secret:'PRIVATE_SYNTHETIC'});assert.ok(Object.isFrozen(result)&&Object.isFrozen(result.items)&&Object.isFrozen(result.items[0]));assert.ok(!JSON.stringify(result).includes('PRIVATE_SYNTHETIC'));
 assert.throws(()=>normalize({items:[{...row,get grossCents(){throw new Error('PRIVATE_SYNTHETIC');}}]}),/^Error: invalid_position_page$/);
});
