import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeConnection, connectionProducts } from '../../src/domain/connections.ts';
const now = Date.parse('2026-10-19T12:00:00Z');
const policy = { integrationEnabled: true, privateDataApproved: true, now };
const source = (patch = {}) => ({ id: '00000000-0000-4000-8000-000000000001', institution: 'bradesco', state: 'active', revision: 1,
  capabilities: { accounts: true, transactions: true, investments: true, reserves: true },
  openFinanceVerifiedAt: '2026-10-18T12:00:00Z', authorizationExpiresAt: '2026-12-19T12:00:00Z',
  sourceUpdatedAt: '2026-10-19T10:00:00-03:00', lastReadAt: '2026-10-19T11:00:00Z', ...patch });
// Baseline source clock must be before the trusted policy time.
const baseline = patch => source({ sourceUpdatedAt: '2026-10-19T08:00:00-03:00', ...patch });

test('disabled integration never touches metadata clock or private approval', () => {
  const raw = new Proxy({}, { get() { throw new Error('raw_must_not_be_read'); } });
  const settings = { get now() { throw new Error('clock_must_not_be_read'); }, get privateDataApproved() { throw new Error('gate_must_not_be_read'); } };
  const result = normalizeConnection(raw, settings); assert.equal(result.kind, 'disabled'); assert.equal(result.reason, 'integration_disabled'); assert.deepEqual(result.readableProducts, []);
});

test('private data gate remains closed without touching raw or clock', () => {
  const raw = new Proxy({}, { get() { throw new Error('raw_must_not_be_read'); } });
  const result = normalizeConnection(raw, { integrationEnabled: true, get now() { throw new Error('clock_must_not_be_read'); } });
  assert.equal(result.kind, 'disabled'); assert.equal(result.reason, 'private_data_unapproved');
});

test('eligible active source exposes only explicitly supported products', () => {
  const result = normalizeConnection(baseline(), policy);
  assert.equal(result.kind, 'connection'); assert.equal(result.state, 'active'); assert.deepEqual(result.readableProducts, [...connectionProducts]); assert.equal(result.blockedReason, null);
});

test('false and unknown capability are distinct and neither is read automatically', () => {
  const result = normalizeConnection(baseline({ capabilities: { accounts: true, transactions: false, investments: null } }), policy);
  assert.equal(result.state, 'partial'); assert.equal(result.capabilities.transactions, false); assert.equal(result.capabilities.investments, null); assert.equal(result.capabilities.reserves, null); assert.deepEqual(result.readableProducts, ['accounts']);
});

test('all unknown products do not initiate probing and all false products are unavailable', () => {
  const unknown = normalizeConnection(baseline({ capabilities: {} }), policy); assert.equal(unknown.state, 'partial'); assert.equal(unknown.blockedReason, 'capability_unknown'); assert.deepEqual(unknown.readableProducts, []);
  const unavailable = normalizeConnection(baseline({ capabilities: Object.fromEntries(connectionProducts.map(product => [product, false])) }), policy);
  assert.equal(unavailable.state, 'unsupported'); assert.equal(unavailable.blockedReason, 'products_unavailable'); assert.deepEqual(unavailable.readableProducts, []);
});

test('paused revoked pending error and renewal states always block all product reads', () => {
  for (const state of ['pending', 'paused', 'revoked', 'error', 'renewal_required']) {
    const result = normalizeConnection(baseline({ state }), policy); assert.equal(result.state, state); assert.deepEqual(result.readableProducts, []);
  }
});

test('active without original Open Finance evidence becomes unsupported', () => {
  const result = normalizeConnection(baseline({ openFinanceVerifiedAt: null }), policy);
  assert.equal(result.state, 'unsupported'); assert.equal(result.blockedReason, 'open_finance_unverified'); assert.deepEqual(result.readableProducts, []);
});

test('known expiration at the exact instant blocks reads and unknown expiration stays unknown', () => {
  const expired = normalizeConnection(baseline({ authorizationExpiresAt: new Date(now).toISOString() }), policy);
  assert.equal(expired.state, 'renewal_required'); assert.equal(expired.blockedReason, 'authorization_expired'); assert.deepEqual(expired.readableProducts, []);
  const unknown = normalizeConnection(baseline({ authorizationExpiresAt: null }), policy); assert.equal(unknown.authorizationExpiresAt, null); assert.equal(unknown.state, 'active');
});

test('source timestamp offsets normalize while future evidence and impossible dates fail closed', () => {
  assert.equal(normalizeConnection(baseline(), policy).sourceUpdatedAt, '2026-10-19T11:00:00.000Z');
  for (const patch of [{ openFinanceVerifiedAt: '2026-10-20T12:00:00Z' }, { sourceUpdatedAt: '2026-10-20T12:00:00Z' }, { lastReadAt: '2026-02-30T12:00:00Z' }, { lastReadAt: '2026-10-19T24:00:00Z' }, { lastReadAt: '2026-10-19' }]) assert.throws(() => normalizeConnection(baseline(patch), policy), /invalid_connection_metadata/);
});

test('malformed metadata and capability values cannot become active', () => {
  for (const patch of [{ id: 'wrong' }, { institution: 'wrong' }, { state: 'connected' }, { revision: 0 }, { revision: Number.MAX_SAFE_INTEGER + 1 }, { capabilities: null }, { capabilities: { accounts: 'true' } }, { capabilities: { accounts: {} } }]) assert.throws(() => normalizeConnection(baseline(patch), policy), /invalid_connection_metadata/);
  for (const value of [undefined, NaN, Infinity, -1, Number.MAX_SAFE_INTEGER]) assert.throws(() => normalizeConnection(baseline(), { ...policy, now: value }), /invalid_connection_metadata/);
});

test('capability inheritance never grants a product and inherited identity is rejected', () => {
  const result = normalizeConnection(baseline({ capabilities: Object.create({ accounts: true }) }), policy); assert.deepEqual(result.readableProducts, []); assert.equal(result.capabilities.accounts, null);
  assert.throws(() => normalizeConnection(Object.create(baseline()), policy), /invalid_connection_metadata/);
});

test('canonical frozen output never retains external identifiers private payload or caller mutation', () => {
  const raw = baseline({ owner_id: 'invented-private-owner', externalItemId: 'invented-private-item', payload: { secret: 'invented-secret' } });
  const result = normalizeConnection(raw, policy); raw.capabilities.accounts = false; raw.state = 'revoked';
  assert.equal(result.capabilities.accounts, true); assert.equal(result.state, 'active'); assert.ok(Object.isFrozen(result)); assert.ok(Object.isFrozen(result.readableProducts));
  assert.ok(!JSON.stringify(result).includes('invented-private')); assert.ok(!JSON.stringify(result).includes('invented-secret'));
});
