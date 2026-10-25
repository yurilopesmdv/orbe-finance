import { readFileSync, existsSync } from 'node:fs';
import { homedir } from 'node:os';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { validateOwnerToolingAudit } from './owner-tooling-audit.mjs';
import { execFileSync } from 'node:child_process';
import { validateAudit } from './audit-policy.mjs';
let output;
try { output = execFileSync('npm', ['audit', '--json'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: 8 * 1024 * 1024 }); }
catch (error) {
  if (!error.stdout) throw new Error('audit_unavailable');
  output = error.stdout.toString();
}
let audit;
try { audit = JSON.parse(output); } catch { throw new Error('invalid_audit_response'); }
const config = JSON.parse(readFileSync(new URL('../app.json',import.meta.url),'utf8')).expo;
if (config.extra?.liveIntegrationEnabled === true) {
  const reportFile = path.join(homedir(),'.config/orbe-finance/runtime-audit/report.json');
  if (!existsSync(reportFile)) throw Error('owner_tooling_runtime_unverified');
  const lockBytes = readFileSync(new URL('../package-lock.json',import.meta.url));
  const result = validateOwnerToolingAudit(audit,{config,lock:JSON.parse(lockBytes),lockSha256:createHash('sha256').update(lockBytes).digest('hex'),runtimeReport:JSON.parse(readFileSync(reportFile,'utf8'))});
  console.log(`Audit: ${result.packages} tooling packages / ${result.advisories} unpatched advisory; scoped OWNER-RELEASE mitigation verified, runtime graph bound to current lockfile.`);
} else {
  const result = validateAudit(audit);
  console.log(result.packages ? `Audit: ${result.packages} affected packages; synthetic exception applies only before its existing expiry.` : 'Audit: no reported vulnerabilities.');
}
