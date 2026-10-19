import test from 'node:test';
import assert from 'node:assert/strict';
import { runReadBatch } from '../../src/features/sync/read-batch.ts';
import { MemoryAssets } from '../../src/data/local/assets.ts';
const now = Date.now();
const id = '10000000-0000-4000-8000-000000000001', leaseId = '20000000-0000-4000-8000-000000000001';
const metadata = patch => ({ id, institution: 'bradesco', state: 'active', revision: 1, capabilities: { accounts: true, transactions: false, investments: null, reserves: false }, openFinanceVerifiedAt: new Date(now - 86400000).toISOString(), proxyConsentExpiresAt: new Date(now + 86400000).toISOString(), bankConsentExpiresAt: null, sourceUpdatedAt: null, lastReadAt: null, ...patch });
const grant = () => ({ status: 'acquired', leaseId, revision: 1, expiresAt: new Date(now + 120000).toISOString(), nextReadAt: new Date(now + 900000).toISOString() });
const clock = { now: () => now, setTimer: (callback, ms) => setTimeout(callback, ms), clearTimer: handle => clearTimeout(handle) };
function fixture(overrides = {}, optionOverrides = {}) {
  const calls = [], staged = []; let stageCount = 0, promotions = 0, clears = 0;
  const parent = new AbortController();
  const work = (context, patch = {}, stage) => ({ receipt: { connectionId: id, revision: 1, leaseId, product: context.product, rowCount: 1, nextCursor: null, complete: true, authoritative: true, partial: false, sourceUpdatedAt: new Date(now - 1000).toISOString(), ...patch }, stage: stage ?? (signal => { assert.equal(signal.aborted, false); stageCount++; staged.push(context.product); }) });
  const ports = {
    acquire: async () => { calls.push('acquire'); return grant(); },
    readPage: async context => { calls.push(`read:${context.product}:${context.cursor}`); return work(context); },
    finalize: async () => { calls.push('finalize'); return true; },
    promote: (fresh, signal) => { fresh(); assert.equal(signal.aborted, false); calls.push('promote'); promotions++; },
    clearStaging: () => { clears++; staged.length = 0; }, ...overrides,
  };
  const options = { enabled: true, privateDataApproved: true, assertCurrent: () => {}, signal: parent.signal, clock, ...optionOverrides };
  return { ports, options, parent, calls, staged, work, stageCount: () => stageCount, promotions: () => promotions, clears: () => clears, run: raw => runReadBatch(raw ?? metadata(), ports, options) };
}

test('disabled gates touch no metadata ports session signal or clock', async () => {
  const forbidden = new Proxy({}, { get() { throw new Error('must_not_read'); } });
  assert.deepEqual(await runReadBatch(forbidden, forbidden), { status: 'disabled' });
  assert.deepEqual(await runReadBatch(forbidden, forbidden, { enabled: true, get clock() { throw new Error('must_not_read'); } }), { status: 'disabled' });
});

test('locked session is rejected before metadata or clock resolution', async () => {
  const f = fixture({}, { assertCurrent: () => { throw new Error('locked'); } });
  Object.defineProperty(f.options, 'clock', { get() { throw new Error('must_not_read'); } });
  assert.equal((await f.run()).status, 'cancelled'); assert.equal(f.calls.length, 0);
});

test('unknown expired proxy and unavailable products never acquire a lease', async () => {
  for (const patch of [{ proxyConsentExpiresAt: null }, { proxyConsentExpiresAt: new Date(now - 1).toISOString() }, { state: 'paused' }, { capabilities: { accounts: false, transactions: null, investments: null, reserves: false } }]) {
    const f = fixture(); assert.equal((await f.run(metadata(patch))).status, 'unavailable'); assert.equal(f.calls.length, 0);
  }
});

