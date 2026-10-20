import { readFileSync, readdirSync, lstatSync, writeFileSync, chmodSync } from 'node:fs';
import { homedir } from 'node:os';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { inspectRuntimeMap } from './runtime-audit-policy.mjs';
const root = fileURLToPath(new URL('../', import.meta.url));
const directory = path.join(homedir(), '.config/orbe-finance/runtime-audit');
try {
  if (process.argv.length !== 2) throw Error('runtime_arguments_rejected');
  const files = [];
  function scan(folder) {
    if (lstatSync(folder).isSymbolicLink()) throw Error('runtime_symlink_rejected');
    for (const entry of readdirSync(folder, { withFileTypes: true })) {
      const file = path.join(folder, entry.name);
      if (entry.isSymbolicLink()) throw Error('runtime_symlink_rejected');
      if (entry.isDirectory()) scan(file);
      else if (entry.isFile()) files.push(file);
    }
  }
  scan(directory);
  const maps = files.filter(file => /\.js\.map$/.test(file)), bundles = files.filter(file => /\.js$/.test(file));
  if (maps.length !== 1 || bundles.length !== 1 || maps[0] !== bundles[0] + '.map') throw Error('runtime_export_ambiguous');
  if (lstatSync(maps[0]).size > 64 * 1024 * 1024 || lstatSync(bundles[0]).size > 8 * 1024 * 1024) throw Error('runtime_export_too_large');
  const mapBytes = readFileSync(maps[0]), bundleBytes = readFileSync(bundles[0]);
  const report = inspectRuntimeMap(JSON.parse(mapBytes.toString('utf8')), JSON.parse(readFileSync(path.join(root, 'package-lock.json'), 'utf8')));
  const summary = { ...report, bundleSha256: createHash('sha256').update(bundleBytes).digest('hex'), mapSha256: createHash('sha256').update(mapBytes).digest('hex'),
    scope: 'JavaScript production iOS audit export only; native Expo Go, EAS and toolchain not certified' };
  const target = path.join(directory, 'report.json');
  writeFileSync(target, JSON.stringify(summary, null, 2) + '\n', { mode: 0o600 }); chmodSync(target, 0o600);
  console.log(JSON.stringify({ runtimeAuditPassed: true, sourceCount: report.sourceCount, packageCount: report.packageCount, advisoryRootsAbsent: true, sourceMapsPrivate: true }));
} catch (error) {
  const code = error instanceof Error && /^runtime_[a-z_]+$/.test(error.message) ? error.message : 'runtime_audit_failed';
  console.error('Orbe: ' + code); process.exitCode = 1;
}
