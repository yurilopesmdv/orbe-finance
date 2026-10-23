import test from 'node:test';import assert from 'node:assert/strict';
import {createFinanceHub} from '../../src/features/finance/hub.ts';
import {summarizeHome} from '../../src/features/finance/summary.ts';
const id=n=>`00000000-0000-4000-8000-${String(n).padStart(12,'0')}`;
function fixture(options={}){
 let unlocked=true,active=true,time=Date.UTC(2026,9,23,12),closedCount=0;const sessionListeners=new Set(),screenListeners=new Set(),calls=[],timers=new Map();
 const session={assertUnlocked(){if(!unlocked)throw Error();},getSnapshot:()=>({state:unlocked?'unlocked':'locked'}),subscribe(fn){sessionListeners.add(fn);return()=>sessionListeners.delete(fn)}};
 const protection={getSnapshot:()=>({phase:'ready',active}),subscribe(fn){screenListeners.add(fn);return()=>screenListeners.delete(fn)}};
 const make=product=>{let closed=false,snapshot={phase:'idle',notice:'none'},items=[];const listeners=new Set();return{kind:'ready',controller:{getSnapshot:()=>snapshot,subscribe(fn){listeners.add(fn);return()=>listeners.delete(fn)},query(){if(closed)throw Error('closed');return{items,totalCount:items.length}},async refresh(connection,month){calls.push([product,connection,month]);snapshot={phase:'loading',notice:'none'};for(const fn of listeners)fn();if(options.pause)await options.pause();if(closed)return false;const ok=options.fail!==product;snapshot={phase:ok?'ready':'error',notice:ok?'partial':options.cooldown?'cooldown':'unavailable'};if(ok)items=[{id:connection,connectionId:connection,product}];for(const fn of listeners)fn();return ok;}},close(){if(closed)return;closed=true;items=[];closedCount++;}}};
 const clients={accounts:make('accounts'),movements:make('transactions'),investments:make('investments')};
 const connections=[{id:id(1),institution:'mercado-pago',state:'active',revision:2,capabilities:{accounts:true,transactions:true,investments:true}},{id:id(2),institution:'bradesco',state:'active',revision:1,capabilities:{accounts:true,transactions:true,investments:false}}];
 const hub=createFinanceHub(session,protection,{clients,status:async()=>({status:'complete',connections}),now:()=>time,set(fn,ms){const token=Symbol();timers.set(token,{fn,at:time+ms});return token},clear(token){timers.delete(token)}});
 return{hub,clients,calls,timers,closed:()=>closedCount,lock(){unlocked=false;for(const fn of [...sessionListeners])fn()},background(){active=false;for(const fn of [...screenListeners])fn()},async tick(ms){time+=ms;for(const [key,value]of [...timers])if(value.at<=time){timers.delete(key);value.fn();}await new Promise(r=>setImmediate(r))}};
}
test('automatic cycle reads all eligible products sequentially and retains data across navigation queries',async()=>{const f=fixture();try{assert.equal(await f.hub.synchronize(),true);assert.deepEqual(f.calls.map(c=>c[0]),['accounts','transactions','transactions','investments','accounts','transactions','transactions']);assert.equal(f.hub.getSnapshot().phase,'ready');assert.equal(f.clients.accounts.controller.query().items.length,1);assert.equal(f.clients.movements.controller.query().totalCount,1);await f.hub.synchronize();assert.equal(f.calls.length,7);assert.equal(f.clients.accounts.controller.query().items.length,1);}finally{f.hub.close()}});
test('one global job excludes parallel manual reads while another product is in flight',async()=>{let resume;const f=fixture({pause:()=>new Promise(r=>resume=r)});try{const work=f.hub.synchronize();await new Promise(r=>setImmediate(r));assert.equal(await f.hub.synchronize(true),false);f.hub.close();resume();await work;assert.equal(f.closed(),3);}finally{f.hub.close()}});
test('background or lock purges every product and cancels timers',async()=>{for(const action of ['lock','background']){const f=fixture();await f.hub.synchronize();f[action]();assert.equal(f.hub.getSnapshot().phase,'closed');assert.equal(f.hub.getSnapshot().connections.length,0);assert.equal(f.closed(),3);assert.equal(f.timers.size,0);assert.throws(()=>f.clients.accounts.controller.query());assert.equal(await f.hub.synchronize(),false)}});
test('partial result preserves other products and retries cooldown without blocking navigation',async()=>{const f=fixture({fail:'transactions',cooldown:true});try{assert.equal(await f.hub.synchronize(),false);assert.equal(f.hub.getSnapshot().phase,'partial');assert.equal(f.clients.accounts.controller.query().items.length,1);assert.equal(f.clients.investments.controller.query().items.length,1);assert.equal(f.timers.size,1);const previous=f.calls.length;await f.tick(30000);assert.ok(f.calls.length>previous);assert.equal(f.calls.filter(c=>c[0]==='accounts').length,2);}finally{f.hub.close()}});
test('foreground fifteen minute timer refreshes automatically without a page action',async()=>{const f=fixture();try{await f.hub.synchronize();await f.tick(900000);assert.equal(f.calls.length,14);}finally{f.hub.close()}});
const asset=(id,product,amountCents,relation='unknown',currency='BRL')=>({id,connectionId:'bank',institutionId:'mercado-pago',product,amountCents,relation,currency,kind:'asset',asOf:null});
test('home totals keep unknown investment overlap separate and count distinct components once',()=>{const a=asset('cash','account',10000),i=asset('fund','investment',5000);let summary=summarizeHome([a,a],[i],'BRL',true,true);assert.equal(summary.accountsTotal,10000);assert.equal(summary.investmentsTotal,5000);assert.equal(summary.consolidated,10000);assert.equal(summary.overlapUnknown,true);summary=summarizeHome([a],[{...i,relation:'distinct'}],'BRL',true,true);assert.equal(summary.consolidated,15000);assert.equal(summary.overlapUnknown,false)});
test('unknown values remain unknown, currencies separate and a validated empty snapshot can be zero',()=>{assert.equal(summarizeHome([],[]).accountsTotal,null);assert.equal(summarizeHome([],[],'BRL',true,true).accountsTotal,0);assert.equal(summarizeHome([asset('a','account',null)],[],'BRL',true,true).accountsTotal,null);assert.equal(summarizeHome([asset('a','account',100),asset('b','account',500,'distinct','USD')],[],'BRL',true,true).accountsTotal,100);assert.equal(summarizeHome([asset('a','account',100)],[asset('i','investment',null,'distinct')],'BRL',true,true).consolidated,null)});

