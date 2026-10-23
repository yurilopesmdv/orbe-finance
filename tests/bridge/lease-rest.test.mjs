import test from 'node:test';
import assert from 'node:assert/strict';
import { createLeasePorts } from '../../supabase/functions/_shared/lease-rest.ts';
const origin = `https://${'a'.repeat(20)}.supabase.co`;
const config = { origin, secretKey: 'sb_secret_invented_only' };
const scope = () => ({ connectionId: '10000000-0000-4000-8000-000000000001', ownerId: '00000000-0000-4000-8000-000000000001', revision: 1 });
const leaseId = '20000000-0000-4000-8000-000000000001';
const now = Date.now();
const grant = patch => ({ status: 'acquired', lease_id: leaseId, revision: 1, lease_expires_at: new Date(now + 120000).toISOString(), next_read_at: new Date(now + 900000).toISOString(), ...patch });
const signal = () => new AbortController().signal;
const response = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
function fixture(steps, options = {}, configuration = config) {
  const calls = [];
  const ports = createLeasePorts(() => configuration, { enabled: true, privateDataApproved: true, ...options, transport: async (url, init) => {
    calls.push({ url, init }); const step = steps.shift(); if (step instanceof Error) throw step;
    return typeof step === 'function' ? step(url, init) : step instanceof Response ? step : response(step);
  } });
  return { ports, calls };
}

test('disabled ports resolve no secret and inspect no scope signal transport or clock', async () => {
  const forbidden = new Proxy({}, { get() { throw new Error('must_not_read'); } });
  const ports = createLeasePorts(() => { throw new Error('must_not_resolve'); }, { get transport() { throw new Error('must_not_read'); }, get clock() { throw new Error('must_not_read'); } });
  assert.deepEqual(await ports.acquire(forbidden, forbidden), { status: 'disabled' }); assert.equal(await ports.check(forbidden, forbidden, forbidden, forbidden), false); assert.equal(await ports.finish(forbidden, forbidden, forbidden, forbidden), false);
});

test('private data gate prevents resolving configuration even if feature is enabled', async () => {
  const ports = createLeasePorts(() => { throw new Error('must_not_resolve'); }, { enabled: true });
  assert.equal((await ports.acquire(null, null)).status, 'disabled');
});

test('configuration requires primitive fixed origin and modern secret and sanitizes resolver errors', () => {
  const enabled = { enabled: true, privateDataApproved: true };
  for (const patch of [{ origin: 'http://untrusted.invalid' }, { origin: origin + '/path' }, { origin: { toString: () => origin } }, { secretKey: 'sbp_invented' }, { secretKey: 'sb_publishable_invented' }, { secretKey: 'eyJlegacy.jwt.signature' }]) assert.throws(() => createLeasePorts(() => ({ ...config, ...patch }), enabled), { message: 'lease_configuration_invalid' });
  assert.throws(() => createLeasePorts(() => { throw new Error('invented-private-error'); }, enabled), { message: 'lease_configuration_invalid' });
});

test('acquire uses server secret only in apikey and UUIDs only in fixed RPC body', async () => {
  const { ports, calls } = fixture([grant({ private: 'invented-private-payload' })]);
  const result = await ports.acquire(scope(), signal()); assert.equal(result.status, 'acquired'); assert.equal(result.leaseId, leaseId); assert.ok(Object.isFrozen(result));
  const { url, init } = calls[0]; assert.equal(url, origin + '/rest/v1/rpc/orbe_begin_connection_read');
  assert.equal(init.headers.apikey, config.secretKey); assert.equal(init.headers.Authorization, undefined); assert.equal(init.method, 'POST');
  assert.deepEqual(JSON.parse(init.body), { p_connection_id: scope().connectionId, p_owner_id: scope().ownerId, p_expected_revision: 1 });
  assert.equal(init.redirect, 'error'); assert.equal(init.credentials, 'omit'); assert.equal(init.cache, 'no-store');
  for (const value of [config.secretKey, scope().ownerId, scope().connectionId]) assert.ok(!url.includes(value));
  assert.ok(!JSON.stringify(result).includes('invented-private'));
});

