import test from 'node:test';
import assert from 'node:assert/strict';
import { AccessSession } from './session.mjs';

function deferred() { let resolve; const promise = new Promise(r => { resolve = r; }); return { promise, resolve }; }
function setup(overrides = {}) {
  let now = 1000;
  const calls = [];
  const provider = {
    signIn: async () => ({ userId: 'synthetic-owner', accessToken: 'synthetic-token', expiresAt: 2000 }),
    signOut: async () => { calls.push('signOut'); },
    requestRecovery: async () => {}, resetPassword: async () => {}, ...overrides,
  };
  const access = new AccessSession({ provider, ownerId: 'synthetic-owner', now: () => now });
  return { access, calls, advance: () => { now = 2000; } };
}
const login = access => access.login('owner@example.invalid', 'synthetic-password');

test('starts locked and denies reading', async () => {
  const { access } = setup(); assert.equal(access.snapshot.state, 'locked');
  await assert.rejects(access.read(() => 'private'), /locked/);
});
test('valid login keeps credentials out of public snapshot', async () => {
  const { access } = setup(); assert.equal(await login(access), true);
  assert.deepEqual(access.snapshot, { state: 'unlocked', error: null });
  assert.equal(JSON.stringify(access).includes('synthetic-token'), false);
  assert.equal(await access.read(() => 'synthetic-result'), 'synthetic-result');
});
test('wrong owner is denied and returned session is discarded', async () => {
  const { access, calls } = setup({ signIn: async () => ({ userId: 'other', accessToken: 'fake', expiresAt: 3000 }) });
  assert.equal(await login(access), false); assert.equal(access.snapshot.state, 'locked');
  assert.deepEqual(calls, ['signOut']);
});
test('provider error messages are sanitized', async () => {
  const { access } = setup({ signIn: async () => { throw new Error('sensitive-provider-payload'); } });
  await login(access); assert.equal(access.snapshot.error, 'unavailable');
  assert.equal(JSON.stringify(access.snapshot).includes('sensitive'), false);
});
for (const code of ['offline', 'rate_limited', 'invalid_credentials']) {
  test(`safe login failure: ${code}`, async () => {
    const { access } = setup({ signIn: async () => { throw { code }; } });
    assert.equal(await login(access), false); assert.equal(access.snapshot.error, code);
  });
}
test('inactive and background lock immediately and active does not unlock', async () => {
  const { access } = setup(); await login(access); access.setAppState('inactive');
  assert.equal(access.snapshot.state, 'locked'); access.setAppState('active');
  await assert.rejects(access.read(() => 1), /locked/);
  await login(access); access.setAppState('background'); assert.equal(access.snapshot.state, 'locked');
});
test('late login after background never unlocks', async () => {
  const pending = deferred(); const { access, calls } = setup({ signIn: () => pending.promise });
  const request = login(access); access.setAppState('inactive'); access.setAppState('active');
  pending.resolve({ userId: 'synthetic-owner', accessToken: 'fake', expiresAt: 3000 });
  assert.equal(await request, false); assert.equal(access.snapshot.state, 'locked'); assert.equal(calls.length, 1);
});
test('latest login wins over an older pending request', async () => {
  const pending = deferred(); let count = 0;
  const { access } = setup({ signIn: () => ++count === 1 ? pending.promise : Promise.resolve({ userId: 'synthetic-owner', accessToken: 'new-fake', expiresAt: 3000 }) });
  const old = login(access); assert.equal(await login(access), true);
  pending.resolve({ userId: 'synthetic-owner', accessToken: 'old-fake', expiresAt: 3000 });
  assert.equal(await old, false); assert.equal(access.snapshot.state, 'unlocked');
});
test('pending financial response is rejected after logout', async () => {
  const { access } = setup(); await login(access); const pending = deferred();
  const read = access.read(() => pending.promise); await access.logout(); pending.resolve('synthetic-private');
  await assert.rejects(read, /stale_result/); assert.equal(access.snapshot.state, 'locked');
});
test('expiration denies new calls and late responses', async () => {
  const { access, advance } = setup(); await login(access); const pending = deferred();
  const read = access.read(() => pending.promise); advance(); pending.resolve('synthetic-private');
  await assert.rejects(read, /stale_result/); await assert.rejects(access.read(() => 1), /locked/);
});
test('expired provider session cannot unlock', async () => {
  const { access } = setup({ signIn: async () => ({ userId: 'synthetic-owner', accessToken: 'fake', expiresAt: 999 }) });
  assert.equal(await login(access), false);
});
test('logout failure still removes local access', async () => {
  const { access } = setup({ signOut: async () => { throw new Error('offline'); } });
  await login(access); await access.logout(); await assert.rejects(access.read(() => 1), /locked/);
});
test('unknown and known recovery emails receive same public state', async () => {
  const a = setup().access;
  const b = setup({ requestRecovery: async () => { throw new Error('user_not_found'); } }).access;
  await a.requestRecovery('owner@example.invalid'); await b.requestRecovery('unknown@example.invalid');
  assert.deepEqual(a.snapshot, b.snapshot); assert.equal(a.snapshot.state, 'recovery_pending');
});
test('expired recovery code leaves data locked', async () => {
  const { access } = setup({ resetPassword: async () => { throw { code: 'expired_code' }; } });
  assert.equal(await access.resetPassword('owner@example.invalid', 'fake-expired', 'new-synthetic-password'), false);
  assert.equal(access.snapshot.error, 'expired_code'); await assert.rejects(access.read(() => 1), /locked/);
});
test('successful reset requires a separate password login', async () => {
  const { access } = setup(); await login(access);
  assert.equal(await access.resetPassword('owner@example.invalid', 'fake-code', 'new-synthetic-password'), true);
  await assert.rejects(access.read(() => 1), /locked/); assert.equal(await login(access), true);
});
test('weak new password never reaches provider', async () => {
  let called = false; const { access } = setup({ resetPassword: async () => { called = true; } });
  assert.equal(await access.resetPassword('owner@example.invalid', 'fake', 'short'), false);
  assert.equal(called, false);
});
test('recovery response cannot revive state after background', async () => {
  const pending = deferred(); const { access } = setup({ requestRecovery: () => pending.promise });
  const request = access.requestRecovery('owner@example.invalid'); access.setAppState('background'); pending.resolve();
  assert.equal(await request, false); assert.equal(access.snapshot.state, 'locked');
});

test('financial operation errors never expose provider payload', async () => {
  const { access } = setup(); await login(access);
  await assert.rejects(access.read(() => { throw new Error('sensitive-body'); }), { message: 'unavailable' });
});
