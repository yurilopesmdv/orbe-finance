import { inspectAuditGraph } from './audit-policy.mjs';
const advisory = 'https://github.com/advisories/GHSA-86w9-cpqp-85rv';
const reviewed = new Map([
  ['expo','58.0.19'], ['@expo/cli','58.1.15'],
  ['@expo/code-signing-certificates','0.0.7'], ['expo-updates','58.0.18'], ['node-forge','1.4.0'],
]);
// OWNER-RELEASE authorizes this scoped personal publication. It does not renew
// the expired synthetic exception or label the unpatched dependency safe.
export function validateOwnerToolingAudit(audit, { config, lock, lockSha256, runtimeReport }) {
  if (config?.slug !== 'orbe-finance' || config.scheme !== 'orbe' || config.sdkVersion !== '58.0.0' || config.runtimeVersion?.policy !== 'sdkVersion' || config.extra?.eas?.projectId !== '69843dfe-ab1b-469e-bb78-c7948bbf1d9b' || config.extra.liveIntegrationEnabled !== true || config.updates?.codeSigningCertificate || config.updates?.codeSigningMetadata) throw Error('owner_tooling_configuration_rejected');
  if (!/^[a-f0-9]{64}$/.test(lockSha256 ?? '') || runtimeReport?.lockSha256 !== lockSha256 || runtimeReport.advisoryRootsAbsent !== true || !Array.isArray(runtimeReport.packages) || runtimeReport.packages.length === 0 || runtimeReport.packages.some(p => p.name === 'node-forge')) throw Error('owner_tooling_runtime_unverified');
  const result = inspectAuditGraph(audit, new Set([advisory]));
  for (const [name, vulnerability] of Object.entries(audit.vulnerabilities)) {
    const location = 'node_modules/' + name;
    if (!reviewed.has(name) || lock?.packages?.[location]?.version !== reviewed.get(name) || vulnerability.nodes?.length !== 1 || vulnerability.nodes[0] !== location) throw Error('owner_tooling_scope_rejected');
  }
  return { ...result, scope: 'reviewed-owner-tooling-sdk58', patched: false };
}
