import { execFileSync, spawnSync } from 'node:child_process';
import { readFileSync, existsSync, openSync, closeSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('../', import.meta.url));
const config = readFileSync(new URL('../supabase/config.toml', import.meta.url), 'utf8');
if (!/^project_id = "orbe-finance"$/m.test(config) || existsSync(new URL('../supabase/.temp/project-ref', import.meta.url))) throw new Error('local_orbe_project_required');
const operation = process.argv[2];
if (!['start', 'stop', 'status'].includes(operation)) throw new Error('unsupported_local_operation');
const network = 'orbe-finance-local';
if (operation === 'start') {
  let found;
  try { found = JSON.parse(execFileSync('docker', ['network', 'inspect', network], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }))[0]; }
  catch { execFileSync('docker', ['network', 'create', '--driver', 'bridge', '--opt', 'com.docker.network.bridge.host_binding_ipv4=127.0.0.1', network], { stdio: 'ignore' }); }
  if (found && found.Options?.['com.docker.network.bridge.host_binding_ipv4'] !== '127.0.0.1') throw new Error('refusing_to_change_existing_network');
}
const log = new URL(`../.supabase-local-${operation}.log`, import.meta.url);
const fd = openSync(log, 'w', 0o600);
const args = ['exec', '--yes', '--package=supabase@2.121.0', '--', 'supabase', operation, '--workdir', root];
if (operation === 'start') args.push('--network-id', network, '--exclude', 'realtime,storage-api,imgproxy,postgres-meta,studio,edge-runtime,logflare,vector,supavisor');
const result = spawnSync('npm', args, { cwd: root, env: { ...process.env, DO_NOT_TRACK: '1' }, stdio: ['ignore', fd, fd] });
closeSync(fd);
if (result.status !== 0) {
  console.error(`Local backend ${operation} failed. Inspect the private .supabase-local-${operation}.log locally; do not share credentials.`);
  process.exit(1);
}
if (operation === 'start') {
  const ids = execFileSync('docker', ['ps', '-q', '--filter', 'name=orbe-finance'], { encoding: 'utf8' }).trim().split(/\s+/).filter(Boolean);
  if (!ids.length) throw new Error('local_containers_missing');
  const containers = JSON.parse(execFileSync('docker', ['inspect', ...ids], { encoding: 'utf8' }));
  for (const container of containers) {
    if (!container.Name.endsWith('_orbe-finance')) continue;
    for (const ports of Object.values(container.NetworkSettings.Ports ?? {})) {
      if (ports?.some(binding => !['127.0.0.1', '::1'].includes(binding.HostIp))) {
        console.error('Unexpected port bindings:', JSON.stringify({ name: container.Name, network: container.HostConfig.NetworkMode, ports }));
        spawnSync('npm', ['exec', '--yes', '--package=supabase@2.121.0', '--', 'supabase', 'stop', '--workdir', root], { cwd: root, stdio: 'ignore' });
        throw new Error('non_loopback_binding_detected_orbe_stopped');
      }
    }
  }
}
console.log(`Orbe local backend ${operation}: OK. No keys printed. Development is synthetic only.`);
