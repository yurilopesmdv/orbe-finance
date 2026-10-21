import test from 'node:test';
import assert from 'node:assert/strict';
import { createAccountNetworkTransport } from '../../supabase/functions/_shared/account-network.ts';
import { createPluggyAuthPort } from '../../supabase/functions/_shared/pluggy-auth.ts';
const own='https://vvaufaoahotmaocrcyij.supabase.co',provider='https://api.pluggy.ai',id='11111111-1111-4111-8111-111111111111';
const init=()=>({method:'GET',headers:{Accept:'application/json','X-API-KEY':'invented-api-key-12345'},signal:new AbortController().signal});
const json=value=>new Response(JSON.stringify(value),{headers:{'Content-Type':'application/json'}});
function fixture(){const calls=[];return{calls,port:createAccountNetworkTransport({enabled:true,privateDataApproved:true,network:async(url,input)=>{calls.push({url,input});return json({});}})};}
test('independent gates never access input or network',async()=>{for(const options of [{},{enabled:true},{privateDataApproved:true}]){const port=createAccountNetworkTransport({...options,get network(){throw Error('read private port');}});await assert.rejects(port(new Proxy({},{get(){throw Error('private');}}),null),/account_network_unavailable/);}});
test('provider items and accounts only force network privacy options',async()=>{const f=fixture();for(const url of [provider+'/items/'+id,provider+'/accounts?itemId='+id])await f.port(url,{...init(),redirect:'follow',credentials:'include',referrerPolicy:'unsafe-url'});assert.equal(f.calls.length,2);for(const {input}of f.calls){assert.equal(input.redirect,'error');assert.equal(input.credentials,'omit');assert.equal(input.cache,'no-store');assert.equal(input.referrerPolicy,'no-referrer');}});
test('foreign host global listing pagination writes and fragments never call network',async()=>{const f=fixture();for(const url of [provider+'.evil.invalid/items/'+id,provider+'/v2/items',provider+'/accounts?itemId='+id+'&page=2',provider+'/items/'+id+'#fragment','http://api.pluggy.ai/items/'+id,provider+'/items/%31'+id.slice(1)])await assert.rejects(f.port(url,init()));await assert.rejects(f.port(provider+'/items/'+id,{...init(),method:'PATCH'}));assert.equal(f.calls.length,0);});
test('credentials cannot cross hosts or carry tracking and cookie headers',async()=>{const f=fixture();for(const extra of [{apikey:'sb_secret_invented'},{Authorization:'Bearer invented'},{Cookie:'private'},{baggage:'private'},{Referer:'https://private.invalid'}])await assert.rejects(f.port(provider+'/items/'+id,{...init(),headers:{...init().headers,...extra}}));await assert.rejects(f.port(own+'/auth/v1/user',init()));assert.equal(f.calls.length,0);});
test('own Auth session and service RPC credentials stay on own host',async()=>{const f=fixture();await f.port(own+'/auth/v1/user',{...init(),headers:{Accept:'application/json',apikey:'sb_publishable_invented',Authorization:'Bearer invented.token'}});await f.port(own+'/rest/v1/rpc/orbe_has_session',{...init(),method:'POST',body:'{}',headers:{Accept:'application/json','Content-Type':'application/json',apikey:'sb_publishable_invented',Authorization:'Bearer invented.token'}});for(const name of ['orbe_begin_connection_read','orbe_check_connection_read','orbe_finish_connection_read','orbe_resolve_account_read'])await f.port(own+'/rest/v1/rpc/'+name,{...init(),method:'POST',body:'{}',headers:{Accept:'application/json','Content-Type':'application/json',apikey:'sb_secret_invented'}});assert.equal(f.calls.length,6);});
test('preabort oversized body missing signal and GET body are rejected before network',async()=>{const f=fixture(),controller=new AbortController();controller.abort();for(const patch of [{signal:controller.signal},{signal:null},{body:'private'}])await assert.rejects(f.port(provider+'/items/'+id,{...init(),...patch}));await assert.rejects(f.port(provider+'/auth',{...init(),method:'POST',body:'x'.repeat(16385),headers:{Accept:'application/json','Content-Type':'application/json'}}));assert.equal(f.calls.length,0);});
test('redirect status and remote exception expose only generic error',async()=>{for(const network of [async()=>new Response(null,{status:302}),async()=>{throw Error('invented-secret-content');}]){const port=createAccountNetworkTransport({enabled:true,privateDataApproved:true,network});await assert.rejects(port(provider+'/items/'+id,init()),error=>error.message==='account_network_unavailable');}});
test('existing provider account port can exchange key through network boundary without real network',async()=>{let calls=0;const transport=createAccountNetworkTransport({enabled:true,privateDataApproved:true,network:async(url)=>{calls++;assert.equal(url,provider+'/auth');return json({apiKey:'invented-api-key-12345'});}});const port=createPluggyAuthPort(()=>({clientId:'invented',clientSecret:'invented-client-secret'}),{enabled:true,fixtureOnly:true,transport});try{assert.equal(await port.authenticate(new AbortController().signal),'ready');assert.equal(calls,1);}finally{port.close();}});

