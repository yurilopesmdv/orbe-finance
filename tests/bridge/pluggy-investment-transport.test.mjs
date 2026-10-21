import test from 'node:test';
import assert from 'node:assert/strict';
import {createPluggyInvestmentsPort} from '../../supabase/functions/_shared/pluggy-auth.ts';
const uid=n=>`00000000-0000-4000-8000-${String(n).padStart(12,'0')}`;
const ctx=()=>({itemId:uid(1),connectionId:uid(2),bindings:[],sourceUpdatedAt:null});
const req=()=>({ownerSubject:uid(3),sessionId:uid(4),revision:1,leaseId:uid(5),leaseExpiresAt:121000});
const config=()=>({clientId:'synthetic-client',clientSecret:'synthetic-secret-123456'});
const json=(body,status=200)=>new Response(JSON.stringify(body),{status,headers:{'Content-Type':'application/json'}});
const row=n=>({id:uid(100+n),itemId:uid(1),type:'FIXED_INCOME',status:'ACTIVE',currencyCode:'BRL',amount:0.39,balance:0.29,date:'2026-10-21',name:'SYNTHETIC_PRIVATE'});
const item=()=>({id:uid(1),connector:{name:'MeuPluggy',isSandbox:false},status:'UPDATED',executionStatus:'SUCCESS',error:null,consentExpiresAt:'2099-01-01T00:00:00Z',lastUpdatedAt:null,products:['INVESTMENTS']});
class Clock{value=1000;id=0;timers=new Map();now(){return this.value;}setTimer(fn,ms){const id=++this.id;this.timers.set(id,{fn,at:this.value+ms});return id;}clearTimer(id){this.timers.delete(id);}tick(ms){this.value+=ms;for(const[id,t]of [...this.timers])if(t.at<=this.value){this.timers.delete(id);t.fn();}}}
function fixture(opts={}){
 const calls=[],clock=new Clock(),stages=[];
 const transport=async(url,init)=>{calls.push(url);if(url.endsWith('/auth'))return json({apiKey:'synthetic-provider-key'});if(url.includes('/items/'))return json(opts.item??item());const page=Number(new URL(url).searchParams.get('page'));if(opts.read)return opts.read(page,init);const count=opts.total??101;return json({page,total:count,totalPages:Math.ceil(count/100),results:Array.from({length:Math.min(100,count-(page-1)*100)},(_,i)=>row((page-1)*100+i))});};
 const port=createPluggyInvestmentsPort(config,{enabled:true,investmentsEnabled:true,mode:'fixture',clock,transport});
 const resolve=async(ids,signal)=>{stages.push([...ids]);if(opts.resolve)return opts.resolve(ids,signal);return {...ctx(),bindings:ids.map((id,i)=>({externalId:id,internalId:uid(2000+i)}))};};
 return{calls,clock,stages,port,resolve};
}
const signal=()=>new AbortController().signal;
test('investment delivery collects pages, stages once and exposes exact internal DTO only',async()=>{
 const f=fixture();try{const result=await f.port.readInvestments(ctx(),req(),f.resolve,signal());assert.equal(result.status,'complete');assert.equal(result.receivedRows,101);assert.equal(result.page.items.length,101);assert.equal(result.page.items[0].netCents,29);assert.equal(result.page.items[0].grossCents,39);assert.equal(result.page.authoritative,false);assert.equal(result.coverage.partial,true);assert.equal(f.stages.length,1);assert.equal(f.stages[0].length,101);assert.equal(f.calls.length,4);for(const secret of ['SYNTHETIC_PRIVATE','synthetic-provider-key',uid(1),uid(100)])assert.ok(!JSON.stringify(result).includes(secret));assert.ok(f.calls.every(u=>!u.includes('/accounts')));}finally{f.port.close();}
});
test('invalid counters, overlapping pages, bad amount and too many rows never stage',async()=>{
 const cases=[
  page=>json({page,total:1001,totalPages:11,results:[]}),
  page=>json({page,total:101,totalPages:2,results:Array.from({length:page===1?100:1},(_,i)=>row(i))}),
  page=>json({page,total:101,totalPages:page===1?2:1,results:Array.from({length:page===1?100:1},(_,i)=>row((page-1)*100+i))}),
  page=>json({page,total:1,totalPages:1,results:[{...row(1),balance:'invalid'}]}),
  page=>json({page,total:2,totalPages:1,results:[row(1)]}),
 ];
 for(const read of cases){const f=fixture({read});try{assert.equal((await f.port.readInvestments(ctx(),req(),f.resolve,signal())).status,'unavailable');assert.equal(f.stages.length,0);}finally{f.port.close();}}
});
test('feature off and invalid authorization do not read provider',async()=>{
 const poison=new Proxy({},{get(){throw Error();}});
 const disabled=createPluggyInvestmentsPort(()=>{throw Error();});assert.deepEqual(await disabled.readInvestments(poison,poison,poison,poison),{status:'disabled'});
 const f=fixture();try{assert.equal((await f.port.readInvestments(ctx(),{...req(),leaseExpiresAt:1000},f.resolve,signal())).status,'unavailable');assert.equal(f.calls.length,0);}finally{f.port.close();}
});
test('consent requires INVESTMENTS and 429 never retries',async()=>{
 const f=fixture({item:{...item(),products:['ACCOUNTS']}});try{assert.equal((await f.port.readInvestments(ctx(),req(),f.resolve,signal())).status,'unavailable');assert.equal(f.calls.length,2);assert.equal(f.stages.length,0);}finally{f.port.close();}
 const g=fixture({read:()=>json({},429)});try{assert.equal((await g.port.readInvestments(ctx(),req(),g.resolve,signal())).status,'rate_limited');assert.equal(g.calls.length,3);assert.equal(g.stages.length,0);}finally{g.port.close();}
});
test('empty snapshot is partial, does not invent zero valued position',async()=>{const f=fixture({total:0});try{const r=await f.port.readInvestments(ctx(),req(),f.resolve,signal());assert.equal(r.status,'complete');assert.equal(r.page.items.length,0);assert.equal(r.page.authoritative,false);assert.equal(f.stages.length,1);}finally{f.port.close();}});
test('foreign binding callback and expired consent/lease cannot produce result',async()=>{
 for(const resolve of [async ids=>({...ctx(),connectionId:uid(99),bindings:[]}),async ids=>({...ctx(),bindings:[]})]){const f=fixture({total:1,resolve});try{assert.equal((await f.port.readInvestments(ctx(),req(),f.resolve,signal())).status,'unavailable');}finally{f.port.close();}}
 const f=fixture({total:1,resolve:async ids=>{f.clock.tick(120000);return {...ctx(),bindings:ids.map(externalId=>({externalId,internalId:uid(2000)}))};}});try{assert.notEqual((await f.port.readInvestments(ctx(),req(),f.resolve,signal())).status,'complete');}finally{f.port.close();}
});
test('deadline and close interrupt uncooperative provider and prevent late stage',async()=>{
 for(const mode of ['deadline','close']){
  let reached,release;const started=new Promise(r=>{reached=r;});const f=fixture({read:()=>{reached();return new Promise(r=>{release=r;});}});
  const pending=f.port.readInvestments(ctx(),req(),f.resolve,signal());await started;
  if(mode==='deadline')f.clock.tick(20000);else f.port.close();
  assert.equal((await pending).status,mode==='deadline'?'unavailable':'cancelled');release(json({page:1,total:0,totalPages:0,results:[]}));await new Promise(r=>setImmediate(r));assert.equal(f.stages.length,0);f.port.close();
 }
});
test('single in-flight read and aborted signal never stage',async()=>{
 let reached,release;const started=new Promise(r=>{reached=r;});const f=fixture({read:()=>{reached();return new Promise(r=>{release=r;});}});const controller=new AbortController();
 const pending=f.port.readInvestments(ctx(),req(),f.resolve,controller.signal);await started;
 assert.equal((await f.port.readInvestments(ctx(),req(),f.resolve,signal())).status,'busy');controller.abort();assert.equal((await pending).status,'cancelled');release(json({page:1,total:0,totalPages:0,results:[]}));f.port.close();
});
