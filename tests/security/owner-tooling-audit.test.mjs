import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import path from 'node:path';
import { validateOwnerToolingAudit } from '../../scripts/owner-tooling-audit.mjs';
const url = 'https://github.com/advisories/GHSA-86w9-cpqp-85rv';
function fixture() {
  const lockSha256 = 'a'.repeat(64);
  return {
    audit: { metadata: { vulnerabilities: { critical: 0 } }, vulnerabilities: { 'node-forge': { via: [{ url }], nodes: ['node_modules/node-forge'] } } },
    evidence: { config: { slug:'orbe-finance',scheme:'orbe',sdkVersion:'58.0.0',runtimeVersion:{policy:'sdkVersion'},extra:{liveIntegrationEnabled:true,eas:{projectId:'69843dfe-ab1b-469e-bb78-c7948bbf1d9b'}} }, lock:{packages:{'node_modules/node-forge':{version:'1.4.0'}}},lockSha256,runtimeReport:{lockSha256,advisoryRootsAbsent:true,packages:[{name:'react',version:'19.3.0'}]} },
  };
}
test('owner tooling mitigation is scoped and never declares a patched dependency', () => {
  const f=fixture(); assert.deepEqual(validateOwnerToolingAudit(f.audit,f.evidence),{packages:1,advisories:1,scope:'reviewed-owner-tooling-sdk58',patched:false});
});
test('owner review rejects missing stale or reachable runtime evidence', () => {
  for(const change of [f=>delete f.evidence.runtimeReport,f=>f.evidence.runtimeReport.lockSha256='b'.repeat(64),f=>f.evidence.runtimeReport.advisoryRootsAbsent=false,f=>f.evidence.runtimeReport.packages.push({name:'node-forge'})]) { const f=fixture();change(f);assert.throws(()=>validateOwnerToolingAudit(f.audit,f.evidence),/runtime_unverified/); }
});
test('owner review rejects another SDK project and custom signing', () => {
  for(const change of [f=>f.evidence.config.sdkVersion='57.0.0',f=>f.evidence.config.extra.eas.projectId='invented',f=>f.evidence.config.updates={codeSigningCertificate:'invented'},f=>f.evidence.config.updates={codeSigningMetadata:{}},f=>f.evidence.config.extra.liveIntegrationEnabled=false]) { const f=fixture();change(f);assert.throws(()=>validateOwnerToolingAudit(f.audit,f.evidence),/configuration_rejected/); }
});
test('owner review never permits a new advisory critical or unreviewed package instance', () => {
  for(const change of [f=>f.audit.vulnerabilities['node-forge'].via=[{url:'https://example.invalid/new'}],f=>f.audit.metadata.vulnerabilities.critical=1,f=>f.audit.vulnerabilities['node-forge'].nodes=['node_modules/other/node_modules/node-forge'],f=>f.evidence.lock.packages['node_modules/node-forge'].version='1.4.1']) { const f=fixture();change(f);assert.throws(()=>validateOwnerToolingAudit(f.audit,f.evidence)); }
});
test('official patched Zod remains compatible with installed Expo tooling schemas', () => {
  const require=createRequire(import.meta.url),root=path.dirname(require.resolve('@expo/cli/package.json'));
  const {PluginSchema,DevToolsPluginOutputSchema}=require(path.join(root,'build/src/start/server/DevToolsPlugin.schema.js'));
  assert.equal(PluginSchema.safeParse({packageName:'invented',packageRoot:'/invented'}).success,true);
  assert.equal(PluginSchema.safeParse({packageName:0,packageRoot:'/invented'}).success,false);
  assert.equal(DevToolsPluginOutputSchema.safeParse([{type:'text',text:'synthetic',level:'info'}]).success,true);
  const {createMCPDevToolsExtensionSchema}=require(path.join(root,'build/src/start/server/createMCPDevToolsExtensionSchema.js'));
  const schema=createMCPDevToolsExtensionSchema({packageName:'invented',cliExtensions:{commands:[{name:'synthetic',title:'Synthetic fixture',parameters:[{name:'count',type:'number'}]}]}});
  assert.equal(schema.safeParse({command:'synthetic',count:1}).success,true);
  assert.equal(schema.safeParse({command:'unrecognized'}).success,false);
});
