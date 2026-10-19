import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createMovementStager } from '../../src/features/sync/movement-staging.ts';
import { normalizeMovementPage } from '../../src/features/sync/movements.ts';
import { runReadBatch } from '../../src/features/sync/read-batch.ts';
import { MemoryLedger } from '../../src/data/local/ledger.ts';
const ownerSubject='00000000-0000-4000-8000-000000000001',connectionId='00000000-0000-4000-8000-000000000021',a='00000000-0000-4000-8000-000000000031',b='00000000-0000-4000-8000-000000000032';
const id='00000000-0000-4000-8000-000000000041',id2='00000000-0000-4000-8000-000000000042',leaseId='00000000-0000-4000-8000-000000000051';
const enabled={enabled:true,privateDataApproved:true},month='2026-10',source=`connection:${connectionId}`,stamp=new Date(Date.now()-10000).toISOString();
const row=(accountId,patch={})=>({movementId:id,accountId,amountCents:1000,currency:'BRL',direction:'debit',type:'expense',status:'posted',occurredAt:'2026-10-19',description:'Compra fictícia',categoryId:null,reversalOf:null,...patch});
const page=(accountId,patch={})=>({connectionId,accountId,items:[row(accountId)],nextCursor:null,windowComplete:true,sourceUpdatedAt:stamp,...patch});
const envelope=(accountId,nextCursor=null,pagePatch={},accountCursor=null)=>({accountCursor,nextCursor,page:page(accountId,pagePatch)});
const request=(cursor=null,patch={})=>({connectionId,revision:1,leaseId,product:'transactions',cursor,...patch});
const signal=()=>new AbortController().signal;
function fixture(accountIds=[a,b]){
 let principal={subject:ownerSubject,generation:1,unlocked:true};const context={ownerSubject,connectionId,institutionId:'bradesco',month,allowedAccountIds:[a,b],categoryIds:['food','health'],confirmedOwnTransfers:[],accountIds:[...accountIds]};const store=new MemoryLedger(()=>principal);
 for(const accountId of [a,b]){const result=normalizeMovementPage(page(accountId),{...context,accountId,confirmedOwnTransferIds:[]},enabled);store.promote(store.beginImport({source,accountId,month}),result.items,true);}
 let begins=0;const begin=store.beginImport.bind(store);store.beginImport=(...args)=>{begins++;return begin(...args);};
 const stager=createMovementStager(store,context,enabled);
 return {store,context,stager,begins:()=>begins,total:()=>store.list({month},true).summary.netCents,lock:()=>{principal={...principal,unlocked:false};}};
}
async function run(f,envelopes,overrides={}){
 const now=Date.now();let index=0,finishes=0;const parent=new AbortController();
 const ports={acquire:async()=>({status:'acquired',leaseId,revision:1,expiresAt:new Date(now+120000).toISOString(),nextReadAt:new Date(now+900000).toISOString()}),readPage:async req=>f.stager.prepare(envelopes[index++],req),finalize:async()=>{finishes++;return true;},promote:(fresh,sig)=>f.stager.promote(fresh,sig),clearStaging:()=>f.stager.clear(),...overrides};
 const metadata={id:connectionId,institution:'bradesco',state:'active',revision:1,capabilities:{accounts:false,transactions:true,investments:false,reserves:false},openFinanceVerifiedAt:new Date(now-100000).toISOString(),proxyConsentExpiresAt:new Date(now+86400000).toISOString(),bankConsentExpiresAt:null};
 return {result:await runReadBatch(metadata,ports,{...enabled,assertCurrent:()=>{},signal:parent.signal}),finishes};
}
const first=()=>envelope(a,'global-2',{items:[row(a,{amountCents:2000})]});
const last=()=>envelope(b,null,{items:[row(b,{amountCents:3000})]});

