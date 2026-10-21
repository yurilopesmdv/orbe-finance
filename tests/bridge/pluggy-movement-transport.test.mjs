import test from 'node:test';
import assert from 'node:assert/strict';
import { createPluggyMovementsPort } from '../../supabase/functions/_shared/pluggy-auth.ts';
import { createAccountNetworkTransport } from '../../supabase/functions/_shared/account-network.ts';
import { createMovementStager } from '../../src/features/sync/movement-staging.ts';
import { MemoryLedger } from '../../src/data/local/ledger.ts';
const uid=n=>`00000000-0000-4000-8000-${String(n).padStart(12,'0')}`;
const context=()=>({itemId:uid(1),connectionId:uid(2),bindings:[3,5,7].map(n=>({externalId:uid(n),internalId:uid(n+1),balanceAsOf:null,relation:'unknown'})),coverageApproved:false,sourceUpdatedAt:null});
const request=(patch={})=>({ownerSubject:uid(9),sessionId:uid(10),revision:1,leaseId:uid(11),leaseExpiresAt:121000,month:'2026-10',cursor:null,...patch});
const config={clientId:'invented-client',clientSecret:'invented-secret-12345'},apiKey='invented-provider-key-12345';
const keys=()=>({identityKey:new Uint8Array(32).fill(7),cursorKey:new Uint8Array(32).fill(9)});
const json=(body,status=200)=>new Response(JSON.stringify(body),{status,headers:{'Content-Type':'application/json'}});
const item=()=>({id:uid(1),connector:{name:'MeuPluggy',isSandbox:false},status:'UPDATED',executionStatus:'SUCCESS',error:null,consentExpiresAt:'2099-01-01T00:00:00Z',lastUpdatedAt:null,products:['ACCOUNTS','TRANSACTIONS']});
const inventory=ctx=>({page:1,total:ctx.bindings.length,totalPages:ctx.bindings.length?1:0,results:ctx.bindings.map(row=>({id:row.externalId,itemId:ctx.itemId,type:row.externalId===uid(7)?'CREDIT':'BANK',currencyCode:'BRL',balance:99999,identity:'SYNTHETIC_PRIVATE'}))});
const signal=()=>new AbortController().signal,flush=()=>new Promise(resolve=>setImmediate(resolve));
class Clock{value=1000;id=0;timers=new Map();now(){return this.value;}setTimer(fn,ms){const id=++this.id;this.timers.set(id,{fn,at:this.value+ms});return id;}clearTimer(id){this.timers.delete(id);}tick(ms){this.value+=ms;for(const [id,timer]of [...this.timers])if(timer.at<=this.value){this.timers.delete(id);timer.fn();}}}
function fixture(options={}){
 const ctx=options.context??context(),month=options.month??'2026-10',calls=[],clock=new Clock();
 const network=async(url,input)=>{
  calls.push({url,input});
  if(url.endsWith('/auth'))return json({apiKey});
  if(url.includes('/items/'))return options.item?options.item(url,input):json(item());
  if(url.includes('/accounts?'))return options.inventory?options.inventory(url,input):json(inventory(ctx));
  if(options.transactions)return options.transactions(url,input);
  const parsed=new URL(url),account=parsed.searchParams.get('accountId'),later=parsed.searchParams.get('dateFrom')!==month+'-01';
  const number=Number(account.slice(-12));
  return json({results:[{id:uid(100+number*10+(later?1:0)),accountId:account,date:later?parsed.searchParams.get('dateFrom')+'T02:00:00Z':month+'-20T12:00:00Z',amount:-0.29,currencyCode:'BRL',type:'DEBIT',status:'POSTED',description:'Movimento fictício',paymentData:{private:'SYNTHETIC_PRIVATE'}}],next:null});
 };
 const transport=createAccountNetworkTransport({enabled:true,privateDataApproved:true,mode:'fixture',transactionReadsEnabled:true,transactionScope:{binding:{itemId:ctx.itemId,accountIds:ctx.bindings.map(row=>row.externalId)},month},network});
 const port=createPluggyMovementsPort(()=>config,options.keys??keys,{enabled:true,movementsEnabled:true,mode:'fixture',clock,transport});
 return{port,ctx,calls,clock};
}

