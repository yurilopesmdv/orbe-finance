import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, mkdirSync, symlinkSync, statSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { buildExpoEnvironment, ensurePrivateProfile, expoArguments, parseValues } from '../../scripts/expo-environment.mjs';
const fixture = run => {
  const folder = mkdtempSync(join(tmpdir(), 'orbe-expo-env-'));
  const root = join(folder, 'project'); const home = join(folder, 'home'); mkdirSync(root); mkdirSync(home);
  try { return run(root, home); } finally { rmSync(folder, { recursive: true, force: true }); }
};
const parent = { PATH: process.env.PATH, HOME: '/invented/home', EXPO_TOKEN: 'invented-expo-token', SUPABASE_ACCESS_TOKEN: 'invented-admin', AWS_SECRET_ACCESS_KEY: 'invented-aws', NODE_OPTIONS: '--require=/invented/unsafe', HTTPS_PROXY: 'https://invented.invalid', EXPO_PUBLIC_UNKNOWN: 'invented-extra' };

test('child environment only preserves selected OS values and fixed safety controls', () => fixture((root, home) => {
  const env = buildExpoEnvironment(root, parent, 'development', home);
  assert.equal(env.HOME, parent.HOME); assert.equal(env.PATH, parent.PATH);
  for (const key of Object.keys(parent).filter(key => !['HOME', 'PATH'].includes(key))) assert.equal(env[key], undefined, key);
  assert.equal(env.EXPO_NO_DOTENV, '1'); assert.equal(env.EXPO_OFFLINE, '1'); assert.equal(env.EXPO_NO_TELEMETRY, '1');
  const child = JSON.parse(execFileSync(process.execPath, ['-e', 'process.stdout.write(JSON.stringify(process.env))'], { env, encoding: 'utf8' }));
  assert.equal(child.SUPABASE_ACCESS_TOKEN, undefined); assert.equal(child.EXPO_TOKEN, undefined); assert.equal(child.NODE_OPTIONS, undefined);
}));

test('dotenv precedence is explicit and environment mode is isolated', () => fixture((root, home) => {
  writeFileSync(join(root, '.env'), 'EXPO_PUBLIC_AUTH_RECOVERY_ENABLED=true\n');
  writeFileSync(join(root, '.env.local'), 'EXPO_PUBLIC_AUTH_RECOVERY_ENABLED=false\n');
  writeFileSync(join(root, '.env.production.local'), 'EXPO_PUBLIC_AUTH_RECOVERY_ENABLED=true\n');
  assert.equal(buildExpoEnvironment(root, {}, 'development', home).EXPO_PUBLIC_AUTH_RECOVERY_ENABLED, 'false');
  assert.equal(buildExpoEnvironment(root, {}, 'production', home).EXPO_PUBLIC_AUTH_RECOVERY_ENABLED, 'true');
}));

test('administrative pointer is accepted without loading its target', () => fixture((root, home) => {
  writeFileSync(join(root, '.env.backend.local'), `ORBE_BACKEND_ENV_FILE=${join(home, '.config/orbe-finance/backend.env')}\n`);
  const env = buildExpoEnvironment(root, {}, 'development', home);
  assert.equal(env.ORBE_BACKEND_ENV_FILE, undefined); assert.equal(env.SUPABASE_ACCESS_TOKEN, undefined);
}));

test('inline administrative credentials and arbitrary pointers block execution', () => fixture((root, home) => {
  for (const value of ['SUPABASE_ACCESS_TOKEN=invented\n', 'ORBE_BACKEND_ENV_FILE=/tmp/other.env\n', `ORBE_BACKEND_ENV_FILE=${join(home, '.config/orbe-finance/backend.env')}\nSUPABASE_PROJECT_REF=invented`]) {
    writeFileSync(join(root, '.env.backend.local'), value);
    assert.throws(() => buildExpoEnvironment(root, {}, 'development', home), /administrative_dotenv_rejected/);
  }
}));

