import { readFileSync, lstatSync, existsSync, chmodSync } from 'node:fs';
import path from 'node:path';
import { homedir } from 'node:os';
import { buildExpoEnvironment, ensurePrivateProfile, parseValues } from './expo-environment.mjs';
export function prepareEas(root, parent, authenticated, home = homedir()) {
  const env = buildExpoEnvironment(root, parent, 'production', home);
  delete env.EXPO_OFFLINE;
  for (const key of Object.keys(env)) if (key.startsWith('EXPO_PUBLIC_')) delete env[key];
  const directory = path.join(home, '.config/orbe-finance');
  ensurePrivateProfile(directory, root);
  env.XDG_CONFIG_HOME = path.join(directory, 'eas-config');
  env.XDG_CACHE_HOME = path.join(directory, 'eas-cache');
  env.XDG_DATA_HOME = path.join(directory, 'eas-data');
  env.EAS_NO_TELEMETRY = '1';
  env.npm_config_ignore_scripts = 'true';
  if (authenticated) {
    const file = path.join(directory, 'expo-publish.env');
    let current = file;
    while (true) {
      if ((current === file || existsSync(current)) && lstatSync(current).isSymbolicLink()) throw new Error('eas_private_path_rejected');
      const next = path.dirname(current); if (next === current) break; current = next;
    }
    const stat = lstatSync(file);
    if (!stat.isFile() || stat.size > 16384) throw new Error('eas_private_file_rejected');
    chmodSync(file, 0o600);
    const values = parseValues(readFileSync(file, 'utf8'));
    if (Object.keys(values).length !== 1 || !/^[!-~]{16,4096}$/.test(values.EXPO_TOKEN ?? '')) throw new Error('eas_private_token_required');
    env.EXPO_TOKEN = values.EXPO_TOKEN;
  }
  return { env, directory };
}
export function easArguments(operation) {
  if (operation === 'version') return ['--version'];
  if (operation === 'account') return ['whoami'];
  if (operation === 'init') return ['project:init', '--non-interactive', '--force', '--json', '--no-icon'];
  if (operation === 'publish') return ['update', '--branch', 'preview', '--environment', 'preview', '--platform', 'ios', '--input-dir', 'dist', '--skip-bundler', '--message', 'feat: disponibilizar prévia do Orbe no Expo Go', '--json', '--non-interactive'];
  throw new Error('eas_operation_rejected');
}

export function expoAccountName(output) {
  if (typeof output !== 'string') throw new Error('eas_account_selection_required');
  const first = output.replace(/\x1b\[[0-9;]*m/g, '').trim().split(/\r?\n/)[0];
  const match = /^([A-Za-z0-9][A-Za-z0-9_-]{0,63}) \(authenticated using EXPO_TOKEN\)$/.exec(first);
  if (!match) throw new Error('eas_account_selection_required');
  return match[1];
}
