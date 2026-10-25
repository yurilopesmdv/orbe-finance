import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { createRequire } from 'node:module';
import ts from 'typescript';
const require = createRequire(import.meta.url);
const root = path.dirname(require.resolve('expo-linking/package.json'));
const config = JSON.parse(readFileSync(new URL('../../app.json',import.meta.url),'utf8')).expo;
// Execute installed linking implementation, replacing only native host constants.
// This reproduces the production/standalone branch observed on the iPhone.
function linking(expoConfig, environment = 'standalone') {
  const constants = { executionEnvironment:environment,expoConfig,linkingUri:'exp://u.expo.dev/update/invented',expoGoConfig:environment==='storeClient'?{developer:{tool:'expo-cli'}}:null };
  const cache = new Map();
  function load(file) {
    if (cache.has(file)) return cache.get(file).exports;
    const module = {exports:{}};cache.set(file,module);
    const source = ts.transpileModule(readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText;
    vm.runInNewContext(source, {module,exports:module.exports,__DEV__:environment==='storeClient',URL,URLSearchParams,console:{warn(){}},require(name){
      if(name==='expo/internal/bundle-origin')return {getBundleOrigin:()=>environment==='storeClient'&&expoConfig.hostUri?'http://'+expoConfig.hostUri:null};
      if(name==='expo-constants')return {__esModule:true,default:constants,ExecutionEnvironment:{Bare:'bare',Standalone:'standalone',StoreClient:'storeClient'}};
      if(name==='expo-modules-core')return {Platform:{OS:'ios',select:values=>values.ios??values.default}};
      if(name.startsWith('.'))return load(path.resolve(path.dirname(file),name+'.js'));
      return require(name);
    }},{filename:file});
    return module.exports;
  }
  return {schemes:load(path.join(root,'build/Schemes.js')),urls:load(path.join(root,'build/createURL.js'))};
}
test('old published configuration reproduces the exact production startup failure',()=>{
  const old={...config};delete old.scheme;
  assert.throws(()=>linking(old).urls.createURL('/'),/Cannot make a deep link into a standalone app with no custom scheme defined/);
});
test('published config resolves Router root and private routes in production standalone',()=>{
  const actual=linking(config);
  assert.equal(actual.schemes.resolveScheme({}), 'orbe');
  for(const route of ['/','/login','/account','/my-connections','/reports']) {
    const url=actual.urls.createURL(route);
    assert.equal(new URL(url).protocol,'orbe:');assert.ok(url.includes(route));
  }
});
test('development store client still resolves the Expo scheme',()=>{
  const actual=linking({...config,hostUri:'192.168.18.7:8083'},'storeClient');
  assert.equal(actual.schemes.resolveScheme({}), 'exp');
  assert.match(actual.urls.createURL('/login'),/^exp:\/\/192\.168\.18\.7:8083\/--\/login$/);
});