test('one shared lease covers known products pages then exactly one finalize and promotion', async () => {
  let f; f = fixture({ readPage: async context => {
    f.calls.push(`read:${context.product}:${context.cursor}`);
    return f.work(context, context.product === 'accounts' && context.cursor === null ? { complete: false, nextCursor: 'next' } : {});
  } });
  const result = await f.run(metadata({ capabilities: { accounts: true, transactions: true, investments: false, reserves: null } }));
  assert.equal(result.status, 'complete'); assert.deepEqual(result.products.map(product => [product.product, product.pages, product.rows]), [['accounts', 2, 2], ['transactions', 1, 1]]);
  assert.deepEqual(f.calls, ['acquire', 'read:accounts:null', 'read:accounts:next', 'read:transactions:null', 'finalize', 'promote']); assert.equal(f.stageCount(), 3); assert.equal(f.clears(), 1); assert.equal(f.staged.length, 0);
});

test('busy cooldown and unavailable never stage or query a page', async () => {
  for (const result of [{ status: 'busy' }, { status: 'unavailable' }, { status: 'cooldown', nextReadAt: new Date(now + 100000).toISOString() }]) {
    const f = fixture({ acquire: async () => result }); const received = await f.run(); assert.equal(received.status, result.status); assert.equal(f.stageCount(), 0); assert.equal(f.promotions(), 0); assert.equal(f.clears(), 0);
  }
});

test('foreign or contradictory page metadata fails before executing local staging', async () => {
  for (const patch of [{ connectionId: 'foreign' }, { revision: 2 }, { leaseId: 'foreign' }, { product: 'investments' }, { complete: false, nextCursor: null }, { rowCount: 1.5 }, { nextCursor: ['next'] }, { partial: 'false' }]) {
    let f; f = fixture({ readPage: async context => f.work(context, patch) }); assert.equal((await f.run()).status, 'failed'); assert.equal(f.stageCount(), 0); assert.equal(f.promotions(), 0); assert.equal(f.clears(), 1);
  }
});

test('repeated cursor fails without continuing or promoting the staged prefix', async () => {
  let f; f = fixture({ readPage: async context => f.work(context, { complete: false, nextCursor: 'same' }) });
  assert.equal((await f.run()).status, 'failed'); assert.equal(f.stageCount(), 1); assert.equal(f.promotions(), 0); assert.equal(f.clears(), 1);
});

test('row and page budgets reject traversal rather than silently truncating', async () => {
  let requests = 0, f; f = fixture({ readPage: async context => f.work(context, { rowCount: 1000, complete: false, nextCursor: String(++requests) }) });
  assert.equal((await f.run()).status, 'failed'); assert.equal(requests, 11); assert.equal(f.stageCount(), 10); assert.equal(f.promotions(), 0);
  requests = 0; f = fixture({ readPage: async context => f.work(context, { rowCount: 0, complete: false, nextCursor: String(++requests) }) });
  assert.equal((await f.run()).status, 'failed'); assert.equal(requests, 100); assert.equal(f.promotions(), 0);
});

test('finalization refusal or raw provider failure preserves cache and never echoes error', async () => {
  const denied = fixture({ finalize: async () => false }); assert.equal((await denied.run()).status, 'failed'); assert.equal(denied.promotions(), 0); assert.equal(denied.clears(), 1);
  const failed = fixture({ readPage: async () => { throw new Error('invented-private-payload https://private.invalid'); } });
  const result = await failed.run(); assert.deepEqual(result, { status: 'failed' }); assert.equal(failed.calls.includes('finalize'), false); assert.equal(failed.clears(), 1);
});

test('late read after cancellation never stages or makes another request', async () => {
  let release, entered; const ready = new Promise(resolve => { entered = resolve; }); let f;
  f = fixture({ readPage: async context => { entered(); return new Promise(resolve => { release = () => resolve(f.work(context)); }); } });
  const pending = f.run(); await ready; f.parent.abort(); assert.equal((await pending).status, 'cancelled'); release(); await new Promise(resolve => setImmediate(resolve)); assert.equal(f.stageCount(), 0); assert.equal(f.promotions(), 0); assert.equal(f.clears(), 1);
});

test('page deadline releases caller when transport ignores cancellation', async () => {
  const timers = new Map(); let index = 0, entered;
  const ready = new Promise(resolve => { entered = resolve; });
  const fake = { now: () => now, setTimer: (callback, ms) => { const id = ++index; timers.set(id, { callback, ms }); return id; }, clearTimer: id => timers.delete(id) };
  const f = fixture({ readPage: async () => { entered(); return new Promise(() => {}); } }, { clock: fake });
  const pending = f.run(); await ready; const timeout = [...timers.values()].find(timer => timer.ms === 20000); timeout.callback();
  assert.equal((await pending).status, 'failed'); assert.equal(timers.size, 0); assert.equal(f.stageCount(), 0); assert.equal(f.clears(), 1);
});

