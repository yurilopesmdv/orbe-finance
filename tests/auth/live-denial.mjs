// Opt-in development smoke. Invoked only with invented credentials over stdin.
import { readFileSync } from 'node:fs';
import { createAuthGateway, AuthFailure } from '../../src/features/auth/gateway.ts';
const input = JSON.parse(readFileSync(0, 'utf8'));
let token;
const headers = { apikey: input.publishableKey, 'Content-Type': 'application/json' };
try {
  const response = await fetch(input.origin + '/auth/v1/token?grant_type=password', { method: 'POST', headers, body: JSON.stringify({ email: input.email, password: input.password }), redirect: 'error', signal: AbortSignal.timeout(20000) });
  if (!response.ok) throw new Error('synthetic_login_failed');
  const session = await response.json(); token = session.access_token;
  if (typeof token !== 'string' || !token) throw new Error('synthetic_token_missing');
  const authorized = await fetch(input.origin + '/rest/v1/rpc/orbe_is_owner', { method: 'POST', headers: { ...headers, Authorization: 'Bearer ' + token }, body: '{}', redirect: 'error', signal: AbortSignal.timeout(20000) });
  if (!authorized.ok || await authorized.json() !== false) throw new Error('non_owner_authorization_failed');
  const gateway = createAuthGateway({ origin: input.origin, publishableKey: input.publishableKey });
  let denied = false;
  try { await gateway.signIn(input.email, input.password); }
  catch (error) { denied = error instanceof AuthFailure && error.code === 'invalid_credentials'; }
  if (!denied) throw new Error('gateway_non_owner_allowed');
  const anonymous = await fetch(input.origin + '/rest/v1/rpc/orbe_is_owner', { method: 'POST', headers, body: '{}', redirect: 'error', signal: AbortSignal.timeout(20000) });
  if (![401, 403].includes(anonymous.status)) throw new Error('anonymous_authorization_failed');
  process.stdout.write('live_non_owner_and_anonymous_denied=true\n');
} catch {
  process.stderr.write('live_auth_denial_check_failed\n'); process.exitCode = 1;
} finally {
  if (token) {
    try { await fetch(input.origin + '/auth/v1/logout?scope=local', { method: 'POST', headers: { ...headers, Authorization: 'Bearer ' + token }, redirect: 'error', signal: AbortSignal.timeout(20000) }); } catch { /* Parent deletes this synthetic identity regardless. */ }
  }
}
