import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createPluggyAuthPort } from '../../supabase/functions/_shared/pluggy-auth.ts';
const credential={clientId:'invented-client-id',clientSecret:'invented-client-secret-123'};
const secret='invented-api-key-never-expose';
const json=(value,status=200,headers={})=>new Response(JSON.stringify(value),{status,headers:{'Content-Type':'application/json',...headers}});
class Clock {
  value=1000;index=0;timers=new Map();
  now(){return this.value;}
  setTimer(callback,ms){const id=++this.index;this.timers.set(id,{at:this.value+ms,callback});return id;}
  clearTimer(id){this.timers.delete(id);}
  tick(ms){this.value+=ms;for(const [id,timer] of [...this.timers])if(timer.at<=this.value){this.timers.delete(id);timer.callback();}}
}
const signal=()=>new AbortController().signal;
function fixture(transport=async()=>json({apiKey:secret}),config=credential){
  const calls=[],clock=new Clock();
  const port=createPluggyAuthPort(()=>config,{enabled:true,fixtureOnly:true,clock,transport:async(url,init)=>{calls.push({url,init});return transport(url,init);}});
  return {port,calls,clock};
}
const flush=()=>new Promise(resolve=>setImmediate(resolve));
test('disabled and missing fixture gate touch no config transport clock or input',async()=>{
  const poison=new Proxy({}, {get(){throw Error('private');}});
  for(const options of [{},{enabled:true},{enabled:false,fixtureOnly:true}]){
    const port=createPluggyAuthPort(()=>{throw Error();},{...options,get transport(){throw Error();},get clock(){throw Error();}});
    assert.equal(await port.authenticate(poison),'disabled');port.close();
  }
});
test('invalid technical configuration fails without network and exposes no raw error',async()=>{
  for(const config of [{clientId:'https://evil.invalid',clientSecret:credential.clientSecret},{...credential,clientSecret:'bad\nheader'},{...credential,clientId:null},null]){
    const {port,calls}=fixture(undefined,config);assert.equal(await port.authenticate(signal()),'unavailable');assert.equal(calls.length,0);
  }
});
test('fixture activation requires injected transport and never falls back to global fetch',async()=>{
  const port=createPluggyAuthPort(()=>credential,{enabled:true,fixtureOnly:true});assert.equal(await port.authenticate(signal()),'unavailable');
});
test('fixed auth origin receives credentials only in JSON and returns no key',async()=>{
  const {port,calls}=fixture();assert.equal(await port.authenticate(signal()),'ready');
  assert.deepEqual(Object.keys(port),['authenticate','close']);
  assert.equal(calls.length,1);const {url,init}=calls[0];assert.equal(url,'https://api.pluggy.ai/auth');
  assert.equal(init.method,'POST');assert.deepEqual(JSON.parse(init.body),credential);
  assert.equal(init.redirect,'error');assert.equal(init.credentials,'omit');assert.equal(init.cache,'no-store');assert.equal(init.referrerPolicy,'no-referrer');
  assert.ok(!JSON.stringify(init.headers).includes(credential.clientSecret));assert.ok(!url.includes(credential.clientId));port.close();
});
test('configuration primitive values are captured before mutation',async()=>{
  const config={...credential};const {port,calls}=fixture(undefined,config);config.clientId='replacement';config.clientSecret='replacement-secret';
  assert.equal(await port.authenticate(signal()),'ready');assert.deepEqual(JSON.parse(calls[0].init.body),credential);port.close();
});
test('cached readiness avoids repeated issuance and expires at119 minutes',async()=>{
  const {port,calls,clock}=fixture();assert.equal(await port.authenticate(signal()),'ready');
  clock.tick(119*60000-1);assert.equal(await port.authenticate(signal()),'ready');assert.equal(calls.length,1);
  clock.tick(1);assert.equal(await port.authenticate(signal()),'ready');assert.equal(calls.length,2);port.close();assert.equal(clock.timers.size,0);
});
test('clock rollback purges cached credentials before a later fresh authentication',async()=>{
  const {port,calls,clock}=fixture();assert.equal(await port.authenticate(signal()),'ready');clock.value=999;
  assert.equal(await port.authenticate(signal()),'unavailable');clock.value=2000;assert.equal(await port.authenticate(signal()),'ready');assert.equal(calls.length,2);port.close();
});
test('concurrent authentication returns busy without a second upstream call',async()=>{
  let resolve;const {port,calls}=fixture(()=>new Promise(done=>{resolve=done;}));const pending=port.authenticate(signal());
  assert.equal(await port.authenticate(signal()),'busy');assert.equal(calls.length,1);resolve(json({apiKey:secret}));assert.equal(await pending,'ready');port.close();
});
test('close aborts issuance and a late result cannot recreate readiness',async()=>{
  let resolve;const {port,calls}=fixture(()=>new Promise(done=>{resolve=done;}));const pending=port.authenticate(signal());port.close();
  assert.equal(await pending,'cancelled');assert.equal(calls[0].init.signal.aborted,true);resolve(json({apiKey:secret}));await flush();
  assert.equal(await port.authenticate(signal()),'unavailable');assert.equal(calls.length,1);
});
test('pre-aborted input performs no request or timer',async()=>{
  const {port,calls,clock}=fixture();const abort=new AbortController();abort.abort();assert.equal(await port.authenticate(abort.signal),'cancelled');assert.equal(calls.length,0);assert.equal(clock.timers.size,0);
});
test('cancel wins even when transport ignores AbortSignal',async()=>{
  let resolve;const {port,calls,clock}=fixture(()=>new Promise(done=>{resolve=done;}));const abort=new AbortController();const pending=port.authenticate(abort.signal);abort.abort();
  assert.equal(await pending,'cancelled');assert.equal(calls[0].init.signal.aborted,true);assert.equal(clock.timers.size,0);resolve(json({apiKey:secret}));await flush();port.close();
});
test('20 second total deadline wins against a non-cooperating transport',async()=>{
  const {port,calls,clock}=fixture(()=>new Promise(()=>{}));const pending=port.authenticate(signal());clock.tick(20000);
  assert.equal(await pending,'unavailable');assert.equal(calls[0].init.signal.aborted,true);assert.equal(clock.timers.size,0);port.close();
});
test('deadline covers body stream and late bytes cannot be promoted',async()=>{
  let body;const response=new Response(new ReadableStream({start(controller){body=controller;}}),{headers:{'Content-Type':'application/json'}});
  const {port,clock}=fixture(async()=>response);const pending=port.authenticate(signal());await flush();clock.tick(20000);
  assert.equal(await pending,'unavailable');await flush();assert.equal(clock.timers.size,0);port.close();
});
test('errors, unauthorized and rate limits never expose raw response bodies or retry',async()=>{
  for(const [status,expected] of [[401,'unavailable'],[403,'unavailable'],[429,'rate_limited'],[500,'unavailable']]){
    let reads=0;const fake={ok:false,status,redirected:false,headers:new Headers(),body:{cancel:async()=>{}},json(){reads++;throw Error('private');}};
    const {port,calls}=fixture(async()=>fake);assert.equal(await port.authenticate(signal()),expected);assert.equal(calls.length,1);assert.equal(reads,0);port.close();
  }
  const {port}=fixture(async()=>{throw Error('private-url-and-secret');});assert.equal(await port.authenticate(signal()),'unavailable');port.close();
});
test('redirect response is rejected without accepting a credential',async()=>{
  const response=json({apiKey:secret});Object.defineProperty(response,'redirected',{value:true});const {port}=fixture(async()=>response);assert.equal(await port.authenticate(signal()),'unavailable');port.close();
});
test('MIME malformed JSON excessive length and unexpected schema are refused',async()=>{
  const cases=[new Response('not json',{headers:{'Content-Type':'application/json'}}),json({apiKey:secret},200,{'Content-Type':'text/html'}),json({apiKey:secret},200,{'Content-Length':'5000'}),json({apiKey:secret},200,{'Content-Length':'not-a-number'}),json({apiKey:'x'.repeat(5000)}),json({apiKey:secret,extra:'private'}),json({apiKey:'bad\nheader'}),json([]),json({apiKey:null})];
  for(const response of cases){const {port}=fixture(async()=>response);assert.equal(await port.authenticate(signal()),'unavailable');port.close();}
});
test('invalid UTF8 cannot be interpreted as a credential',async()=>{
  const {port}=fixture(async()=>new Response(new Uint8Array([0xff,0xfe]),{headers:{'Content-Type':'application/json'}}));assert.equal(await port.authenticate(signal()),'unavailable');port.close();
});
test('closed cache cannot be reused and leaves no timers',async()=>{
  const {port,calls,clock}=fixture();await port.authenticate(signal());port.close();assert.equal(clock.timers.size,0);assert.equal(await port.authenticate(signal()),'unavailable');assert.equal(calls.length,1);
});
test('provider remains absent from client and both deployed entrypoint graphs',()=>{
  const root=new URL('../../',import.meta.url);
  function walk(folder){return fs.readdirSync(folder,{withFileTypes:true}).flatMap(entry=>entry.isDirectory()?walk(path.join(folder,entry.name)):[path.join(folder,entry.name)]);}
  for(const file of walk(fileURLToPath(new URL('src/',root))))assert.doesNotMatch(fs.readFileSync(file,'utf8'),/pluggy-auth|createPluggyAuthPort/);
  for(const file of ['supabase/functions/orbe-bridge/index.mjs','supabase/functions/orbe-metadata/index.mjs','supabase/functions/_shared/bridge.ts','supabase/functions/_shared/metadata-runtime.ts','supabase/functions/_shared/supabase-rest.ts'])assert.doesNotMatch(fs.readFileSync(new URL(file,root),'utf8'),/pluggy-auth|createPluggyAuthPort/);
});
