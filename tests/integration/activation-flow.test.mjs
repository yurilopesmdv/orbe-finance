import test from 'node:test';import assert from 'node:assert/strict';
import {SessionModel}from'../../src/features/auth/session.ts';
import {createActivationRuntime}from'../../src/features/connections/activation-runtime.ts';
import {createActivationBackendRuntime}from'../../supabase/functions/_shared/activation-runtime.ts';
const id=n=>`00000000-0000-4000-8000-${String(n).padStart(12,'0')}`,owner=id(1),sid=id(2),conn=id(3),item=id(4),origin='https://vvaufaoahotmaocrcyij.supabase.co';
const json=value=>new Response(JSON.stringify(value),{headers:{'Content-Type':'application/json'}}),flags={connectionActivationEnabled:true,liveIntegrationEnabled:true,privateFinancialDataApproved:true};
async function fixture(options={}){
 const now=Date.now(),expiry=new Date(now+86400000).toISOString(),calls=[],clientCalls=[];let commitCount=0;
 const metadata={id:conn,institution:'mercado-pago',state:'pending',revision:1,capabilities:{accounts:null,transactions:null,investments:null,reserves:null},openFinanceVerifiedAt:null,proxyConsentExpiresAt:null,bankConsentExpiresAt:null,authorizationExpiresAt:null,sourceUpdatedAt:null,lastReadAt:null};
 const config={ORBE_BRIDGE_ENABLED:'true',ORBE_CONNECTION_ACTIVATION_ENABLED:'true',ORBE_PRIVATE_DATA_APPROVED:'true',SUPABASE_URL:origin,ORBE_PUBLISHABLE_KEY:'sb_publishable_fixture',ORBE_BACKEND_SECRET_KEY:'sb_secret_fixture',PLUGGY_CLIENT_ID:'fixture-client',PLUGGY_CLIENT_SECRET:'fixture-client-secret-12345'};
 const token='fixture.'+Buffer.from(JSON.stringify({sub:owner,session_id:sid,iss:origin+'/auth/v1',aud:'authenticated',role:'authenticated',is_anonymous:false,exp:Math.floor(now/1000)+600})).toString('base64url')+'.fixture_signature';
 const session=new SessionModel({origin,signIn:async()=>({accessToken:token,expiresAt:now+600000}),signOut:async()=>{}},Date.now,()=>()=>{});await session.login('fixture@example.invalid','fixture-password');
 const backend=createActivationBackendRuntime(name=>config[name],{fixtureOnly:true,transport:async(url,init)=>{
  calls.push(url);
  if(url===origin+'/auth/v1/user')return json({id:owner,is_anonymous:false});if(url.endsWith('/orbe_has_session'))return json(true);
  if(url.endsWith('/orbe_resolve_pending_inventory'))return json({ownerId:owner,connectionId:conn,revision:1,itemId:item});
  if(url.endsWith('/orbe_activate_connection')){commitCount++;const p=JSON.parse(init.body);assert.equal(p.p_session_id,sid);assert.equal(p.p_owner_id,owner);assert.equal(p.p_evidence.itemId,item);assert.equal(p.p_evidence.capabilities.reserves,false);if(options.commitFalse)return json(false);if(!options.staleStatus)Object.assign(metadata,{state:'active',revision:2,capabilities:{accounts:true,transactions:true,investments:true,reserves:false},openFinanceVerifiedAt:new Date(now).toISOString(),proxyConsentExpiresAt:expiry,authorizationExpiresAt:expiry});return json(true);}
  if(url==='https://api.pluggy.ai/auth')return json({apiKey:'fixture-provider-key'});
  if(url==='https://api.pluggy.ai/items/'+item)return json({id:item,connector:{name:'MeuPluggy',isSandbox:false},status:'UPDATED',executionStatus:'SUCCESS',error:null,products:['ACCOUNTS','TRANSACTIONS','INVESTMENTS'],consentExpiresAt:expiry,lastUpdatedAt:null,owner:'PRIVATE_EXTRA'});
  if(url==='https://api.pluggy.ai/items/'+id(40))return json({id:id(40),connector:{id:606,isOpenFinance:true,isSandbox:false},status:'UPDATED',executionStatus:'SUCCESS',error:null,products:['ACCOUNTS','TRANSACTIONS','INVESTMENTS']});
  if(url==='https://api.pluggy.ai/items/'+id(99))return json({id:id(99),connector:{id:999,isOpenFinance:false,isSandbox:false},status:'UPDATED',executionStatus:'SUCCESS',error:null,products:[]});
  if(url==='https://api.pluggy.ai/consents?itemId='+item){if(options.lock)session.lock();return json({page:1,total:1,totalPages:1,results:[{itemId:options.foreign?id(99):id(40),createdAt:new Date(now-10000).toISOString(),expiresAt:null,revokedAt:null,products:['ACCOUNTS','TRANSACTIONS','INVESTMENTS'],openFinancePermissionsGranted:['ACCOUNTS_ALL','INVESTMENTS_ALL'],owner:'PRIVATE_EXTRA'}]});}
  throw Error('unexpected_destination');
 }});
 const listeners=new Set(),protection={getSnapshot:()=>({phase:'ready',active:true}),subscribe(fn){listeners.add(fn);return()=>listeners.delete(fn)}};
 const client=createActivationRuntime(session,protection,()=>({origin,publishableKey:config.ORBE_PUBLISHABLE_KEY}),async(url,init)=>{
  clientCalls.push(url);if(url.endsWith('/connections/status'))return json({connections:[metadata]});
  const target=new URL(url);target.pathname=target.pathname.slice('/functions/v1'.length);const response=await backend.handler(new Request(target,init));const text=await response.clone().text();for(const sensitive of [owner,sid,item,'PRIVATE_EXTRA','fixture-provider-key'])assert.ok(!text.includes(sensitive));return response;
 },options.flags??flags);
 return {client,calls,clientCalls,raw:(body,authorized=true)=>backend.handler(new Request(origin+'/orbe-bridge/connections/activate',{method:'POST',headers:{'Content-Type':'application/json',...(authorized?{Authorization:'Bearer '+token}:{})},body:JSON.stringify(body)})),commits:()=>commitCount,close(){if(client.kind==='ready')client.close();backend.close();}};
}
test('activation connects client session provider evidence commit and confirmed status without products reads',async()=>{const f=await fixture();try{assert.equal(f.client.kind,'ready');assert.equal(await f.client.controller.run(conn),true);assert.equal(f.client.controller.getSnapshot().notice,'activated');assert.equal(f.commits(),1);assert.equal(f.calls.filter(url=>url.startsWith('https://api.pluggy.ai/')).length,4);assert.ok(f.calls.every(url=>!url.includes('/accounts?')&&!url.includes('/transactions')&&!url.includes('/investments')));}finally{f.close();}});
test('different item consent remains blocked, cannot activate through client declaration',async()=>{const f=await fixture({foreign:true});try{assert.equal(await f.client.controller.run(conn),false);assert.equal(f.client.controller.getSnapshot().notice,'origin_unconfirmed');assert.equal(f.commits(),0);}finally{f.close();}});
test('failed SQL commit or unconfirmed final status cannot claim activation',async()=>{for(const options of [{commitFalse:true},{staleStatus:true}]){const f=await fixture(options);try{assert.equal(await f.client.controller.run(conn),false);assert.equal(f.client.controller.getSnapshot().notice,options.staleStatus?'uncertain':'unavailable');}finally{f.close();}}});
test('lock aborts before commit and closes activation action',async()=>{const f=await fixture({lock:true});try{assert.equal(await f.client.controller.run(conn),false);assert.equal(f.client.controller.getSnapshot().phase,'closed');assert.equal(f.commits(),0);}finally{f.close();}});
test('activation gate off means zero status Auth provider or SQL calls',async()=>{const f=await fixture({flags:{...flags,connectionActivationEnabled:false}});try{assert.equal(f.client.kind,'disabled');assert.deepEqual(f.calls,[]);assert.deepEqual(f.clientCalls,[]);}finally{f.close();}});

test('activation rejects missing bearer and client-supplied approval before provider or commit',async()=>{for(const authorized of [false,true]){const f=await fixture();try{const response=await f.raw({connectionId:conn,revision:1,approved:true},authorized);assert.equal(response.status,authorized?400:401);assert.equal(f.commits(),0);assert.ok(!f.calls.some(url=>url.startsWith('https://api.pluggy.ai/')));}finally{f.close();}}});