const txAccount='22222222-2222-4222-8222-222222222222';
const txScope=()=>({binding:{itemId:id,accountIds:[txAccount]},month:'2026-10'});
const firstTx=(account=txAccount,from='2026-10-01',to='2026-10-31')=>provider+'/v2/transactions?accountId='+account+'&dateFrom='+from+'&dateTo='+to;
function transactions(scope=txScope(),extra={}){const calls=[];const port=createAccountNetworkTransport({enabled:true,privateDataApproved:true,mode:'fixture',transactionReadsEnabled:true,transactionScope:scope,network:async(url,input)=>{calls.push({url,input});return json({});},...extra});return{port,calls};}

test('transaction route stays closed by default and unused scope is not inspected',async()=>{
  const calls=[];const port=createAccountNetworkTransport({enabled:true,privateDataApproved:true,get transactionScope(){throw Error('must not inspect');},network:async()=>{calls.push(true);return json({});}});
  await assert.rejects(port(firstTx(),init()),/account_network_unavailable/);assert.equal(calls.length,0);
  await port(provider+'/items/'+id,init());assert.equal(calls.length,1);
});

test('scoped transaction first and opaque next queries preserve exact URL and forced privacy',async()=>{
  const f=transactions(),next=firstTx()+'&after=opaque%2Bcursor%3D';
  for(const url of [firstTx(),next,firstTx(txAccount,'2026-11-01','2026-11-01')])await f.port(url,init());
  assert.equal(f.calls.length,3);assert.equal(f.calls[1].url,next);
  for(const {input}of f.calls){assert.equal(input.redirect,'error');assert.equal(input.credentials,'omit');assert.equal(input.cache,'no-store');assert.equal(input.referrerPolicy,'no-referrer');}
});

test('captured month account and item scope survives later caller mutation',async()=>{
  const scope=txScope(),f=transactions(scope);scope.binding.accountIds[0]=id;scope.binding.itemId=txAccount;scope.month='2026-09';
  await f.port(firstTx(),init());await f.port(provider+'/items/'+id,init());await f.port(provider+'/accounts?itemId='+id,init());
  for(const url of [firstTx(id),firstTx(txAccount,'2026-09-01','2026-09-30'),provider+'/items/'+txAccount,provider+'/accounts?itemId='+txAccount])await assert.rejects(f.port(url,init()));
  assert.equal(f.calls.length,3);
});

test('invalid transaction configuration or fixture without injected network never falls back to fetch',async()=>{
  for(const scope of [null,{binding:{itemId:id,accountIds:[]},month:'2026-10'},{binding:{itemId:id,accountIds:Array(1)},month:'2026-10'},{binding:{itemId:id,accountIds:[txAccount,txAccount]},month:'2026-10'},{binding:{itemId:id+'\n',accountIds:[txAccount]},month:'2026-10'},{...txScope(),month:'invalid'}]){
    const port=createAccountNetworkTransport({enabled:true,privateDataApproved:true,mode:'fixture',transactionReadsEnabled:true,transactionScope:scope,get network(){throw Error('must not read network');}});
    await assert.rejects(port(firstTx(),init()),/account_network_unavailable/);
  }
  const port=createAccountNetworkTransport({enabled:true,privateDataApproved:true,mode:'fixture',transactionReadsEnabled:true,transactionScope:txScope()});await assert.rejects(port(firstTx(),init()));
});

test('scoped live mode requires private approval and does not grant arbitrary products',async()=>{
  const f=transactions(txScope(),{mode:'live'});await f.port(firstTx(),init());assert.equal(f.calls.length,1);
  for(const url of [provider+'/v2/items',provider+'/transactions?accountId='+txAccount,provider+'/investments?itemId='+id,provider+'/identity?itemId='+id,provider+'/payments'])await assert.rejects(f.port(url,init()));
  const off=transactions(txScope(),{privateDataApproved:false});await assert.rejects(off.port(firstTx(),init()));assert.equal(off.calls.length,0);
});

test('cross account period duplicate query SSRF and unknown filters are denied before network',async()=>{
  const f=transactions();
  for(const url of [firstTx(id),firstTx(txAccount,'2026-09-01','2026-09-30'),firstTx()+'&accountId='+txAccount,firstTx()+'&unknown=1',firstTx()+'&after=http://evil.invalid',firstTx()+'&after=%00',firstTx().replace(provider,provider+'.evil.invalid'),firstTx()+'#fragment',firstTx().replace('https://','http://'),provider+'/v2/transactions?accountId='+txAccount+'&after=opaque'])await assert.rejects(f.port(url,init()));
  assert.equal(f.calls.length,0);
});

test('transaction reads reject cookies wrong credential headers writes bodies preabort and redirects',async()=>{
  const f=transactions(),controller=new AbortController();controller.abort();
  for(const patch of [{method:'POST',body:'{}'},{body:'private'},{signal:controller.signal},{headers:{...init().headers,Cookie:'private'}},{headers:{...init().headers,Authorization:'Bearer private'}},{headers:{Accept:'application/json',apikey:'sb_secret_invented'}}])await assert.rejects(f.port(firstTx(),{...init(),...patch}));
  assert.equal(f.calls.length,0);
  const redirected=transactions(txScope(),{network:async()=>new Response(null,{status:302})});await assert.rejects(redirected.port(firstTx(),init()),error=>error.message==='account_network_unavailable');
});
