import test from 'node:test';import assert from 'node:assert/strict';
import {createInvestmentProgressPorts} from '../../supabase/functions/_shared/investment-progress-rest.ts';
import {createInvestmentReadHandler} from '../../supabase/functions/_shared/investment-handler.ts';
import {createInvestmentFinalizeHandler} from '../../supabase/functions/_shared/investment-finalize-handler.ts';
import {createPluggyInvestmentsPort} from '../../supabase/functions/_shared/pluggy-auth.ts';
import {createAccountNetworkTransport} from '../../supabase/functions/_shared/account-network.ts';
const uid=n=>`00000000-0000-4000-8000-${String(n).padStart(12,'0')}`,now=Date.UTC(2026,9,21),expiry=now+120000;
const scope={ownerId:uid(1),connectionId:uid(2),revision:1,leaseId:uid(3),sessionId:uid(4)},context=()=>({itemId:uid(5),connectionId:scope.connectionId,bindings:[],sourceUpdatedAt:null});
const clock={now:()=>now,setTimer:(fn,ms)=>setTimeout(fn,ms),clearTimer:id=>clearTimeout(id)},json=x=>new Response(JSON.stringify(x),{headers:{'Content-Type':'application/json'}});
const policy={enabled:true,mode:'fixture',privateDataApproved:true,clock},config={origin:'https://vvaufaoahotmaocrcyij.supabase.co',secretKey:'sb_secret_synthetic'};
const signal=()=>new AbortController().signal;
test('investment RPC boundary supports all fixed operations and1000technical bindings',async()=>{
 const calls=[];const network=createAccountNetworkTransport({...policy,network:async(url,init)=>{calls.push({url,body:JSON.parse(init.body)});return json(url.endsWith('claim_investment_read')?{claimId:uid(6),leaseExpiresAt:new Date(expiry).toISOString()}:url.endsWith('resolve_investment_read')?null:true)}});
 const ports=createInvestmentProgressPorts(()=>config,{...policy,transport:network});assert.equal(await ports.resolve(scope,signal()),null);assert.deepEqual(await ports.claim(scope,signal()),{claimId:uid(6),leaseExpiresAt:expiry});assert.equal(await ports.stage(scope,uid(5),Array.from({length:1000},(_,i)=>uid(100+i)),signal()),true);assert.equal(await ports.commit({...scope,claimId:uid(6),rowCount:1000},signal()),true);assert.equal(await ports.finish(scope,signal()),true);assert.equal(calls.length,5);assert.equal(calls[2].body.p_positions.length,1000);assert.ok(!JSON.stringify(calls).includes('grossCents'));
 await assert.rejects(ports.commit({...scope,claimId:uid(6),rowCount:1001},signal()));await assert.rejects(ports.stage(scope,uid(5),[uid(8),uid(8)],signal()));assert.equal(calls.length,5);
});
function fixture(patch={}){
 const events=[],bindings=[],ctx=()=>({...context(),bindings:[...bindings]});let authCount=0;
 const provider=createPluggyInvestmentsPort(()=>({clientId:'synthetic-client',clientSecret:'synthetic-secret-12345'}),{...policy,investmentsEnabled:true,transport:async(url,init)=>{
  events.push('provider');if(url.endsWith('/auth'))return json({apiKey:'synthetic-provider-key'});
  if(url.includes('/items/'))return json({id:uid(5),connector:{name:'MeuPluggy',isSandbox:false},status:'UPDATED',executionStatus:'SUCCESS',error:null,consentExpiresAt:new Date(now+86400000).toISOString(),lastUpdatedAt:null,products:['INVESTMENTS']});
  return json({page:1,total:1,totalPages:1,results:[{id:uid(7),itemId:uid(5),type:'FIXED_INCOME',status:'ACTIVE',currencyCode:'BRL',amount:0.39,balance:0.29,date:'2026-10-21',owner:'SYNTHETIC_PRIVATE'}]});
 }});
 const ports={authenticate:async()=>{events.push('auth');authCount++;return {subject:scope.ownerId,sessionId:patch.sessionChanged&&authCount>1?uid(99):scope.sessionId,isOwner:true,expiresAt:now+600000};},resolve:async()=>({ ...scope,leaseExpiresAt:new Date(expiry).toISOString(),projection:ctx()}),claim:async()=>{events.push('claim');return patch.claimFalse?null:{claimId:uid(6),leaseExpiresAt:expiry};},stage:async(_scope,item,ids)=>{events.push('stage');assert.equal(item,uid(5));for(const externalId of ids)bindings.push({externalId,internalId:uid(8)});return true;},commit:async captured=>{events.push('commit');assert.equal(captured.rowCount,1);return patch.commitFalse?false:true;},readInvestments:provider.readInvestments};
 return {events,provider,handler:createInvestmentReadHandler(ports,policy),ports};
}
const request=body=>new Request('https://own.invalid/investments/read',{method:'POST',headers:{Authorization:'Bearer synthetic-token','Content-Type':'application/json'},body:JSON.stringify(body??{connectionId:scope.connectionId,leaseId:scope.leaseId,revision:1})});
test('HTTP investment delivery integrates Auth provider exact projection stage reAuth commit',async()=>{
 const f=fixture();try{const response=await f.handler(request());assert.equal(response.status,200);assert.equal(response.headers.get('cache-control'),'no-store');const body=await response.json();assert.equal(body.product,'investments');assert.equal(body.page.items[0].netCents,29);assert.equal(body.page.items[0].id,uid(8));assert.equal(body.partial,true);assert.equal(body.complete,true);assert.equal(f.events.at(-1),'commit');assert.ok(f.events.indexOf('stage')>f.events.lastIndexOf('provider'));for(const privateValue of [uid(5),uid(7),'SYNTHETIC_PRIVATE','synthetic-provider-key'])assert.ok(!JSON.stringify(body).includes(privateValue));}finally{f.provider.close();}
});
test('HTTP revoked session or failed commit cannot return investment payload',async()=>{
 for(const patch of [{sessionChanged:true},{commitFalse:true},{claimFalse:true}]){const f=fixture(patch);try{const response=await f.handler(request());assert.ok([401,409].includes(response.status));assert.ok(!JSON.stringify(await response.json()).includes('netCents'));if(patch.sessionChanged)assert.ok(!f.events.includes('commit'));if(patch.claimFalse)assert.ok(!f.events.includes('provider'));}finally{f.provider.close();}}
});
test('HTTP strict body rejects owner cursor and arbitrary URL and off gate touches nothing',async()=>{
 const f=fixture();try{const response=await f.handler(request({...scope,ownerId:uid(99)}));assert.equal(response.status,400);assert.ok(!f.events.includes('provider'));}finally{f.provider.close();}
 const handler=createInvestmentReadHandler(new Proxy({},{get(){throw Error();}}));assert.equal((await handler(new Proxy({},{get(){throw Error();}}))).status,503);
});
test('dedicated finalization rechecks the same owner session and accepts only committed result',async()=>{
 for(const changed of [false,true]){let calls=0,finished=0;const handler=createInvestmentFinalizeHandler({authenticate:async()=>({subject:scope.ownerId,sessionId:++calls===2&&changed?uid(99):scope.sessionId,isOwner:true,expiresAt:now+600000}),finish:async captured=>{assert.deepEqual(captured,scope);finished++;return true;}},policy);const input=new Request('https://own.invalid/investments/finalize',{method:'POST',headers:{Authorization:'Bearer synthetic-token','Content-Type':'application/json'},body:JSON.stringify({connectionId:scope.connectionId,revision:1,leaseId:scope.leaseId})});const response=await handler(input);assert.equal(response.status,changed?401:200);assert.equal(finished,changed?0:1);}
});
