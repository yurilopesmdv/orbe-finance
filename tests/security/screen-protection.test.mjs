import {palette} from '../../src/components/theme.ts';
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import { createRequire } from 'node:module';
import { ScreenProtectionModel, createScreenRegistry } from '../../src/features/privacy/screen-protection.ts';
const require=createRequire(import.meta.url),flush=()=>new Promise(r=>setImmediate(r));
const deferred=()=>{let resolve;const promise=new Promise(r=>{resolve=r;});return {resolve,promise};};
function modelFixture(activate=async()=>{}){const calls=[],timers=new Map();let index=0;const model=new ScreenProtectionModel({activate:async()=>{calls.push('activate');await activate();},release:async()=>{calls.push('release');}},{set:(callback,ms)=>{assert.equal(ms,5000);timers.set(++index,callback);return index;},clear:id=>timers.delete(id)});return {model,calls,timers,timeout:()=>{for(const cb of [...timers.values()])cb();}};}
test('private protection starts closed to content until native success and active state',async()=>{
  const f=modelFixture();assert.deepEqual(f.model.getSnapshot(),{phase:'preparing',active:false});assert.equal(await f.model.start(),true);assert.equal(f.model.getSnapshot().phase,'ready');assert.equal(f.model.getSnapshot().active,false);f.model.setActive(true);assert.equal(f.model.getSnapshot().active,true);f.model.close();
});
test('repeated callers share one initialization and readiness is cached',async()=>{
  const pending=deferred(),f=modelFixture(()=>pending.promise);const a=f.model.start(),b=f.model.start();assert.equal(a,b);await flush();assert.equal(f.calls.length,1);pending.resolve();assert.equal(await a,true);assert.equal(await f.model.start(),true);assert.equal(f.calls.length,1);f.model.close();
});
test('native failure leaves generic unavailable snapshot and explicit retry can recover',async()=>{
  let attempts=0;const f=modelFixture(async()=>{if(++attempts===1)throw Error('private-native-details');});assert.equal(await f.model.start(),false);assert.deepEqual(f.model.getSnapshot(),{phase:'unavailable',active:false});assert.equal(await f.model.start(),true);assert.equal(f.timers.size,0);f.model.close();
});
test('5 second deadline prevents endless private loading and late completion cannot open content',async()=>{
  const pending=deferred(),f=modelFixture(()=>pending.promise);f.model.setActive(true);const work=f.model.start();await flush();f.timeout();assert.equal(await work,false);assert.equal(f.model.getSnapshot().phase,'unavailable');pending.resolve();await flush();assert.equal(f.model.getSnapshot().phase,'unavailable');assert.equal(f.timers.size,0);f.model.close();
});
test('unmount cancels pending readiness immediately and rejects late results',async()=>{
  const pending=deferred(),f=modelFixture(()=>pending.promise);const work=f.model.start();await flush();f.model.close();assert.equal(await work,false);pending.resolve();await flush();assert.deepEqual(f.model.getSnapshot(),{phase:'closed',active:false});assert.equal(await f.model.start(),false);assert.equal(f.calls.filter(x=>x==='release').length,1);
});
test('AppState loss hides content without rerunning native setup or making network calls',async()=>{
  const f=modelFixture();await f.model.start();f.model.setActive(true);f.model.setActive(false);assert.equal(f.model.getSnapshot().active,false);f.model.setActive(true);assert.equal(f.calls.length,1);f.model.close();
});
function registryFixture(overrides={}){
  const calls=[];const native={available:async()=>{calls.push(['available']);return true;},prevent:async key=>{calls.push(['prevent',key]);},allow:async key=>{calls.push(['allow',key]);},blur:async()=>{calls.push(['blur']);},unblur:async()=>{calls.push(['unblur']);},...overrides};return {registry:createScreenRegistry(native),calls};
}
test('cleanup only releases its own capture key and preserves blur for another owner',async()=>{
  const f=registryFixture(),a=f.registry.create(),b=f.registry.create();await a.activate();await b.activate();const keys=f.calls.filter(x=>x[0]==='prevent').map(x=>x[1]);assert.notEqual(keys[0],keys[1]);await a.release();assert.deepEqual(f.calls.filter(x=>x[0]==='allow'),[['allow',keys[0]]]);assert.equal(f.calls.some(x=>x[0]==='unblur'),false);await b.release();assert.equal(f.calls.filter(x=>x[0]==='unblur').length,1);
});
test('overlapping effect cleanup cannot disable a newer root protection',async()=>{
  const pending=deferred(),f=registryFixture({available:async()=>{await pending.promise;return true;}}),old=f.registry.create(),next=f.registry.create();
  const oldWork=old.activate().catch(()=>false);await flush();const release=old.release(),newWork=next.activate();pending.resolve();assert.equal(await oldWork,false);await release;await newWork;assert.equal(f.calls.some(x=>x[0]==='unblur'),false);assert.equal(f.calls.filter(x=>x[0]==='prevent').length,1);await next.release();
});
test('unsupported capture never reports ready and released resource cannot reactivate',async()=>{
  const f=registryFixture({available:async()=>false}),port=f.registry.create();await assert.rejects(port.activate(),{message:'screen_protection_unavailable'});assert.equal(f.calls.some(x=>x[0]==='prevent'),false);await port.release();await assert.rejects(port.activate(),{message:'screen_protection_unavailable'});
});
test('capture setup and cleanup are serialized even with a delayed native operation',async()=>{
  const pending=deferred();let running=false;const f=registryFixture({prevent:async()=>{running=true;await pending.promise;running=false;},allow:async()=>{assert.equal(running,false);}}),port=f.registry.create();const setup=port.activate().catch(()=>false);await flush();const cleanup=port.release();pending.resolve();await setup;await cleanup;
});
function load(file,overrides){const module={exports:{}};const source=ts.transpileModule(readFileSync(new URL(file,import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX}}).outputText;vm.runInNewContext(source,{module,exports:module.exports,Date,Promise,require(name){if(name in overrides)return overrides[name];return require(name);}});return module.exports;}
test('native adapter selects screen prevention and full app switcher blur without photo permissions',async()=>{
  const calls=[];const api={isAvailableAsync:async()=>true,preventScreenCaptureAsync:async key=>calls.push(['prevent',key]),allowScreenCaptureAsync:async key=>calls.push(['allow',key]),enableAppSwitcherProtectionAsync:async value=>calls.push(['blur',value]),disableAppSwitcherProtectionAsync:async()=>calls.push(['unblur'])};
  const adapter=load('../../src/features/privacy/native-screen.ts',{'expo-screen-capture':api,'react-native':{Platform:{OS:'ios'}},'./screen-protection':{createScreenRegistry}});const port=adapter.createNativeScreenPorts();await port.activate();await port.release();assert.deepEqual(calls.map(x=>x[0]),['prevent','blur','allow','unblur']);assert.equal(calls[1][1],1);assert.equal(calls[0][1],calls[2][1]);
});
test('private React boundary omits sensitive children in every blocked state',()=>{
  const secret={type:'SecretField',props:{value:'synthetic-private-canary'}};
  for(const snapshot of [{phase:'preparing',active:true},{phase:'unavailable',active:true},{phase:'ready',active:false},{phase:'closed',active:false}]){
    const {PrivateScreen}=load('../../src/components/private-screen.tsx',{'@/components/theme':{palette},'react-native':{Pressable:'Pressable',Text:'Text',View:'View',StyleSheet:{create:v=>v}},'react-native-safe-area-context':{SafeAreaView:'SafeArea'},'expo-router':{useRouter:()=>({replace(){}})},'@/features/privacy/provider':{useScreenProtection:()=>({snapshot,retry(){}})}});
    const output=PrivateScreen({children:secret});assert.notEqual(output,secret);assert.ok(!JSON.stringify(output).includes('synthetic-private-canary'));
  }
});
