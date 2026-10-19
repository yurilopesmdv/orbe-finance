import test from 'node:test';
import assert from 'node:assert/strict';
import { createBridgeHandler } from '../../supabase/functions/_shared/bridge.ts';
import { createSupabasePorts } from '../../supabase/functions/_shared/supabase-rest.ts';
const origin = `https://${'a'.repeat(20)}.supabase.co`;
const config = { origin, publishableKey: 'sb_publishable_invented' };
const owner = '00000000-0000-4000-8000-000000000001';
const other = '00000000-0000-4000-8000-000000000002';
function token(subject = owner, patch = {}) {
  const payload = { sub: subject, iss: origin + '/auth/v1', aud: 'authenticated', role: 'authenticated', is_anonymous: false, exp: Math.floor(Date.now() / 1000) + 600, ...patch };
  return 'eyJhbGciOiJpbnZlbnRlZCJ9.' + Buffer.from(JSON.stringify(payload)).toString('base64url') + '.invented_signature';
}
const json = (value, status = 200) => new Response(JSON.stringify(value), { status, headers: { 'Content-Type': 'application/json' } });
const user = subject => ({ id: subject, is_anonymous: false, email: 'invented-private@example.invalid', user_metadata: { private: 'invented-private-metadata' } });
const signal = () => new AbortController().signal;
const req = credential => new Request('https://bridge.invalid/connections/status', { method: 'POST', headers: { Authorization: 'Bearer ' + credential, 'Content-Type': 'application/json' }, body: '{}' });
function fixture(steps, configuration = config) {
  const calls = [];
  const ports = createSupabasePorts(configuration, async (url, init) => {
    calls.push({ url, init }); const step = steps.shift();
    if (step instanceof Error) throw step;
    if (typeof step === 'function') return step(url, init);
    if (step instanceof Response) return step;
    return json(step);
  });
  return { ports, calls, handler: createBridgeHandler(ports, { enabled: true }) };
}

test('configuration only permits project HTTPS and a publishable key', () => {
  for (const value of ['http://localhost', 'https://untrusted.invalid', origin + '/path', origin + '?token=private']) assert.throws(() => createSupabasePorts({ ...config, origin: value }), /bridge_configuration_invalid/);
  for (const key of ['sbp_invented', 'sb_secret_invented', 'legacy-jwt']) assert.throws(() => createSupabasePorts({ ...config, publishableKey: key }), /bridge_configuration_invalid/);
});

test('configuration mutation cannot redirect later requests', async () => {
  const mutable = { ...config }; const { ports, calls } = fixture([user(owner), true], mutable); mutable.origin = 'https://untrusted.invalid'; mutable.publishableKey = 'private';
  assert.equal((await ports.authenticate(token(), signal())).isOwner, true);
  assert.equal(calls[0].url, origin + '/auth/v1/user'); assert.equal(calls[0].init.headers.apikey, config.publishableKey);
});

test('authenticated owner uses same Bearer for Auth RPC and RLS metadata without identity URLs', async () => {
  const credential = token(); const { handler, calls } = fixture([user(owner), true, []]);
  const response = await handler(req(credential)); assert.equal(response.status, 200);
  assert.equal(calls.length, 3); assert.equal(calls[1].url, origin + '/rest/v1/rpc/orbe_has_session');
  assert.equal(calls[1].init.body, '{}');
  assert.ok(calls[2].url.includes('/orbe_connections?select=id,owner_id,')); assert.ok(calls[2].url.endsWith('&limit=101'));
  for (const call of calls) {
    assert.equal(call.init.headers.Authorization, 'Bearer ' + credential); assert.equal(call.init.headers.apikey, config.publishableKey);
    assert.equal(call.init.redirect, 'error'); assert.equal(call.init.credentials, 'omit'); assert.equal(call.init.cache, 'no-store');
    for (const privateValue of [owner, credential, 'invented-private']) assert.ok(!call.url.includes(privateValue));
  }
  const text = await response.text(); assert.ok(!text.includes('invented-private')); assert.ok(!text.includes(owner));
});

test('decoded claims alone never authorize a token refused by Auth', async () => {
  const { handler, calls } = fixture([json({ message: 'private-auth-error' }, 401)]);
  assert.equal((await handler(req(token()))).status, 401); assert.equal(calls.length, 1);
});

test('malformed expired wrong-project audience or role JWT never reaches metadata', async () => {
  const invalid = ['not-jwt', token(owner, { exp: 1 }), token(owner, { iss: 'https://untrusted.invalid/auth/v1' }), token(owner, { aud: 'other' }), token(owner, { role: 'service_role' }), token(owner, { sub: 'invalid' }), token(owner, { is_anonymous: true })];
  for (const credential of invalid) { const { handler, calls } = fixture([]); assert.equal((await handler(req(credential))).status, 401); assert.equal(calls.length, 0); }
});

test('user mismatch or anonymous Auth response never calls RPC or metadata', async () => {
  for (const value of [user(other), { ...user(owner), is_anonymous: true }, { id: owner }, null]) {
    const { handler, calls } = fixture([value]); assert.equal((await handler(req(token()))).status, 401); assert.equal(calls.length, 1);
  }
});

test('RPC false forbids authenticated second identity before metadata', async () => {
  const { handler, calls } = fixture([user(other), false]); assert.equal((await handler(req(token(other)))).status, 403); assert.equal(calls.length, 2);
});

