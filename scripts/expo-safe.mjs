import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { buildExpoEnvironment, ensurePrivateProfile, expoArguments } from './expo-environment.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
try {
  const args = expoArguments(process.argv.slice(2));
  const env = buildExpoEnvironment(root, process.env, args[0] === 'export' ? 'production' : 'development');
  ensurePrivateProfile(env.__UNSAFE_EXPO_HOME_DIRECTORY, path.resolve(root));
  const require = createRequire(import.meta.url);
  const cli = path.join(path.dirname(require.resolve('expo/package.json')), 'bin/cli');
  const child = spawn(process.execPath, [cli, ...args], { cwd: root, env, stdio: 'inherit' });
  const handlers = new Map();
  for (const signal of ['SIGINT', 'SIGTERM']) {
    const handler = () => child.kill(signal); handlers.set(signal, handler); process.on(signal, handler);
  }
  child.on('error', () => { console.error('Orbe: não foi possível iniciar o Expo.'); process.exitCode = 1; });
  child.on('exit', (code, signal) => {
    for (const [name, handler] of handlers) process.off(name, handler);
    process.exitCode = code ?? (signal === 'SIGINT' ? 130 : 1);
  });
} catch (error) {
  // Only local enumerated codes; never echo env values, file contents or raw errors.
  const code = error instanceof Error && /^[a-z_]+$/.test(error.message) ? error.message : 'expo_preflight_failed';
  console.error(`Orbe: execução bloqueada (${code}). Consulte docs/security/DEVELOPMENT-SECRETS.md.`);
  process.exitCode = 1;
}