test('check and finish preserve exact scoped body and boolean denial', async () => {
  const { ports, calls } = fixture([true, false]); assert.equal(await ports.check(scope(), leaseId, 'accounts', signal()), true); assert.equal(await ports.finish(scope(), leaseId, 'cancelled', signal()), false);
  assert.ok(calls[0].url.endsWith('/orbe_check_connection_read')); assert.ok(calls[1].url.endsWith('/orbe_finish_connection_read'));
  assert.deepEqual(JSON.parse(calls[0].init.body), { p_connection_id: scope().connectionId, p_owner_id: scope().ownerId, p_revision: 1, p_lease_id: leaseId, p_product: 'accounts' });
  assert.equal(JSON.parse(calls[1].init.body).p_outcome, 'cancelled');
});

test('busy unavailable and cooldown are projected without upstream extras', async () => {
  const { ports } = fixture([{ status: 'busy', secret: 'invented-private' }, { status: 'unavailable' }, { status: 'cooldown', next_read_at: new Date(now + 800000).toISOString() }]);
  assert.deepEqual(await ports.acquire(scope(), signal()), { status: 'busy' }); assert.deepEqual(await ports.acquire(scope(), signal()), { status: 'unavailable' }); assert.equal((await ports.acquire(scope(), signal())).status, 'cooldown');
});

test('invalid scopes do not reach transport', async () => {
  const { ports, calls } = fixture([]);
  for (const patch of [{ ownerId: 'unknown' }, { connectionId: 'unknown' }, { revision: 0 }, { revision: NaN }, { revision: Number.MAX_SAFE_INTEGER + 1 }]) await assert.rejects(ports.acquire({ ...scope(), ...patch }, signal()), /lease_request_invalid/);
  assert.equal(calls.length, 0);
});

test('wrong nonce product or outcome is denied before network', async () => {
  const { ports, calls } = fixture([]);
  await assert.rejects(ports.check(scope(), 'unknown', 'accounts', signal()), /lease_request_invalid/);
  await assert.rejects(ports.check(scope(), leaseId, 'unknown', signal()), /lease_request_invalid/);
  await assert.rejects(ports.finish(scope(), leaseId, 'private-error', signal()), /lease_request_invalid/); assert.equal(calls.length, 0);
});

test('grant revision expiration timing nonce and schema are validated', async () => {
  for (const body of [grant({ revision: 2 }), grant({ lease_id: 'invalid' }), grant({ lease_expires_at: new Date(now - 1).toISOString() }), grant({ next_read_at: new Date(now + 899000).toISOString() }), grant({ lease_expires_at: '2026-02-30T00:00:00Z' }), { status: 'arbitrary' }, { status: 'cooldown', next_read_at: new Date(now - 1).toISOString() }]) {
    const { ports } = fixture([body]); await assert.rejects(ports.acquire(scope(), signal()), { message: 'lease_unavailable' });
  }
});

test('RPC check and finish require literal booleans', async () => {
  for (const body of [{ allowed: true }, 'true', null]) {
    const { ports } = fixture([body, body]); await assert.rejects(ports.check(scope(), leaseId, 'accounts', signal()), /lease_unavailable/); await assert.rejects(ports.finish(scope(), leaseId, 'success', signal()), /lease_unavailable/);
  }
});

test('response body limit and malformed JSON are enforced without raw payload', async () => {
  for (const value of [new Response(' '.repeat(16385), { headers: { 'Content-Type': 'application/json' } }), new Response('{bad', { headers: { 'Content-Type': 'application/json' } }), new Response(new Uint8Array([0xff]), { headers: { 'Content-Type': 'application/json' } })]) {
    const { ports } = fixture([value]); await assert.rejects(ports.acquire(scope(), signal()), { message: 'lease_unavailable' });
  }
});

