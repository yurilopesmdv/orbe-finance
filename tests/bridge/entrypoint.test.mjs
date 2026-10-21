import test from 'node:test';
import assert from 'node:assert/strict';

test('entrypoint serves only disabled handler without reading host env or performing network', async () => {
  let handler;
  const previousDeno = globalThis.Deno;
  const previousFetch = globalThis.fetch;
  globalThis.Deno = {
    serve(value) { handler = value; },
    env: { get(name) { assert.equal(name, 'ORBE_OWNER_LIVE_RELEASE'); return undefined; } },
  };
  globalThis.fetch = () => { throw new Error('network_must_not_be_called'); };
  try {
    await import('../../supabase/functions/orbe-bridge/index.mjs');
    const forbiddenRequest = new Proxy({}, { get() { throw new Error('request_must_not_be_read'); } });
    const response = await handler(forbiddenRequest);
    assert.equal(response.status, 503);
    assert.equal(response.headers.get('cache-control'), 'no-store');
    assert.deepEqual(await response.json(), { error: 'unavailable' });
  } finally {
    globalThis.fetch = previousFetch;
    if (previousDeno === undefined) delete globalThis.Deno; else globalThis.Deno = previousDeno;
  }
});
