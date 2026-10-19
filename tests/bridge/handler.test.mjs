import test from 'node:test';
import assert from 'node:assert/strict';
import { createBridgeHandler } from '../../supabase/functions/_shared/bridge.ts';
const owner = '00000000-0000-4000-8000-000000000001';
const other = '00000000-0000-4000-8000-000000000002';
const connection = '00000000-0000-4000-8000-000000000003';
const principal = () => ({ subject: owner, isOwner: true, expiresAt: Date.now() + 60000 });
const row = () => ({ id: connection, owner_id: owner, institution: 'bradesco', state: 'pending', revision: 1,
  accounts_available: true, transactions_available: null, investments_available: false, reserves_available: null,
  open_finance_verified_at: null, proxy_consent_expires_at: null, bank_consent_expires_at: null, source_updated_at: '2026-10-19T10:00:00-03:00', last_read_at: null,
  external_item_id: 'invented-private-item', bank_account: 'invented-private-account', secret: 'invented-private-token',
});
function fixture(overrides = {}, options = {}) {
  const calls = [];
  const ports = {
    authenticate: async (token, signal) => { calls.push(['auth', token, signal]); return principal(); },
    listConnections: async (subject, signal) => { calls.push(['metadata', subject, signal]); return [row()]; }, ...overrides,
  };
  return { calls, handler: createBridgeHandler(ports, { enabled: true, ...options }) };
}
function request(body = '{}', init = {}, suffix = '') {
  return new Request('https://bridge.invalid/connections/status' + suffix, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer invented-valid-token' }, body, ...init });
}

test('disabled handler never touches request, ports or clock', async () => {
  const forbidden = new Proxy({}, { get() { throw new Error('must_not_access'); } });
  const handler = createBridgeHandler(forbidden, { clock: forbidden });
  const response = await handler(forbidden);
  assert.equal(response.status, 503); assert.deepEqual(await response.json(), { error: 'unavailable' });
});

test('configuration mutation does not enable a handler created disabled', async () => {
  const options = { enabled: false };
  const handler = createBridgeHandler({}, options); options.enabled = true;
  assert.equal((await handler(request())).status, 503);
});

test('owner response projects only allowed metadata and preserves unknown capability', async () => {
  const { calls, handler } = fixture(); const response = await handler(request());
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('cache-control'), 'no-store'); assert.equal(response.headers.get('access-control-allow-origin'), null);
  const text = await response.text(); const data = JSON.parse(text).connections[0];
  assert.equal(data.capabilities.transactions, null); assert.equal(data.capabilities.investments, false);
  assert.equal(data.sourceUpdatedAt, '2026-10-19T13:00:00.000Z');
  for (const sensitive of [owner, 'invented-private-item', 'invented-private-account', 'invented-private-token', 'invented-valid-token']) assert.ok(!text.includes(sensitive));
  assert.deepEqual(calls.map(c => c[0]), ['auth', 'metadata']); assert.equal(calls[1][1], owner);
});

test('empty authorized metadata is an empty list', async () => {
  const { handler } = fixture({ listConnections: async () => [] });
  assert.deepEqual(await (await handler(request())).json(), { connections: [] });
});

test('missing or malformed bearer never invokes authentication or metadata', async () => {
  for (const authorization of ['', 'Basic invented', 'Bearer token other', 'Bearer ' + 'x'.repeat(8193)]) {
    const { handler, calls } = fixture(); const req = request(); req.headers.set('authorization', authorization);
    assert.equal((await handler(req)).status, 401); assert.equal(calls.length, 0);
  }
});

test('invalid route, method, media type and URL parameters are rejected early', async () => {
  const cases = [new Request('https://bridge.invalid/unknown'), request(undefined, { method: 'GET', body: undefined }), request('{}', { headers: { 'Content-Type': 'text/plain' } }), request('{}', {}, '?owner_id=invented')];
  const statuses = [404, 405, 415, 400];
  for (let i = 0; i < cases.length; i++) { const { handler, calls } = fixture(); assert.equal((await handler(cases[i])).status, statuses[i]); assert.equal(calls.length, 0); }
});

