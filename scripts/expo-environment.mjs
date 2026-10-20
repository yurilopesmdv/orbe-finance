import { readdirSync, lstatSync, readFileSync, mkdirSync, chmodSync, existsSync } from 'node:fs';
import { homedir } from 'node:os';
import path from 'node:path';

const publicKeys = new Set(['EXPO_PUBLIC_SUPABASE_URL', 'EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY', 'EXPO_PUBLIC_AUTH_RECOVERY_ENABLED']);
const systemKeys = ['PATH', 'HOME', 'USER', 'LOGNAME', 'SHELL', 'LANG', 'LC_ALL', 'LC_CTYPE', 'TERM', 'COLORTERM', 'TMPDIR', 'TMP', 'TEMP', 'SYSTEMROOT', 'WINDIR', 'CI', 'TZ', 'NO_COLOR', 'FORCE_COLOR'];

export function parseValues(content) {
  const values = {};
  for (const raw of content.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const match = /^([A-Z][A-Z0-9_]*)=(.*)$/.exec(line);
    if (!match || Object.hasOwn(values, match[1])) throw new Error('dotenv_invalid_or_duplicate');
    const key = match[1]; let value = match[2].trim();
    if (/^["']/.test(value)) {
      const quote = value[0];
      if (value.length < 2 || value.at(-1) !== quote) throw new Error('dotenv_invalid_value');
      value = value.slice(1, -1);
    }
    if (/[\r\n\0$`"']/.test(value)) throw new Error('dotenv_invalid_value');
    values[key] = value;
  }
  return values;
}

export function buildExpoEnvironment(root, parent, mode, home = homedir()) {
  if (!['development', 'production'].includes(mode)) throw new Error('expo_mode_invalid');
  const files = new Map();
  for (const name of readdirSync(root).filter(name => name === '.env' || name.startsWith('.env.'))) {
    const file = path.join(root, name); const stat = lstatSync(file);
    if (!stat.isFile() || stat.isSymbolicLink() || stat.size > 16384) throw new Error('dotenv_file_rejected');
    const values = parseValues(readFileSync(file, 'utf8'));
    if (name === '.env.backend.local') {
      if (Object.keys(values).length !== 1 || values.ORBE_BACKEND_ENV_FILE !== path.join(home, '.config/orbe-finance/backend.env')) throw new Error('administrative_dotenv_rejected');
    } else if (Object.keys(values).some(key => !publicKeys.has(key))) throw new Error('non_public_dotenv_rejected');
    else files.set(name, values);
  }
  const env = Object.fromEntries(systemKeys.filter(key => typeof parent[key] === 'string').map(key => [key, parent[key]]));
  for (const name of ['.env', `.env.${mode}`, '.env.local', `.env.${mode}.local`]) Object.assign(env, files.get(name));
  if (env.EXPO_PUBLIC_SUPABASE_URL && !/^https:\/\/[a-z]{20}\.supabase\.co$/.test(env.EXPO_PUBLIC_SUPABASE_URL)) throw new Error('public_project_invalid');
  if (env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY && !/^sb_publishable_[A-Za-z0-9_-]+$/.test(env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY)) throw new Error('public_key_invalid');
  if (env.EXPO_PUBLIC_AUTH_RECOVERY_ENABLED && !['false', 'true'].includes(env.EXPO_PUBLIC_AUTH_RECOVERY_ENABLED)) throw new Error('public_recovery_flag_invalid');
  return {
    ...env, NODE_ENV: mode, EXPO_NO_DOTENV: '1', EXPO_OFFLINE: '1', EXPO_NO_TELEMETRY: '1',
    __UNSAFE_EXPO_HOME_DIRECTORY: path.join(home, '.config/orbe-finance/expo-cli'),
  };
}

export function ensurePrivateProfile(profile, root) {
  if (!path.isAbsolute(profile) || profile === root || profile.startsWith(root + path.sep)) throw new Error('expo_profile_inside_project');
  let current = profile;
  while (true) {
    if (existsSync(current) && lstatSync(current).isSymbolicLink()) throw new Error('expo_profile_symlink_rejected');
    const parent = path.dirname(current); if (parent === current) break; current = parent;
  }
  mkdirSync(profile, { recursive: true, mode: 0o700 }); chmodSync(profile, 0o700);
}

export function expoArguments(args) {
  if (args[0] === 'export-audit' && args.length === 1) return ['export', '--platform', 'ios', '--no-bytecode', '--source-maps', 'external', '--output-dir', path.join(homedir(), '.config/orbe-finance/runtime-audit')];
  if (args[0] === 'export' && args.length === 1) return ['export', '--platform', 'ios'];
  if (args[0] !== 'start') throw new Error('expo_command_rejected');
  let host = '--lan'; let hostSet = false; const rest = [];
  for (let i = 1; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--lan' || arg === '--localhost') {
      if (hostSet) throw new Error('expo_host_duplicate'); hostSet = true; host = arg;
    } else if (arg === '--clear' && !rest.includes('--clear')) rest.push(arg);
    else if (arg === '--port' && !rest.includes('--port')) {
      const port = args[++i];
      if (!port || !/^\d{4,5}$/.test(port) || Number(port) < 1024 || Number(port) > 65535) throw new Error('expo_port_invalid');
      rest.push('--port', port);
    } else throw new Error('expo_argument_rejected');
  }
  return ['start', host, ...rest];
}
