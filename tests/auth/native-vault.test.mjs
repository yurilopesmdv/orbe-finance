import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import { createRefreshVault } from '../../src/features/auth/refresh-vault.ts';
const origin=`https://${'a'.repeat(20)}.supabase.co`;
function adapter(platform='ios') {
  const calls=[];let stored=null;
  const native={WHEN_PASSCODE_SET_THIS_DEVICE_ONLY:42,getItemAsync:async(...args)=>{calls.push(['get',...args]);return stored;},setItemAsync:async(...args)=>{calls.push(['set',...args]);stored=args[1];},deleteItemAsync:async(...args)=>{calls.push(['delete',...args]);stored=null;}};
  const module={exports:{}};
  const source=ts.transpileModule(readFileSync(new URL('../../src/features/auth/native-vault.ts',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
  vm.runInNewContext(source,{module,exports:module.exports,require(name){if(name==='expo-secure-store')return native;if(name==='react-native')return {Platform:{OS:platform}};if(name==='./refresh-vault')return {createRefreshVault};throw Error();}});
  return {create:module.exports.createNativeRefreshVault,calls};
}
test('native adapter selects passcode device-only protection without FaceID or password storage',async()=>{
  const f=adapter();const vault=f.create(origin);const record={origin,refreshToken:'invented-refresh-token',rememberUntil:Date.now()+60000};
  await vault.write(record);assert.deepEqual(await vault.read(),record);await vault.clear();
  assert.deepEqual(f.calls.map(c=>c[0]),['set','get','delete']);
  for(const call of f.calls){assert.equal(call[1],'orbe.auth.refresh.v1.'+'a'.repeat(20));const options=call.at(-1);assert.equal(options.keychainAccessible,42);assert.equal(options.requireAuthentication,false);assert.equal(options.keychainService,'orbe.auth.session.v1');}
});
test('unsupported platform or origin never invokes native storage',()=>{
  for(const platform of ['web','android']){const f=adapter(platform);assert.equal(f.create(origin),undefined);assert.equal(f.calls.length,0);}
  const f=adapter();assert.equal(f.create('https://evil.invalid'),undefined);assert.equal(f.calls.length,0);
});
