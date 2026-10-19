import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SessionModel } from '../../src/features/auth/session.ts';
import { AuthFailure } from '../../src/features/auth/gateway.ts';
const deferred = () => { let resolve; const promise = new Promise(r => { resolve = r; }); return { promise, resolve }; };
function fixture(overrides = {}) {
  let time = 1000, expiry;
  const discarded = [];
  const port = { signIn: async () => ({ accessToken: 'invented', expiresAt: 2000 }), signOut: async s => { discarded.push(s.accessToken); }, requestRecovery: async () => {}, resetPassword: async () => {}, ...overrides };
  const session = new SessionModel(port, () => time, callback => { expiry = callback; return () => { expiry = undefined; }; });
  return { session, discarded, setTime: value => { time = value; }, expire: () => expiry?.() };
}
test('starts locked with no credential in observable snapshot', () => { const { session } = fixture(); assert.deepEqual(session.getSnapshot(), { state: 'locked', error: null }); });
test('verified gateway login unlocks without exposing token', async () => { const { session } = fixture(); assert.equal(await session.login('invented', 'invented'), true); assert.deepEqual(session.getSnapshot(), { state: 'unlocked', error: null }); });
test('snapshot identity is stable until state changes', () => { const { session } = fixture(); assert.equal(session.getSnapshot(), session.getSnapshot()); assert.equal(Object.isFrozen(session.getSnapshot()), true); });
test('state subscribers can unsubscribe', () => { const { session } = fixture(); let events = 0; const stop = session.subscribe(() => events++); session.lock(); stop(); session.lock(); assert.equal(events, 1); });
test('invalid credential error is sanitized and keeps locked', async () => { const { session } = fixture({ signIn: async () => { throw new AuthFailure('invalid_credentials'); } }); assert.equal(await session.login('', ''), false); assert.equal(session.getSnapshot().error, 'invalid_credentials'); });
test('unexpected provider exception never reaches UI', async () => { const { session } = fixture({ signIn: async () => { throw new Error('private content'); } }); await session.login('', ''); assert.equal(session.getSnapshot().error, 'unavailable'); });
test('background during login cancels and rejects late credentials', async () => { const pending = deferred(); const { session, discarded } = fixture({ signIn: () => pending.promise }); const login = session.login('', ''); session.setActive(false); pending.resolve({ accessToken: 'late', expiresAt: 2000 }); assert.equal(await login, false); assert.equal(session.getSnapshot().state, 'locked'); assert.deepEqual(discarded, ['late']); });
test('newer login wins when an earlier response arrives later', async () => { const pending = deferred(); let calls = 0; const { session } = fixture({ signIn: () => ++calls === 1 ? pending.promise : Promise.resolve({ accessToken: 'new', expiresAt: 2000 }) }); const old = session.login('', ''); assert.equal(await session.login('', ''), true); pending.resolve({ accessToken: 'old', expiresAt: 2000 }); assert.equal(await old, false); assert.equal(await session.read(async token => token), 'new'); });
test('expiry timer locks and attempts remote signout', async () => { const { session, expire, discarded } = fixture(); await session.login('', ''); expire(); assert.equal(session.getSnapshot().state, 'locked'); assert.deepEqual(discarded, ['invented']); });
test('expired session cannot begin a read even if timer was suspended', async () => { const { session, setTime } = fixture(); await session.login('', ''); setTime(3000); await assert.rejects(session.read(async () => 'private'), /invalid_credentials/); assert.equal(session.getSnapshot().state, 'locked'); });
test('read result after lock is rejected and signal aborted', async () => { const pending = deferred(); const { session } = fixture(); await session.login('', ''); let signal; const read = session.read(async (_token, supplied) => { signal = supplied; return pending.promise; }); session.lock(); assert.equal(signal.aborted, true); pending.resolve('invented result'); await assert.rejects(read, /cancelled/); });
test('read expiry during request cannot restore a result', async () => { const { session, setTime } = fixture(); await session.login('', ''); await assert.rejects(session.read(async () => { setTime(3000); return 'invented result'; }), /cancelled/); });
test('logout locks before failed remote revocation finishes', async () => { const pending = deferred(); const { session } = fixture({ signOut: () => pending.promise }); await session.login('', ''); const logout = session.logout(); assert.equal(session.getSnapshot().state, 'locked'); pending.resolve(); await logout; });
test('returning active never unlocks without login', async () => { const { session } = fixture(); await session.login('', ''); session.setActive(false); session.setActive(true); assert.equal(session.getSnapshot().state, 'locked'); });
test('inactive app refuses login and recovery operations', async () => { let calls = 0; const { session } = fixture({ signIn: async () => { calls++; } }); session.setActive(false); assert.equal(await session.login('', ''), false); assert.equal(await session.requestRecovery(''), false); assert.equal(await session.resetPassword('', '', ''), false); assert.equal(calls, 0); });
test('recovery completion requires a new password login', async () => { const { session } = fixture(); assert.equal(await session.requestRecovery(''), true); assert.equal(session.getSnapshot().state, 'recovery_pending'); assert.equal(await session.resetPassword('', '', ''), true); assert.equal(session.getSnapshot().state, 'locked'); await assert.rejects(session.read(async () => 'invented'), /invalid_credentials/); });
test('late recovery after lock does not change state', async () => { const pending = deferred(); const { session } = fixture({ resetPassword: () => pending.promise }); const reset = session.resetPassword('', '', ''); session.lock(); pending.resolve(); assert.equal(await reset, false); assert.equal(session.getSnapshot().state, 'locked'); });
test('unreasonable or expired gateway session is rejected', async () => { for (const expiresAt of [NaN, 999, 9000000]) { const { session } = fixture({ signIn: async () => ({ accessToken: 'fake', expiresAt }) }); assert.equal(await session.login('', ''), false); } });

test('synchronous authorization guard expires without exposing credentials when timer was suspended', async () => {
  const { session, setTime } = fixture(); assert.throws(session.assertUnlocked, /invalid_credentials/);
  await session.login('', ''); assert.equal(session.assertUnlocked(), undefined); setTime(3000);
  assert.throws(session.assertUnlocked, /invalid_credentials/); assert.deepEqual(session.getSnapshot(), { state: 'locked', error: null });
});

test('public origin is captured separately from mutable gateway and never exposes credentials',()=>{
 const gateway={origin:'https://aaaaaaaaaaaaaaaaaaaa.supabase.co'};const session=new SessionModel(gateway);gateway.origin='https://bbbbbbbbbbbbbbbbbbbb.supabase.co';assert.equal(session.getPublicOrigin(),'https://aaaaaaaaaaaaaaaaaaaa.supabase.co');assert.deepEqual(session.getSnapshot(),{state:'locked',error:null});
});
test('legacy fixture without public origin cannot supply a destination for authenticated commands',()=>{
 const {session}=fixture();assert.throws(()=>session.getPublicOrigin(),error=>error instanceof AuthFailure&&error.code==='invalid_configuration');
});
