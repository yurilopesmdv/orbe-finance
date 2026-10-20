import test from 'node:test';
import assert from 'node:assert/strict';
import { createMetadataRuntime } from '../../supabase/functions/_shared/metadata-runtime.ts';
const origin = `https://${'a'.repeat(20)}.supabase.co`;
const subject = '00000000-0000-4000-8000-000000000001';
const values = () => ({ ORBE_METADATA_ENABLED: 'true', SUPABASE_URL: origin, ORBE_PUBLISHABLE_KEY: 'sb_publishable_invented' });
const json = body => new Response(JSON.stringify(body), { headers: { 'Content-Type': 'application/json' } });
const token = () => 'eyJhbGciOiJpbnZlbnRlZCJ9.' + Buffer.from(JSON.stringify({ sub: subject, iss: origin + '/auth/v1', aud: 'authenticated', role: 'authenticated', is_anonymous: false, exp: Math.floor(Date.now() / 1000) + 600 })).toString('base64url') + '.invented_signature';
const request = (path = '/connections/status', credential = token()) => new Request('https://metadata.invalid' + path, { method: 'POST', headers: { 'Content-Type': 'application/json', ...(credential ? { Authorization: 'Bearer ' + credential } : {}) }, body: '{}' });
const forbiddenRequest = () => new Proxy({}, { get() { throw new Error('request_read'); } });
const noNetwork = () => { throw new Error('network_called'); };
async function unavailable(handler) {
  const response = await handler(forbiddenRequest());
  assert.equal(response.status, 503);
  assert.equal(response.headers.get('cache-control'), 'no-store');
  assert.deepEqual(await response.json(), { error: 'unavailable' });
}

test('only exact true enables runtime; disabled reads only gate and never request/network', async () => {
  for (const flag of [undefined, null, false, true, '', 'TRUE', ' true', 'false', 1]) {
    const reads = [];
    await unavailable(createMetadataRuntime(name => { reads.push(name); if (name !== 'ORBE_METADATA_ENABLED') throw new Error('configuration_read'); return flag; }, noNetwork));
    assert.deepEqual(reads, ['ORBE_METADATA_ENABLED']);
  }
});

test('configuration reader failures fail closed without leaking details', async () => {
  for (const failed of ['ORBE_METADATA_ENABLED', 'SUPABASE_URL', 'ORBE_PUBLISHABLE_KEY']) {
    await unavailable(createMetadataRuntime(name => { if (name === failed) throw new Error('invented-sensitive-error'); return values()[name]; }, noNetwork));
  }
});

test('invalid origins, privileged keys, and absent transport never start runtime', async () => {
  for (const patch of [{ SUPABASE_URL: undefined }, { SUPABASE_URL: origin + '/other' }, { SUPABASE_URL: 'https://untrusted.invalid' }, { ORBE_PUBLISHABLE_KEY: 'sb_secret_invented' }, { ORBE_PUBLISHABLE_KEY: null }]) {
    const config = { ...values(), ...patch };
    await unavailable(createMetadataRuntime(name => config[name], noNetwork));
  }
  await unavailable(createMetadataRuntime(name => values()[name], undefined));
});

test('boot captures public configuration; owner fixture uses Auth session gate then metadata with same JWT', async () => {
  const config = values(); const calls = []; const credential = token();
  const steps = [{ id: subject, is_anonymous: false }, true, []];
  const handler = createMetadataRuntime(name => config[name], async (url, init) => { calls.push({ url, init }); return json(steps.shift()); });
  config.SUPABASE_URL = 'https://untrusted.invalid'; config.ORBE_PUBLISHABLE_KEY = 'sb_secret_invented'; config.ORBE_METADATA_ENABLED = 'false';
  const response = await handler(request('/connections/status', credential));
  assert.equal(response.status, 200);
  assert.equal(calls.length, 3);
  assert.equal(calls[1].url, origin + '/rest/v1/rpc/orbe_has_session');
  for (const { url, init } of calls) {
    assert.ok(url.startsWith(origin + '/'));
    assert.equal(init.headers.Authorization, 'Bearer ' + credential);
    assert.equal(init.headers.apikey, 'sb_publishable_invented');
    assert.equal(init.redirect, 'error'); assert.equal(init.credentials, 'omit');
  }
});

test('missing Bearer and financial routes never consult Auth or metadata', async () => {
  const handler = createMetadataRuntime(name => values()[name], noNetwork);
  assert.equal((await handler(request('/connections/status', ''))).status, 401);
  for (const route of ['/transactions', '/accounts', '/investments', '/connections/status?token=invented']) {
    const response = await handler(request(route));
    assert.ok(response.status >= 400);
  }
});

test('revoked or nonowner session cannot read connection metadata', async () => {
  let calls = 0;
  const handler = createMetadataRuntime(name => values()[name], async () => json(++calls === 1 ? { id: subject, is_anonymous: false } : false));
  const response = await handler(request());
  assert.equal(response.status, 403); assert.equal(calls, 2);
  assert.equal(response.headers.get('cache-control'), 'no-store');
});