test('redirects raw errors and HTTP failures never reveal secrets or destinations', async () => {
  for (const value of [new Response(null, { status: 302, headers: { Location: 'https://untrusted.invalid/private' } }), new Error('invented-private-token https://private.invalid'), response({ message: 'invented-private' }, 403)]) {
    const { ports } = fixture([value]); await assert.rejects(ports.acquire(scope(), signal()), { message: 'lease_unavailable' });
  }
});

test('pre-aborted request starts no RPC', async () => {
  const controller = new AbortController(); controller.abort(); const { ports, calls } = fixture([]);
  await assert.rejects(ports.acquire(scope(), controller.signal), /lease_unavailable/); assert.equal(calls.length, 0);
});

test('deadline releases caller even if transport ignores abort and clears timer', async () => {
  let fire, seen; let cleared = 0;
  const clock = { now: () => now, setTimer: (callback, ms) => { assert.equal(ms, 20000); fire = callback; return 1; }, clearTimer: () => { cleared++; } };
  const { ports } = fixture([(_, init) => { seen = init.signal; return new Promise(() => {}); }], { clock });
  const pending = ports.acquire(scope(), signal()); fire(); await assert.rejects(pending, { message: 'lease_unavailable' }); assert.equal(seen.aborted, true); assert.equal(cleared, 1);
});

test('request cancellation stops a hanging response body', async () => {
  let canceled = false; const parent = new AbortController();
  const stream = new ReadableStream({ start(controller) { controller.enqueue(new TextEncoder().encode('{')); }, cancel() { canceled = true; } });
  const { ports } = fixture([new Response(stream, { headers: { 'Content-Type': 'application/json' } })]);
  const pending = ports.acquire(scope(), parent.signal); await new Promise(resolve => setImmediate(resolve)); parent.abort();
  await assert.rejects(pending, /lease_unavailable/); await new Promise(resolve => setImmediate(resolve)); assert.equal(canceled, true);
});

test('configuration and scope mutation cannot change destination or grant context', async () => {
  const configuration = { ...config }; let release; const input = scope();
  const { ports, calls } = fixture([() => new Promise(resolve => { release = resolve; })], {}, configuration);
  configuration.origin = 'https://untrusted.invalid'; configuration.secretKey = 'private';
  const pending = ports.acquire(input, signal()); input.revision = 2; input.ownerId = '00000000-0000-4000-8000-000000000002'; release(response(grant()));
  assert.equal((await pending).revision, 1); assert.equal(calls[0].url, origin + '/rest/v1/rpc/orbe_begin_connection_read'); assert.equal(calls[0].init.headers.apikey, config.secretKey); assert.equal(JSON.parse(calls[0].init.body).p_owner_id, scope().ownerId);
});

test('simultaneous connections never reuse the other request scope', async () => {
  const calls = []; let release; let arrivals = 0; const ready = new Promise(resolve => { release = resolve; });
  const ports = createLeasePorts(() => config, { enabled: true, privateDataApproved: true, transport: async (_, init) => {
    const body = JSON.parse(init.body); calls.push(body); if (++arrivals === 2) release(); await ready;
    return response(body.p_owner_id === scope().ownerId ? grant() : { status: 'unavailable' });
  } });
  const other = { connectionId: '10000000-0000-4000-8000-000000000002', ownerId: '00000000-0000-4000-8000-000000000002', revision: 1 };
  const results = await Promise.all([ports.acquire(scope(), signal()), ports.acquire(other, signal())]); assert.deepEqual(results.map(result => result.status), ['acquired', 'unavailable']); assert.equal(calls[0].p_owner_id, scope().ownerId); assert.equal(calls[1].p_owner_id, other.ownerId);
});

test('product admission uses dedicated RPC and strict short cooldown lease format',async()=>{
 const f=fixture([grant({next_read_at:new Date(now+30000).toISOString()})]);const result=await f.ports.acquire({...scope(),product:'transactions'},signal());assert.equal(result.status,'acquired');assert.ok(f.calls[0].url.endsWith('/orbe_begin_product_read'));assert.equal(JSON.parse(f.calls[0].init.body).p_product,'transactions');
 const wrong=fixture([grant()]);await assert.rejects(wrong.ports.acquire({...scope(),product:'accounts'},signal()));
});