test('expired or malformed principal is denied before metadata', async () => {
  for (const identity of [null, {}, { ...principal(), subject: 'unsafe-id' }, { ...principal(), expiresAt: Date.now() - 1 }, { ...principal(), expiresAt: Infinity }]) {
    let reads = 0; const { handler } = fixture({ authenticate: async () => identity, listConnections: async () => { reads++; return []; } });
    assert.equal((await handler(request())).status, 401); assert.equal(reads, 0);
  }
});

test('verified second identity is forbidden before any metadata read', async () => {
  let reads = 0; const { handler } = fixture({ authenticate: async () => ({ ...principal(), subject: other, isOwner: false }), listConnections: async () => { reads++; return []; } });
  assert.equal((await handler(request())).status, 403); assert.equal(reads, 0);
});

test('raw auth/provider errors never enter the response', async () => {
  for (const stage of ['authenticate', 'listConnections']) {
    const { handler } = fixture({ [stage]: async () => { throw new Error('private-token https://private.invalid/owner'); } });
    const response = await handler(request()); assert.equal(response.status, 503); assert.equal(await response.text(), '{"error":"unavailable"}');
  }
});

test('body only accepts an empty JSON object without client ownership or external IDs', async () => {
  for (const body of ['', '{', 'null', '[]', '"text"', '{"owner_id":"invented"}', '{"item_id":"invented"}', '{"url":"https://untrusted.invalid"}']) {
    const { handler, calls } = fixture(); assert.equal((await handler(request(body))).status, 400); assert.equal(calls.filter(c => c[0] === 'metadata').length, 0);
  }
});

test('body byte limit is enforced even when content-length lies', async () => {
  const { handler, calls } = fixture(); const req = request(' '.repeat(16384) + '{}'); req.headers.set('content-length', '2');
  assert.equal((await handler(req)).status, 413); assert.equal(calls.filter(c => c[0] === 'metadata').length, 0);
  const declared = request(); declared.headers.set('content-length', '16385'); assert.equal((await handler(declared)).status, 413);
});

test('foreign ownership, duplicate IDs and excessive collection fail closed', async () => {
  for (const rows of [[{ ...row(), owner_id: other }], [row(), row()], Array.from({ length: 101 }, row)]) {
    const { handler } = fixture({ listConnections: async () => rows });
    assert.equal((await handler(request())).status, 503);
  }
});

test('metadata enums, scalar types and capabilities are validated before output', async () => {
  for (const patch of [{ revision: Number.MAX_SAFE_INTEGER + 1 }, { state: 'unexpected' }, { institution: { raw: 'invented' } }, { accounts_available: {} }, { id: 'unsafe' }]) {
    const { handler } = fixture({ listConnections: async () => [{ ...row(), ...patch }] }); assert.equal((await handler(request())).status, 503);
  }
});

test('invalid civil timestamps and active without OF evidence fail closed', async () => {
  for (const patch of [{ source_updated_at: '2026-02-30T00:00:00Z' }, { last_read_at: '2026-10-19T25:00:00Z' }, { source_updated_at: {} }, { state: 'active' }]) {
    const { handler } = fixture({ listConnections: async () => [{ ...row(), ...patch }] }); assert.equal((await handler(request())).status, 503);
  }
});

function manualClock() {
  let fire; let clearCount = 0; let now = Date.now();
  return { clock: { now: () => now, setTimer: (callback, ms) => { assert.equal(ms, 20000); fire = callback; return 1; }, clearTimer: handle => { assert.equal(handle, 1); clearCount++; } }, fire: () => fire(), cleared: () => clearCount, expire: () => { now += 120000; } };
}

