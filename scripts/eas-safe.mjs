import { verifyOwnerRelease } from './owner-release-guard.mjs';
import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync, openSync, closeSync, existsSync, lstatSync, chmodSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { prepareEas, easArguments, expoAccountName } from './eas-environment.mjs';
const root = fileURLToPath(new URL('../', import.meta.url));
try {
  if (process.argv.length !== 3) throw new Error('eas_operation_rejected');
  const operation = process.argv[2], args = easArguments(operation);
  const { env, directory } = prepareEas(root, process.env, operation !== 'version');
  const log = path.join(directory, 'eas-publish.log');
  if (existsSync(log) && lstatSync(log).isSymbolicLink()) throw new Error('eas_private_path_rejected');
  if (['init', 'publish'].includes(operation)) {
    const config = JSON.parse(readFileSync(path.join(root, 'app.json'), 'utf8')).expo;
    if (operation === 'publish' && config.scheme !== 'orbe') throw new Error('eas_router_scheme_required');
    if (['app.config.js','app.config.ts','app.config.mjs','app.config.cjs'].some(name => existsSync(path.join(root,name))) || config.updates?.codeSigningCertificate || config.updates?.codeSigningMetadata) throw new Error('eas_signing_configuration_rejected');
    if (config.extra?.liveIntegrationEnabled === true) verifyOwnerRelease(root, directory, config);
    if (config.slug !== 'orbe-finance' || ![false,true].includes(config.extra?.liveIntegrationEnabled) || config.runtimeVersion?.policy !== 'sdkVersion' || config.sdkVersion !== '58.0.0') throw new Error('eas_project_configuration_invalid');
    if (operation === 'init' && config.extra?.eas?.projectId) throw new Error('eas_project_already_linked');
    if (operation === 'publish') {
      const updatesPackage = path.join(root, 'node_modules/expo-updates/package.json');
      if (!existsSync(updatesPackage) || JSON.parse(readFileSync(updatesPackage,'utf8')).version !== '58.0.18') throw new Error('eas_updates_dependency_required');
      if (!/^[0-9a-f-]{36}$/.test(config.extra?.eas?.projectId ?? '')) throw new Error('eas_project_link_required');
      const linked = JSON.parse(readFileSync(path.join(directory, 'eas-init-receipt.json'), 'utf8'));
      if (linked.projectId !== config.extra.eas.projectId || linked.slug !== config.slug || config.updates?.url !== 'https://u.expo.dev/' + linked.projectId) throw new Error('eas_project_receipt_mismatch');
      if (!existsSync(path.join(root, 'dist/metadata.json'))) throw new Error('eas_export_required');
      // Scan every artifact before introducing credentials into the publisher.
      const { readdirSync } = await import('node:fs');
      const admin = readFileSync(path.join(directory, 'backend.env'), 'utf8');
      const markers = [env.EXPO_TOKEN, ...admin.split(/\r?\n/).filter(line => /^(SUPABASE_ACCESS_TOKEN|ORBE_OWNER_USER_ID)=/.test(line)).map(line => line.slice(line.indexOf('=') + 1).trim().replace(/^["']|["']$/g, ''))].filter(Boolean);
      const scan = folder => { for (const entry of readdirSync(folder, { withFileTypes: true })) { const target = path.join(folder, entry.name); if (entry.isSymbolicLink()) throw new Error('eas_artifact_symlink_rejected'); if (entry.isDirectory()) scan(target); else if (entry.isFile()) { const bytes = readFileSync(target); if (markers.some(marker => bytes.includes(Buffer.from(marker)))) throw new Error('eas_artifact_private_content_rejected'); } } };
      scan(path.join(root, 'dist'));
      // Reuse the backend's secure profile parser; no credentials are passed to this process.
      const { env: scanEnv } = prepareEas(root, process.env, false);
      const preflight = spawnSync('python3', [path.join(root, 'scripts/publish-preflight.py')], {
        cwd: root, env: { ...scanEnv, PYTHONDONTWRITEBYTECODE: '1' },
        timeout: 60000, maxBuffer: 16384, stdio: ['ignore', 'pipe', 'pipe'],
      });
      if (preflight.status !== 0 || preflight.error) throw new Error('eas_private_preflight_failed');
    }
  }
  const descriptor = openSync(log, 'w', 0o600); chmodSync(log, 0o600);
  let result;
  try {
    if (operation === 'init') {
      const identity = spawnSync('npm', ['exec','--ignore-scripts','--offline','--yes','--package=eas-cli@25.2.0','--','eas','whoami'], { cwd:root, env, encoding:'utf8', timeout:60000, stdio:['ignore','pipe',descriptor] });
      const account = expoAccountName(identity.stdout);
      if (identity.status !== 0) throw new Error('eas_account_selection_required');
      args.push('--account', account);
    }
    result = spawnSync('npm', ['exec', '--ignore-scripts', ...(operation === 'version' ? [] : ['--offline']), '--yes', '--package=eas-cli@25.2.0', '--', 'eas', ...args], { cwd: root, env, encoding: 'utf8', timeout: 240000, maxBuffer: 8 * 1024 * 1024, stdio: ['ignore', 'pipe', descriptor] });
  } finally { closeSync(descriptor); }
  if (result.status !== 0 || result.error) throw new Error('eas_command_failed_see_private_log');
  if (operation === 'version') console.log('eas_cli_cached: 25.2.0');
  else if (operation === 'account') console.log('expo_account_authenticated: true');
  else {
    const receipt = JSON.parse(result.stdout);
    if (operation === 'init') {
      const configFile = path.join(root, 'app.json');
      const config = JSON.parse(readFileSync(configFile, 'utf8'));
      if (receipt.slug !== 'orbe-finance' || receipt.projectId !== config.expo.extra?.eas?.projectId || !/^[0-9a-f-]{36}$/.test(receipt.projectId ?? '')) throw new Error('eas_project_association_invalid');
      config.expo.updates = { url: 'https://u.expo.dev/' + receipt.projectId };
      writeFileSync(configFile, JSON.stringify(config,null,2)+'\n');
    }
    const receiptFile = path.join(directory, `eas-${operation}-receipt.json`);
    if (existsSync(receiptFile) && lstatSync(receiptFile).isSymbolicLink()) throw new Error('eas_private_path_rejected');
    writeFileSync(receiptFile, JSON.stringify(receipt, null, 2) + '\n', { mode: 0o600 });
    console.log(JSON.stringify({ operation, completed: true, receipt_outside_metro: true }));
  }
} catch (error) {
  const code = error instanceof Error && /^[a-z_]+$/.test(error.message) ? error.message : 'eas_operation_failed';
  console.error(`Orbe: ${code}`); process.exitCode = 1;
}
