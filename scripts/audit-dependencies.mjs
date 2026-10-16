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
const result = validateAudit(audit);
console.log(result.packages ? `Audit: ${result.packages} affected packages from ${result.advisories} documented unpatched advisories; synthetic only, exception expires 2026-10-23.` : 'Audit: no reported vulnerabilities.');
