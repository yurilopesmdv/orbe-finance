import test from 'node:test';
import assert from 'node:assert/strict';
import { inspectRuntimeMap } from '../../scripts/runtime-audit-policy.mjs';
const lock={packages:{'node_modules/react':{version:'19.2.3'},'node_modules/braces':{version:'3.0.3'},'node_modules/node-forge':{version:'1.4.0'}}};
const map=(sources)=>({version:3,sources});
test('normal Metro map inventories versions without sources content or private paths',()=>{
  const result=inspectRuntimeMap({...map(['src/app/index.tsx','node_modules/react/index.js','node_modules/react/index.js']),sourcesContent:['private-value']},lock);
  assert.deepEqual(result,{sourceCount:2,packageCount:1,advisoryRootsAbsent:true,packages:[{name:'react',version:'19.2.3'}]});assert.ok(!JSON.stringify(result).includes('private-value'));
});
test('indexed maps are recursively inspected rather than skipping inner sources',()=>{
  const result=inspectRuntimeMap({version:3,sections:[{map:map(['node_modules/react/index.js'])}]},lock);assert.equal(result.packageCount,1);
  assert.throws(()=>inspectRuntimeMap({version:3,sections:[{map:map(['node_modules/node-forge/lib/rsa.js'])}]},lock),/advisory_dependency/);
});
test('both vulnerable roots including nested dependencies and Windows paths fail closed',()=>{
  for(const source of ['node_modules/braces/index.js','node_modules/example/node_modules/node-forge/index.js','..\\node_modules\\braces\\index.js'])assert.throws(()=>inspectRuntimeMap(map([source]),lock),/advisory_dependency/);
});
test('dotenv and activation sources cannot be mistaken for a safe runtime graph',()=>{
  for(const source of ['.env','../.env.backend.local','/private/backend.env','owner-setup.txt','expo-publish.env'])assert.throws(()=>inspectRuntimeMap(map(['node_modules/react/index.js',source]),lock),/private_source/);
});
test('missing graph malformed map external sections and unknown lock package are rejected',()=>{
  for(const value of [null,{},map([]),map([null]),{version:3,sections:[]},{version:3,sections:[{url:'https://evil.invalid/map'}]},{...map(['node_modules/react/index.js']),sourceRoot:'https://evil.invalid/'}])assert.throws(()=>inspectRuntimeMap(value,lock));
  assert.throws(()=>inspectRuntimeMap(map(['src/app/index.tsx']),lock),/packages_missing/);
  assert.throws(()=>inspectRuntimeMap(map(['node_modules/unknown/index.js']),lock),/package_unresolved/);
});

test('only known Metro virtual polyfill names may contain a leading NUL',()=>{
  const result=inspectRuntimeMap(map(['node_modules/react/index.js','\0polyfill:external-require']),lock);assert.equal(result.sourceCount,2);
  assert.throws(()=>inspectRuntimeMap(map(['node_modules/react/index.js','\0unknown']),lock),/map_invalid/);
});

test('nested dependency version resolves from its own lock location, never the root copy',()=>{
  const nested={packages:{...lock.packages,'node_modules/example/node_modules/react':{version:'18.3.1'}}};
  const sources=['node_modules/react/index.js','node_modules/example/node_modules/react/index.js'];
  const result=inspectRuntimeMap(map(sources),nested);
  assert.equal(result.packageCount,2);assert.deepEqual(result.packages,[{name:'react',version:'18.3.1'},{name:'react',version:'19.2.3'}]);
  assert.ok(!JSON.stringify(result).includes('node_modules'));
  assert.throws(()=>inspectRuntimeMap(map(sources),lock),/package_unresolved/);
});