test('RPC requires exact boolean and errors are sanitized', async () => {
  for (const value of [null, { allowed: true }, 'true', json({ message: 'private-schema' }, 403)]) {
    const { handler, calls } = fixture([user(owner), value]); const response = await handler(req(token()));
    assert.equal(response.status, 503); assert.equal(await response.text(), '{"error":"unavailable"}'); assert.equal(calls.length, 2);
  }
});

test('metadata token must match the validated subject before network', async () => {
  const { ports, calls } = fixture([]);
  await assert.rejects(ports.listConnections(other, signal(), token()), { message: 'bridge_upstream_unavailable' }); assert.equal(calls.length, 0);
});

test('redirect responses and raw network errors never expose destinations', async () => {
  for (const step of [new Response(null, { status: 302, headers: { Location: 'https://untrusted.invalid/private' } }), new Error('private-token https://private.invalid')]) {
    const { handler, calls } = fixture([step]); const response = await handler(req(token()));
    assert.equal(response.status, 503); assert.equal(await response.text(), '{"error":"unavailable"}'); assert.equal(calls.length, 1);
  }
});

test('upstream body is bounded despite a missing or false content length', async () => {
  let canceled = false;
  const stream = new ReadableStream({ start(controller) { controller.enqueue(new Uint8Array(131073)); }, cancel() { canceled = true; } });
  const { handler } = fixture([new Response(stream, { headers: { 'Content-Type': 'application/json', 'Content-Length': '2' } })]);
  assert.equal((await handler(req(token()))).status, 503); assert.equal(canceled, true);
});

test('malformed UTF-8 JSON and unexpected media types fail closed', async () => {
  for (const body of [new Response(new Uint8Array([0xff]), { headers: { 'Content-Type': 'application/json' } }), new Response('{bad', { headers: { 'Content-Type': 'application/json' } }), new Response('<html>private</html>', { headers: { 'Content-Type': 'text/html' } })]) {
    const { handler } = fixture([body]); assert.equal((await handler(req(token()))).status, 503);
  }
});

test('non-array metadata and HTTP failures return a generic error', async () => {
  for (const value of [{ private: 'invented' }, json({ message: 'private' }, 500), json({}, 401)]) {
    const { handler } = fixture([user(owner), true, value]); const response = await handler(req(token()));
    assert.equal(response.status, 503); assert.equal(await response.text(), '{"error":"unavailable"}');
  }
});

test('already aborted signal does not call transport', async () => {
  const controller = new AbortController(); controller.abort(); const { ports, calls } = fixture([]);
  await assert.rejects(ports.authenticate(token(), controller.signal), /bridge_upstream_unavailable/); assert.equal(calls.length, 0);
});

test('aborted late Auth response cannot initiate RPC or metadata', async () => {
  const controller = new AbortController(); let release;
  const { ports, calls } = fixture([() => new Promise(resolve => { release = resolve; })]);
  const pending = ports.authenticate(token(), controller.signal); controller.abort(); release(json(user(owner)));
  await assert.rejects(pending, /bridge_upstream_unavailable/); assert.equal(calls.length, 1);
});

test('two simultaneous sessions never share credentials or ownership', async () => {
  const credentials = [token(owner), token(other)]; const calls = []; let arrivals = 0; let release;
  const rendezvous = new Promise(resolve => { release = resolve; });
  const ports = createSupabasePorts(config, async (url, init) => {
    const credential = init.headers.Authorization.slice(7); const index = credentials.indexOf(credential); assert.ok(index >= 0); calls.push([index, url]);
    if (url.endsWith('/user')) { arrivals++; if (arrivals === 2) release(); await rendezvous; return json(user(index === 0 ? owner : other)); }
    if (url.endsWith('/orbe_has_session')) return json(index === 0);
    assert.equal(index, 0, 'second identity must never request metadata'); return json([]);
  });
  const handler = createBridgeHandler(ports, { enabled: true });
  const responses = await Promise.all(credentials.map(credential => handler(req(credential))));
  assert.deepEqual(responses.map(response => response.status), [200, 403]);
  assert.deepEqual(calls.map(([index]) => index).sort(), [0, 0, 0, 1, 1]);
});

test('disabled bridge does not perform any adapter requests', async () => {
  const { ports, calls } = fixture([]); assert.equal((await createBridgeHandler(ports)(req(token()))).status, 503); assert.equal(calls.length, 0);
});

test('origin and public key require primitive strings rather than coercible objects', () => {
  assert.throws(() => createSupabasePorts({ ...config, origin: { toString: () => config.origin } }), /bridge_configuration_invalid/);
  assert.throws(() => createSupabasePorts({ ...config, publishableKey: { toString: () => config.publishableKey } }), /bridge_configuration_invalid/);
});

test('metadata select requests independent authorization fields after the schema migration', async () => {
  const { ports, calls } = fixture([[]]); await ports.listConnections(owner, signal(), token());
  assert.ok(calls[0].url.includes('proxy_consent_expires_at,bank_consent_expires_at')); assert.ok(!calls[0].url.includes('authorization_expires_at'));
});

test('Auth identity success cannot read metadata after session gate denies authorization',async()=>{
 const {handler,calls}=fixture([user(owner),false]);const response=await handler(req(token()));assert.equal(response.status,403);assert.equal(calls.length,2);assert.ok(calls[1].url.endsWith('/orbe_has_session'));assert.ok(!calls.some(call=>call.url.includes('/orbe_connections?')));
});