test('movement feature gates never touch technical config data keys transport context or signal',async()=>{
 const poison=new Proxy({}, {get(){throw Error('private');},getOwnPropertyDescriptor(){throw Error('private');}});
 for(const options of [{},{enabled:true},{enabled:true,movementsEnabled:true}]){
  const port=createPluggyMovementsPort(()=>{throw Error();},()=>{throw Error();},{...options,get transport(){throw Error();}});
  assert.deepEqual(await port.readMovements(poison,poison,poison),{status:'disabled'});port.close();
 }
});

test('invalid independent keys or expired authorized lease make no provider requests',async()=>{
 for(const resolveKeys of [()=>({identityKey:new Uint8Array(31),cursorKey:new Uint8Array(32).fill(9)}),()=>({identityKey:new Uint8Array(32).fill(7),cursorKey:new Uint8Array(32).fill(7)}),()=>{throw Error('private-key');}]){
  const f=fixture({keys:resolveKeys});try{assert.equal((await f.port.readMovements(f.ctx,request(),signal())).status,'unavailable');assert.equal(f.calls.length,0);}finally{f.port.close();}
 }
 const f=fixture();try{assert.equal((await f.port.readMovements(f.ctx,request({leaseExpiresAt:1000}),signal())).status,'unavailable');assert.equal(f.calls.length,0);}finally{f.port.close();}
});

test('four BANK pages across two UTC windows and two accounts stage one complete local product',async()=>{
 const f=fixture(),store=new MemoryLedger(()=>({subject:uid(9),generation:1,unlocked:true}));let cursor=null,stager,pages=0;
 try{
  do{
   const result=await f.port.readMovements(f.ctx,request({cursor}),signal());assert.equal(result.status,'complete');
   assert.deepEqual(result.accountIds,[uid(4),uid(6)]);assert.equal(result.coverage.excludedCreditCount,1);assert.equal(result.coverage.partial,true);
   for(const privateValue of [apiKey,config.clientSecret,'SYNTHETIC_PRIVATE',uid(1),uid(3),uid(5),uid(7)])assert.ok(!JSON.stringify(result).includes(privateValue));
   if(!stager)stager=createMovementStager(store,{ownerSubject:uid(9),connectionId:uid(2),institutionId:'bradesco',month:'2026-10',allowedAccountIds:[uid(4),uid(6),uid(8)],accountIds:result.accountIds,categoryIds:[],confirmedOwnTransfers:[]},{enabled:true,privateDataApproved:true});
   const work=stager.prepare(result.envelope,{connectionId:uid(2),revision:1,leaseId:uid(11),product:'transactions',cursor});work.stage(signal());
   if(pages===0)assert.equal(result.envelope.page.nextCursor,result.envelope.nextCursor);
   if(pages===1){assert.equal(result.envelope.page.nextCursor,null);assert.notEqual(result.envelope.nextCursor,null);}
   if(pages===2)assert.equal(result.envelope.accountCursor,null);
   cursor=result.envelope.nextCursor;pages++;
  }while(cursor!==null&&pages<10);
  assert.equal(pages,4);stager.promote(()=>undefined,signal());assert.equal(store.list({month:'2026-10'},false).totalCount,4);
  assert.equal(f.calls.filter(call=>call.url.endsWith('/auth')).length,1);assert.equal(f.calls.length,13);
  for(const {url,input}of f.calls){assert.ok(url.startsWith('https://api.pluggy.ai/'));if(!url.endsWith('/auth'))assert.equal(new Headers(input.headers).get('x-api-key'),apiKey);}
 }finally{stager?.clear();store.close();f.port.close();assert.equal(f.clock.timers.size,0);}
});