test('off factory touches no context or store',()=>{const poison=new Proxy({}, {get(){throw new Error('sensitive');}});assert.deepEqual(createMovementStager(poison,poison),{kind:'disabled'});assert.deepEqual(createMovementStager(poison,poison,{enabled:true}),{kind:'disabled'});});
test('two accounts and account pagination promote once only after global completion',async()=>{
 const f=fixture();const prepared=f.stager.prepare(first(),request());assert.equal(f.begins(),0);assert.equal(f.total(),2000);assert.equal(prepared.receipt.complete,false);
 const envelopes=[envelope(a,'global-2',{nextCursor:'account-2'}),envelope(a,'global-3',{items:[row(a,{movementId:id2,amountCents:2000})]},'account-2'),last()];
 const {result,finishes}=await run(f,envelopes);assert.equal(result.status,'complete');assert.equal(result.products[0].pages,3);assert.equal(result.products[0].rows,3);assert.equal(finishes,1);assert.equal(f.begins(),2);assert.equal(f.total(),6000);assert.throws(()=>prepared.stage(signal()),/invalid_movement_staging/);
});
test('failure in last account or finish false preserves every old account',async()=>{
 const f=fixture();assert.equal((await run(f,[first(),envelope(b,null,{items:[row(b,{amountCents:-1})]})])).result.status,'failed');assert.equal(f.total(),2000);
 const g=fixture();assert.equal((await run(g,[first(),last()],{finalize:async()=>false})).result.status,'failed');assert.equal(g.total(),2000);
});
test('manifest cannot be empty duplicated foreign or unbounded',()=>{
 const f=fixture();for(const accountIds of [[],[a,a],['bad'],['00000000-0000-4000-8000-000000000099'],Array(101).fill(a)])assert.throws(()=>createMovementStager(f.store,{...f.context,accountIds},enabled),/invalid_movement_staging/);
});
test('missing reordered or prematurely final account cannot finish a product',async()=>{
 for(const envelopes of [[envelope(a,null)],[envelope(b,'next')],[first(),envelope(a,null)]]){const f=fixture();assert.equal((await run(f,envelopes)).result.status,'failed');assert.equal(f.total(),2000);}
});
test('explicit empty last account completes without deleting its previous movements',async()=>{
 const f=fixture();const {result}=await run(f,[first(),envelope(b,null,{items:[]})]);assert.equal(result.status,'complete');assert.equal(f.total(),3000);
});
test('global cursor and account cursor are independent and each validated',()=>{
 const f=fixture();f.stager.prepare(envelope(a,'global-2',{nextCursor:'account-2'}),request()).stage(signal());assert.throws(()=>f.stager.prepare(envelope(a,'global-3',{},'wrong'),request('global-2')),/invalid_movement_staging/);assert.equal(f.total(),2000);
 const g=fixture();g.stager.prepare(first(),request()).stage(signal());assert.throws(()=>g.stager.prepare(last(),request('wrong-global')),/invalid_movement_staging/);assert.equal(g.total(),2000);
});
test('revision lease product and connection changes discard entire staging',()=>{
 for(const patch of [{revision:2},{leaseId:b},{product:'accounts'},{connectionId:b}]){const f=fixture();f.stager.prepare(first(),request()).stage(signal());assert.throws(()=>f.stager.prepare(last(),request('global-2',patch)),/invalid_movement_staging/);assert.equal(f.total(),2000);}
});
test('clear replay abort and late callbacks never recreate stage',()=>{
 const f=fixture(),work=f.stager.prepare(first(),request());f.stager.clear();f.stager.clear();assert.throws(()=>work.stage(signal()),/invalid_movement_staging/);assert.equal(f.begins(),0);
 const g=fixture(),repeat=g.stager.prepare(first(),request());repeat.stage(signal());assert.throws(()=>repeat.stage(signal()),/invalid_movement_staging/);assert.equal(g.total(),2000);
 const h=fixture(),controller=new AbortController();controller.abort();assert.throws(()=>h.stager.prepare(first(),request()).stage(controller.signal),/invalid_movement_staging/);assert.equal(h.begins(),0);
});
test('context arrays and request object are captured before mutation',async()=>{
 const f=fixture();f.context.accountIds.reverse();f.context.allowedAccountIds.length=0;f.context.month='2026-09';assert.equal((await run(f,[first(),last()])).result.status,'complete');assert.equal(f.total(),5000);
 const g=fixture([a]),req=request(),work=g.stager.prepare(envelope(a),req);req.revision=99;work.stage(signal());g.stager.promote(()=>{},signal());assert.equal(g.total(),2000);
});
test('duplicate conflicts across account pages reject while identical rows deduplicate',async()=>{
 const f=fixture([a]);const pages=[envelope(a,'g2',{nextCursor:'a2'}),envelope(a,null,{},'a2')];assert.equal((await run(f,pages)).result.status,'complete');assert.equal(f.total(),2000);
 const g=fixture([a]);assert.equal((await run(g,[pages[0],envelope(a,null,{items:[row(a,{amountCents:2})]},'a2')])).result.status,'failed');assert.equal(g.total(),2000);
});
test('row limit counts duplicate input across all accounts and pages',()=>{
 const f=fixture([a]);let currentGlobal=null,currentAccount=null;
 for(let i=0;i<10;i++){const ng=`g-${i}`,na=`a-${i}`;const work=f.stager.prepare(envelope(a,ng,{items:Array(1000).fill(row(a)),nextCursor:na},currentAccount),request(currentGlobal));assert.equal(work.receipt.rowCount,1000);work.stage(signal());currentGlobal=ng;currentAccount=na;}
 assert.throws(()=>f.stager.prepare(envelope(a,null,{},currentAccount),request(currentGlobal)).stage(signal()),/invalid_movement_staging/);assert.equal(f.total(),2000);
});
test('global and per-account cursor cycles cannot keep a lot running',()=>{
 const f=fixture([a]);f.stager.prepare(envelope(a,'g2',{nextCursor:'a2'}),request()).stage(signal());assert.throws(()=>f.stager.prepare(envelope(a,'g2',{nextCursor:'a3'},'a2'),request('g2')).stage(signal()),/invalid_movement_staging/);
 const g=fixture([a]);g.stager.prepare(envelope(a,'g2',{nextCursor:'a2'}),request()).stage(signal());assert.throws(()=>g.stager.prepare(envelope(a,'g3',{nextCursor:'a2'},'a2'),request('g2')).stage(signal()),/invalid_movement_staging/);
});
test('window partiality and mixed source remain visible in coordinator summary',async()=>{
 for(const patch of [{windowComplete:false},{sourceUpdatedAt:null},{sourceUpdatedAt:new Date(Date.parse(stamp)-1000).toISOString()}]){const f=fixture();const {result}=await run(f,[first(),envelope(b,null,patch)]);assert.equal(result.status,'complete');assert.equal(result.products[0].authoritative,false);assert.equal(result.products[0].partial,true);}
});
test('explicit cancellation updates and user category override survives promotion',async()=>{
 const f=fixture();f.store.createCategory({ownerSubject,id:'health',name:'Saúde'});const ref={source,accountId:a,externalId:id};f.store.setOverride(ref,{categoryId:'health'});
 const {result}=await run(f,[first(),envelope(b,null,{items:[row(b,{status:'cancelled'})]})]);assert.equal(result.status,'complete');assert.equal(f.total(),2000);assert.equal(f.store.classificationFor(ref).categoryId,'health');
});
test('commit guard failure or newer ticket on last account publishes no account',()=>{
 for(const mode of ['throw','reentrant','async']){const f=fixture();f.stager.prepare(first(),request()).stage(signal());f.stager.prepare(last(),request('global-2')).stage(signal());let calls=0;
 const guard=()=>{calls++;if(mode==='async')return Promise.resolve();if(calls===2){if(mode==='throw')throw new Error('expired');f.store.beginImport({source,accountId:b,month});}};
 assert.throws(()=>f.stager.promote(guard,signal()),/invalid_movement_staging/);assert.equal(f.total(),2000);}
});
test('pending stage cannot recreate a cache after session lock',()=>{
 const f=fixture();f.stager.prepare(first(),request()).stage(signal());f.stager.prepare(last(),request('global-2')).stage(signal());f.lock();assert.throws(()=>f.stager.promote(()=>{},signal()),/invalid_movement_staging/);assert.throws(()=>f.total(),/repository_locked/);
});

test('transfer proof is bound to account even when movement UUID collides across accounts',async()=>{
 const f=fixture();const input={...f.context,confirmedOwnTransfers:[{accountId:a,movementId:id}]};f.stager=createMovementStager(f.store,input,enabled);
 const firstTransfer=envelope(a,'g2',{items:[row(a,{type:'own_transfer'})]}),secondTransfer=envelope(b,null,{items:[row(b,{type:'own_transfer'})]});
 const {result}=await run(f,[firstTransfer,secondTransfer]);assert.equal(result.status,'complete');assert.equal(result.products[0].partial,true);
 const items=f.store.list({month},true).items;assert.equal(items.find(item=>item.accountId===a).type,'own_transfer');assert.equal(items.find(item=>item.accountId===b).type,'unknown');
});