test('unknown variables and dotenv symlinks are rejected without exposing content', () => fixture((root, home) => {
  const file = join(root, '.env.local'); writeFileSync(file, 'EXPO_TOKEN=invented-secret\n');
  assert.throws(() => buildExpoEnvironment(root, {}, 'development', home), { message: 'non_public_dotenv_rejected' });
  rmSync(file); const other = join(home, 'config'); writeFileSync(other, ''); symlinkSync(other, file);
  assert.throws(() => buildExpoEnvironment(root, {}, 'development', home), /dotenv_file_rejected/);
}));

test('malformed duplicates and variable expansion are rejected', () => {
  for (const content of ['EXPO_PUBLIC_AUTH_RECOVERY_ENABLED=true\nEXPO_PUBLIC_AUTH_RECOVERY_ENABLED=false', 'export SECRET=invented', 'KEY="unterminated', 'KEY=${SECRET}', 'KEY=`command`']) assert.throws(() => parseValues(content));
  assert.deepEqual(parseValues('# comment\nKEY="value"\n'), { KEY: 'value' });
});

test('private tokens cannot enter publishable configuration', () => fixture((root, home) => {
  writeFileSync(join(root, '.env.local'), 'EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sbp_invented\n');
  assert.throws(() => buildExpoEnvironment(root, {}, 'development', home), /public_key_invalid/);
}));

test('profile stays outside project with restricted permissions and no symlink', () => fixture((root, home) => {
  const profile = join(home, '.config/orbe-finance/expo-cli'); ensurePrivateProfile(profile, root);
  assert.equal(statSync(profile).mode & 0o777, 0o700);
  assert.throws(() => ensurePrivateProfile(join(root, 'profile'), root), /expo_profile_inside_project/);
  const link = join(home, 'link'); symlinkSync(profile, link);
  assert.throws(() => ensurePrivateProfile(link, root), /expo_profile_symlink_rejected/);
}));

test('only supported local arguments are accepted; no tunnel or publish', () => {
  assert.deepEqual(expoArguments(['start']), ['start', '--lan']);
  assert.deepEqual(expoArguments(['start', '--localhost', '--port', '8083', '--clear']), ['start', '--localhost', '--port', '8083', '--clear']);
  assert.deepEqual(expoArguments(['export']), ['export', '--platform', 'ios']);
  for (const args of [['start', '--tunnel'], ['start', '--port', '80'], ['start', '--port', '65536'], ['start', '--lan', '--localhost'], ['publish'], ['export', '--platform', 'web']]) assert.throws(() => expoArguments(args));
});

test('installed Expo CLI honors isolated profile and disables automatic dotenv/network', async () => fixture((root, home) => {
  const env = buildExpoEnvironment(root, parent, 'development', home);
  const cliRoot = join(process.cwd(), 'node_modules/@expo/cli/build/src');
  const script = `const user = require(${JSON.stringify(join(cliRoot, 'api/user/UserSettings.js'))}); const { env } = require(${JSON.stringify(join(cliRoot, 'utils/env.js'))}); const dotenv = require(${JSON.stringify(join(process.cwd(), 'node_modules/@expo/env/build/index.js'))}); process.stdout.write(JSON.stringify({profile:user.getExpoHomeDirectory(),offline:env.EXPO_OFFLINE,telemetryOff:env.EXPO_NO_TELEMETRY,dotenvEnabled:dotenv.isEnabled()}));`;
  const observed = JSON.parse(execFileSync(process.execPath, ['-e', script], { env, encoding: 'utf8' }));
  assert.deepEqual(observed, { profile: join(home, '.config/orbe-finance/expo-cli'), offline: true, telemetryOff: true, dotenvEnabled: false });
}));

test('audit export has a fixed private destination and cannot accept arbitrary flags',()=>{
  const args=expoArguments(['export-audit']);assert.deepEqual(args.slice(0,7),['export','--platform','ios','--no-bytecode','--source-maps','external','--output-dir']);
  assert.ok(args[7].endsWith('/.config/orbe-finance/runtime-audit'));
  assert.throws(()=>expoArguments(['export-audit','--output-dir','dist']));
});