test('upstream cursor remains private and a foreign session cannot reuse an issued cursor',async()=>{
 const f=fixture({context:{...context(),bindings:[context().bindings[0]]},month:'2026-02',transactions:async()=>json({results:[],next:'?accountId='+uid(3)+'&dateFrom=2026-02-01&dateTo=2026-03-01&after=opaque%2Btoken%3D'})});
 try{
  const first=await f.port.readMovements(f.ctx,request({month:'2026-02'}),signal());assert.equal(first.status,'complete');assert.ok(!JSON.stringify(first).includes('opaque%2Btoken'));
  const before=f.calls.filter(call=>call.url.includes('/v2/transactions')).length;
  const foreign=await f.port.readMovements(f.ctx,request({month:'2026-02',cursor:first.envelope.nextCursor,sessionId:uid(99)}),signal());assert.equal(foreign.status,'unavailable');assert.equal(f.calls.filter(call=>call.url.includes('/v2/transactions')).length,before);
 }finally{f.port.close();}
});

test('expired proxy consent prevents account and transaction reads',async()=>{
 const f=fixture({item:async()=>json({...item(),consentExpiresAt:'1970-01-01T00:00:00Z'})});
 try{assert.equal((await f.port.readMovements(f.ctx,request(),signal())).status,'unavailable');assert.ok(f.calls.every(call=>call.url.endsWith('/auth')||call.url.includes('/items/')));}finally{f.port.close();}
});

test('unbound accounts or only unsupported CREDIT accounts never request transactions',async()=>{
 for(const inventoryResponse of [()=>json({...inventory(context()),results:[{...inventory(context()).results[0],id:uid(99)},...inventory(context()).results.slice(1)]}),()=>json({...inventory(context()),results:inventory(context()).results.map(row=>({...row,type:'CREDIT'}))})]){
  const f=fixture({inventory:inventoryResponse});try{assert.equal((await f.port.readMovements(f.ctx,request(),signal())).status,'unavailable');assert.ok(!f.calls.some(call=>call.url.includes('/v2/transactions')));}finally{f.port.close();}
 }
});

test('429 has no retry and 401 clears the cached provider key for the next explicit read',async()=>{
 for(const status of [429,401]){
  const f=fixture({transactions:async()=>json({private:'SYNTHETIC_PRIVATE'},status)});
  try{
   const first=await f.port.readMovements(f.ctx,request(),signal());assert.deepEqual(first,{status:status===429?'rate_limited':'unavailable'});assert.equal(f.calls.filter(call=>call.url.includes('/v2/transactions')).length,1);
   await f.port.readMovements(f.ctx,request(),signal());assert.equal(f.calls.filter(call=>call.url.endsWith('/auth')).length,status===401?2:1);
  }finally{f.port.close();}
 }
});

test('preabort and close during an unresolved transaction discard any later page',async()=>{
 const f=fixture();const aborted=new AbortController();aborted.abort();try{assert.deepEqual(await f.port.readMovements(f.ctx,request(),aborted.signal),{status:'cancelled'});assert.equal(f.calls.length,0);}finally{f.port.close();}
 let release,started;const begin=new Promise(resolve=>{started=resolve;});const pending=new Promise(resolve=>{release=resolve;});
 const g=fixture({transactions:async()=>{started();return pending;}});const result=g.port.readMovements(g.ctx,request(),signal());await begin;g.port.close();assert.deepEqual(await result,{status:'cancelled'});release(json({results:[],next:null}));await flush();assert.equal(g.clock.timers.size,0);
});

test('one operation in flight and twenty-second deadline stop extra provider work',async()=>{
 let started;const begin=new Promise(resolve=>{started=resolve;});
 const f=fixture({transactions:async()=>{started();return new Promise(()=>{});}});
 const pending=f.port.readMovements(f.ctx,request(),signal());await begin;
 assert.deepEqual(await f.port.readMovements(f.ctx,request(),signal()),{status:'busy'});
 const count=f.calls.length;f.clock.tick(20000);assert.equal((await pending).status,'unavailable');assert.equal(f.calls.length,count);f.port.close();assert.equal(f.clock.timers.size,0);
});