test('mixed or unknown source dates remain partial and never become authoritative', async () => {
  let f; f = fixture({ readPage: async context => f.work(context, context.cursor === null ? { complete: false, nextCursor: 'next' } : { sourceUpdatedAt: null }) });
  const result = await f.run(); assert.equal(result.status, 'complete'); assert.equal(result.products[0].partial, true); assert.equal(result.products[0].authoritative, false); assert.equal(result.products[0].sourceUpdatedAt, null);
});

test('session generation change before confirmation never promotes even if options guard is replaced', async () => {
  let current = true, f;
  f = fixture({ finalize: async () => { current = false; f.options.assertCurrent = () => {}; return true; } }, { assertCurrent: () => { if (!current) throw new Error('changed'); } });
  assert.equal((await f.run()).status, 'cancelled'); assert.equal(f.promotions(), 0); assert.equal(f.clears(), 1);
});

function assetFixture(expireDuringValidation = false) {
  let time = now; const principal = { subject: 'invented-owner', generation: 1, unlocked: true };
  const repository = new MemoryAssets(() => principal);
  const scope = { connectionId: id, institutionId: 'bradesco', product: 'account' };
  const prior = { ...scope, ownerSubject: principal.subject, id: 'invented-account', currency: 'BRL', amountCents: 100000, asOf: '2026-10-18', kind: 'asset', relation: 'distinct' };
  repository.promote(repository.beginImport(scope), [prior], true, true);
  let ticket; const staged = []; let f;
  f = fixture({
    readPage: async context => f.work(context, {}, () => {
      ticket = repository.beginImport(scope);
      const row = { ...prior, asOf: '2026-10-19', amountCents: 200000 };
      if (expireDuringValidation) Object.defineProperty(row, 'amountCents', { get() { time = now + 120001; return 200000; }, enumerable: true });
      staged.push(row);
    }),
    promote: fresh => { repository.promote(ticket, staged, true, true, fresh); },
    clearStaging: () => { staged.length = 0; if (ticket) repository.abortImport(ticket); },
  }, { clock: { ...clock, now: () => time } });
  return { f, repository, staged };
}

test('coordinator integrates complete staged product with MemoryAssets atomically', async () => {
  const { f, repository, staged } = assetFixture(); assert.equal((await f.run()).status, 'complete'); assert.equal(repository.list({}, true).summary.subtotalCents, 200000); assert.equal(staged.length, 0);
});

test('lease expiry during validation is checked before cache swap and preserves the prior valid product', async () => {
  const { f, repository, staged } = assetFixture(true); assert.equal((await f.run()).status, 'cancelled'); assert.equal(repository.list({}, true).summary.subtotalCents, 100000); assert.equal(staged.length, 0);
});

test('proxy authorization expiring during the response prevents staging even without the timer firing', async () => {
  let time = now, f;
  f = fixture({ readPage: async context => { time = now + 1001; return f.work(context); } }, { clock: { ...clock, now: () => time } });
  assert.equal((await f.run(metadata({ proxyConsentExpiresAt: new Date(now + 1000).toISOString() }))).status, 'cancelled'); assert.equal(f.stageCount(), 0); assert.equal(f.promotions(), 0); assert.equal(f.clears(), 1);
});

test('malformed or different-revision grant cannot start a page or touch staging', async () => {
  for (const patch of [{ revision: 2 }, { leaseId: 'wrong' }, { expiresAt: new Date(now - 1).toISOString() }, { nextReadAt: new Date(now + 901000).toISOString() }]) {
    const f = fixture({ acquire: async () => ({ ...grant(), ...patch }) });
    assert.equal((await f.run()).status, 'failed'); assert.equal(f.stageCount(), 0); assert.equal(f.promotions(), 0); assert.equal(f.clears(), 0);
  }
});
