import test from 'node:test';
import assert from 'node:assert/strict';

async function boot(configuration, verify) {
  let handler; const reads = []; const previousDeno = globalThis.Deno; const previousFetch = globalThis.fetch;
  globalThis.Deno = { env: { get(name) { reads.push(name); return configuration[name]; } }, serve(value) { handler = value; } };
  let network = 0;
  globalThis.fetch = () => { network++; throw new Error('network_must_not_be_called'); };
  try {
    await import('../../supabase/functions/orbe-metadata/index.mjs?fixture=' + encodeURIComponent(JSON.stringify(configuration)));
    await verify(handler, reads);
    assert.equal(network, 0);
  } finally {
    globalThis.fetch = previousFetch;
    if (previousDeno === undefined) delete globalThis.Deno; else globalThis.Deno = previousDeno;
  }
}

test('metadata entrypoint defaults off with only gate read and no request/env/transport expansion', async () => {
  await boot({}, async (handler, reads) => {
    const response = await handler(new Proxy({}, { get() { throw new Error('request_read'); } }));
    assert.equal(response.status, 503); assert.equal(response.headers.get('cache-control'), 'no-store');
    assert.deepEqual(await response.json(), { error: 'unavailable' });
    assert.deepEqual(reads, ['ORBE_METADATA_ENABLED']);
  });
});

test('enabled metadata entrypoint authenticates before network or metadata access', async () => {
  await boot({ ORBE_METADATA_ENABLED: 'true', SUPABASE_URL: `https://${'a'.repeat(20)}.supabase.co`, ORBE_PUBLISHABLE_KEY: 'sb_publishable_invented' }, async (handler, reads) => {
    const response = await handler(new Request('https://metadata.invalid/orbe-metadata/connections/status', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' }));
    assert.equal(response.status, 401);
    assert.deepEqual(reads, ['ORBE_METADATA_ENABLED', 'SUPABASE_URL', 'ORBE_PUBLISHABLE_KEY']);
  });
});

test('invalid host configuration remains unavailable without exposing host values', async () => {
  await boot({ ORBE_METADATA_ENABLED: 'true', SUPABASE_URL: 'https://untrusted.invalid', ORBE_PUBLISHABLE_KEY: 'sb_secret_invented' }, async handler => {
    const response = await handler(new Proxy({}, { get() { throw new Error('request_read'); } }));
    assert.equal(response.status, 503); assert.deepEqual(await response.json(), { error: 'unavailable' });
  });
});