test('authorized request and bindings are captured before asynchronous key preparation',async()=>{
 const f=fixture(),ctx={...f.ctx,bindings:f.ctx.bindings.map(row=>({...row}))},req=request();
 try{const pending=f.port.readMovements(ctx,req,signal());ctx.bindings[0].externalId=uid(99);req.sessionId=uid(99);req.month='2026-09';const result=await pending;assert.equal(result.status,'complete');assert.equal(result.envelope.page.accountId,uid(4));}finally{f.port.close();}
});


test('500 large source rows use the transaction budget and produce only minimal DTOs',async()=>{
 const ctx={...context(),bindings:[context().bindings[0]]};
 const rows=Array.from({length:500},(_,i)=>({id:uid(1000+i),accountId:uid(3),date:'2026-02-20T12:00:00Z',amount:-0.29,currencyCode:'BRL',type:'DEBIT',status:'POSTED',description:'Movimento fictício',privateExtra:'SYNTHETIC_PRIVATE'.repeat(60)}));
 assert.ok(Buffer.byteLength(JSON.stringify({results:rows,next:null}))>131072);
 const f=fixture({context:ctx,month:'2026-02',transactions:async()=>json({results:rows,next:null})});
 try{const result=await f.port.readMovements(f.ctx,request({month:'2026-02'}),signal());assert.equal(result.status,'complete');assert.equal(result.envelope.page.items.length,500);assert.equal(result.receivedRows,500);assert.equal(result.envelope.nextCursor,null);assert.equal(result.envelope.page.items.reduce((sum,row)=>sum+row.amountCents,0),14500);assert.ok(!JSON.stringify(result).includes('SYNTHETIC_PRIVATE'));}finally{f.port.close();}
});

test('consent expiring while inventory is read blocks the subsequent transaction request',async()=>{
 let clock;
 const f=fixture({item:async()=>json({...item(),consentExpiresAt:'1970-01-01T00:00:01.005Z'}),inventory:async()=>{clock.value=1005;return json(inventory(context()));}});clock=f.clock;
 try{assert.equal((await f.port.readMovements(f.ctx,request(),signal())).status,'unavailable');assert.ok(!f.calls.some(call=>call.url.includes('/v2/transactions')));}finally{f.port.close();}
});


test('raw row count for global budget includes records filtered out of the Brasília month',async()=>{
 const rows=[{id:uid(1600),accountId:uid(3),date:'2026-10-01T01:00:00Z',amount:-0.29,currencyCode:'BRL',type:'DEBIT',status:'POSTED',description:'Earlier local month'},{id:uid(1601),accountId:uid(3),date:'2026-10-20T12:00:00Z',amount:-0.29,currencyCode:'BRL',type:'DEBIT',status:'POSTED',description:'Current local month'}];
 const f=fixture({transactions:async()=>json({results:rows,next:null})});
 try{const result=await f.port.readMovements(f.ctx,request(),signal());assert.equal(result.status,'complete');assert.equal(result.receivedRows,2);assert.equal(result.envelope.page.items.length,1);}finally{f.port.close();}
});

test('a provider that repeats the same raw next cursor fails without issuing another continuation',async()=>{
 const repeated='?accountId='+uid(3)+'&dateFrom=2026-02-01&dateTo=2026-03-01&after=repeated_cursor';
 const f=fixture({context:{...context(),bindings:[context().bindings[0]]},month:'2026-02',transactions:async()=>json({results:[],next:repeated})});
 try{const first=await f.port.readMovements(f.ctx,request({month:'2026-02'}),signal());assert.equal(first.status,'complete');const second=await f.port.readMovements(f.ctx,request({month:'2026-02',cursor:first.envelope.nextCursor}),signal());assert.deepEqual(second,{status:'unavailable'});assert.equal(f.calls.filter(call=>call.url.includes('/v2/transactions')).length,2);}finally{f.port.close();}
});