test('read receipts distinguish an empty success from failure and purge on lock',async()=>{
 const f=fixture({fail:'investments'});await f.hub.synchronize();
 const reads=f.hub.getSnapshot().reads;
 assert.equal(reads.find(row=>row.product==='accounts').status,'complete');
 const investment=reads.find(row=>row.product==='investments');
 assert.equal(investment.status,'unavailable');assert.equal(investment.lastSuccessAt,null);assert.equal(investment.cachedItems,null);
 assert.equal(reads.filter(row=>row.product==='transactions').length,4);
 f.lock();assert.deepEqual(f.hub.getSnapshot().reads,[]);
});
test('bank identity and investment empty states do not invent a second connection or zero holdings',async()=>{
 const {productCoverage}=await import('../../src/features/finance/coverage.ts');
 const mp={id:id(1),institution:'mercado-pago',revision:2,state:'active',capabilities:{investments:true}};
 const read={connectionId:id(1),revision:2,product:'investments',month:null,status:'complete',cachedItems:0,lastSuccessAt:1};
 assert.equal(productCoverage(undefined,'investments',[read]),'unlinked');
 assert.equal(productCoverage(mp,'investments',[]),'waiting');
 assert.equal(productCoverage(mp,'investments',[read]),'empty');
 assert.equal(productCoverage({...mp,id:id(2)},'investments',[read]),'waiting');
 assert.equal(productCoverage({...mp,revision:3},'investments',[read]),'waiting');
 assert.equal(productCoverage(mp,'investments',[{...read,status:'unavailable'}]),'unavailable');
 assert.equal(productCoverage(mp,'investments',[{...read,cachedItems:1}]),'received');
 assert.equal(productCoverage({...mp,capabilities:{investments:false}},'investments',[read]),'unsupported');
 assert.equal(productCoverage({...mp,capabilities:{investments:null}},'investments',[read]),'unconfirmed');
});

test('failed refresh retains receipt of the previous successful snapshot',async()=>{
 const options={},f=fixture(options);await f.hub.synchronize();
 const before=f.hub.getSnapshot().reads.find(row=>row.product==='investments');
 options.fail='investments';await f.hub.synchronize(true,{connectionId:id(1),product:'investments'});
 const after=f.hub.getSnapshot().reads.find(row=>row.product==='investments');
 assert.equal(after.status,'unavailable');assert.equal(after.lastSuccessAt,before.lastSuccessAt);assert.equal(after.cachedItems,before.cachedItems);f.hub.close();
});
