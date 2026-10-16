import test from 'node:test';
import assert from 'node:assert/strict';
import { validateAudit } from '../../scripts/audit-policy.mjs';
const url = 'https://github.com/advisories/GHSA-vfj7-8cjw-p6xm';
const now = Date.parse('2026-10-16T12:00:00Z');
const audit = vulnerabilities => ({ metadata: { vulnerabilities: { critical: 0 } }, vulnerabilities });
test('clean audit does not require an exception', () => {
  assert.deepEqual(validateAudit(audit({}), Infinity), { packages: 0, advisories: 0 });
});
test('known transitive graph reports actual affected packages', () => {
  assert.deepEqual(validateAudit(audit({ braces: { via: [{ url }] }, metro: { via: ['braces'] } }), now), { packages: 2, advisories: 1 });
});
test('new advisory is never covered by package-name exception', () => {
  assert.throws(() => validateAudit(audit({ braces: { via: [{ url: 'https://example.invalid/new' }] } }), now), /unreviewed/);
});
test('expired exceptions fail', () => {
  assert.throws(() => validateAudit(audit({ braces: { via: [{ url }] } }), Date.parse('2026-10-24T00:00:00Z')), /expired/);
});
test('unavailable audit cannot become clean result', () => {
  assert.throws(() => validateAudit({ error: 'network' }, now), /unavailable/);
});
test('unresolved graph references fail closed', () => {
  assert.throws(() => validateAudit(audit({ metro: { via: ['missing'] } }), now), /invalid_advisory_graph/);
});
test('cycle fails instead of inheriting unrelated approval', () => {
  assert.throws(() => validateAudit(audit({ a: { via: ['b'] }, b: { via: ['a'] } }), now), /invalid_advisory_graph/);
});
test('critical advisories cannot use synthetic exceptions', () => {
  const value = audit({ braces: { via: [{ url }] } }); value.metadata.vulnerabilities.critical = 1;
  assert.throws(() => validateAudit(value, now), /critical/);
});

test('npm peer cycle is allowed only when connected to reviewed root', () => {
  assert.deepEqual(validateAudit(audit({ a: { via: ['b'] }, b: { via: ['a', { url }] } }), now), { packages: 2, advisories: 1 });
});
