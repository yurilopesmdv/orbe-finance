const expires = Date.parse('2026-10-24T00:00:00Z');
const allowed = new Set([
  'https://github.com/advisories/GHSA-vfj7-8cjw-p6xm',
  'https://github.com/advisories/GHSA-86w9-cpqp-85rv',
]);
export function inspectAuditGraph(audit, allowedRoots) {
  if (audit?.error || !audit?.metadata?.vulnerabilities || !audit.vulnerabilities) throw new Error('audit_unavailable');
  if (audit.metadata.vulnerabilities.critical > 0) throw new Error('critical_advisory');
  const entries = Object.entries(audit.vulnerabilities), reachable = new Map(), roots = new Set();
  for (const [name, vulnerability] of entries) {
    if (!Array.isArray(vulnerability.via) || !vulnerability.via.length) throw new Error('invalid_advisory_graph');
    const direct = new Set();
    for (const via of vulnerability.via) {
      if (typeof via === 'string') {
        if (!audit.vulnerabilities[via]) throw new Error('invalid_advisory_graph');
      } else {
        if (!allowedRoots.has(via?.url)) throw new Error(`unreviewed_advisory:${name}`);
        direct.add(via.url); roots.add(via.url);
      }
    }
    reachable.set(name, direct);
  }
  // npm metavulnerability graphs can contain peer cycles. Every package must
  // still reach an explicitly reviewed root; a rootless cycle fails closed.
  let changed = true;
  while (changed) {
    changed = false;
    for (const [name, vulnerability] of entries) {
      const target = reachable.get(name);
      for (const via of vulnerability.via) {
        if (typeof via !== 'string') continue;
        for (const url of reachable.get(via)) {
          if (!target.has(url)) { target.add(url); changed = true; }
        }
      }
    }
  }
  if ([...reachable.values()].some(urls => !urls.size)) throw new Error('invalid_advisory_graph');
  return { packages: entries.length, advisories: roots.size };
}

export function validateAudit(audit, now = Date.now()) {
  const result = inspectAuditGraph(audit, allowed);
  if (result.packages && now >= expires) throw new Error('synthetic_audit_exceptions_expired');
  return result;
}