test('timeout aborts auth and late authentication never starts metadata', async () => {
  const clock = manualClock(); let release; let reads = 0; let signal;
  const { handler } = fixture({ authenticate: async (_, s) => { signal = s; return new Promise(resolve => { release = resolve; }); }, listConnections: async () => { reads++; return []; } }, { clock: clock.clock });
  const result = handler(request()); clock.fire(); assert.equal((await result).status, 504); assert.equal(signal.aborted, true);
  release(principal()); await new Promise(resolve => setImmediate(resolve)); assert.equal(reads, 0); assert.equal(clock.cleared(), 1);
});

test('request abort cancels pending metadata and suppresses late result', async () => {
  const controller = new AbortController(); let release; let seen; let entered;
  const ready = new Promise(resolve => { entered = resolve; });
  const { handler } = fixture({ listConnections: async (_, signal) => { seen = signal; entered(); return new Promise(resolve => { release = resolve; }); } });
  const result = handler(request('{}', { signal: controller.signal })); await ready; controller.abort();
  const response = await result; assert.equal(response.status, 499); assert.equal(seen.aborted, true);
  release([row()]); assert.deepEqual(await response.json(), { error: 'request_aborted' });
});

test('expiration while reading metadata prevents successful output', async () => {
  const clock = manualClock(); const { handler } = fixture({ listConnections: async () => { clock.expire(); return [row()]; } }, { clock: clock.clock });
  assert.equal((await handler(request())).status, 401); assert.equal(clock.cleared(), 1);
});

test('stream canceled on total deadline even when body never finishes', async () => {
  const clock = manualClock(); let canceled = false;
  const body = new ReadableStream({ start(controller) { controller.enqueue(new TextEncoder().encode('{')); }, cancel() { canceled = true; } });
  const { handler, calls } = fixture({}, { clock: clock.clock });
  const result = handler(request(body, { duplex: 'half' })); await new Promise(resolve => setImmediate(resolve)); clock.fire();
  assert.equal((await result).status, 504); await new Promise(resolve => setImmediate(resolve));
  assert.equal(canceled, true); assert.equal(calls.filter(c => c[0] === 'metadata').length, 0);
});

test('already-aborted request starts no timer or authentication', async () => {
  const controller = new AbortController(); controller.abort(); const clock = manualClock();
  const { handler, calls } = fixture({}, { clock: clock.clock }); assert.equal((await handler(request('{}', { signal: controller.signal }))).status, 499); assert.equal(calls.length, 0); assert.equal(clock.cleared(), 0);
});


test('validated principal scalars are not changed by a mutable adapter result', async () => {
  const identity = principal(); let subjectRead;
  const { handler } = fixture({ authenticate: async () => identity, listConnections: async subject => {
    subjectRead = subject; identity.subject = other; identity.expiresAt = Infinity;
    return [{ ...row(), owner_id: other }];
  } });
  assert.equal((await handler(request())).status, 503); assert.equal(subjectRead, owner);
});

test('invalid UTF-8 is rejected without replacement or metadata read', async () => {
  const { handler, calls } = fixture();
  assert.equal((await handler(request(new Uint8Array([0xff, 0xfe])))).status, 400);
  assert.equal(calls.filter(c => c[0] === 'metadata').length, 0);
});

test('status projects proxy and bank deadlines separately and derives rather than trusts the legacy alias', async () => {
  const metadata = { ...row(), proxy_consent_expires_at: '2026-12-19T12:00:00Z', bank_consent_expires_at: '2026-11-19T12:00:00Z', authorization_expires_at: '2030-01-01T00:00:00Z' };
  const { handler } = fixture({ listConnections: async () => [metadata] });
  const response = await handler(request()); assert.equal(response.status, 200);
  const projected = (await response.json()).connections[0];
  assert.equal(projected.proxyConsentExpiresAt, '2026-12-19T12:00:00.000Z'); assert.equal(projected.bankConsentExpiresAt, '2026-11-19T12:00:00.000Z'); assert.equal(projected.authorizationExpiresAt, projected.bankConsentExpiresAt);
});
