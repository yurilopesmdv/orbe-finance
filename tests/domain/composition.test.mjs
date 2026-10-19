import test from 'node:test';
import assert from 'node:assert/strict';
import { portfolioComposition } from '../../src/domain/composition.ts';
import { demoComposition, demoCompositionInstitution } from '../../src/data/demo/composition.ts';
const asset = (patch = {}) => ({ id: 'account', currency: 'BRL', amountCents: 1000, asOf: '2026-10-19', kind: 'asset', relation: 'distinct', ...patch });
const tag = (institution = 'bradesco', assetClass = 'account') => ({ institution, assetClass });
const total = groups => groups.reduce((sum, group) => sum + group.amountCents, 0);
const shares = groups => groups.reduce((sum, group) => sum + group.shareBasisPoints, 0);

test('demo groups reconcile to the same known subtotal and each share allocation closes exactly', () => {
  const result = demoComposition(); assert.equal(result.subtotalCents, 1550000); assert.equal(result.partial, true);
  assert.equal(total(result.institutions), result.subtotalCents); assert.equal(total(result.classes), result.subtotalCents);
  assert.equal(shares(result.institutions), 10000); assert.equal(shares(result.classes), 10000);
  assert.deepEqual(result.institutions.map(group => group.shareBasisPoints), [8387, 1613]);
  assert.deepEqual(result.classes.map(group => group.shareBasisPoints), [6774, 3226]);
});

test('included reserve goal allocation and credit limit never add value', () => {
  const rows = [asset(), asset({ id: 'reserve', amountCents: 200, relation: 'included', includedIn: 'account' }), asset({ id: 'goal', amountCents: 100, kind: 'allocation', relation: 'included', includedIn: 'account' }), asset({ id: 'limit', amountCents: 10000, kind: 'credit_limit' })];
  const result = portfolioComposition(rows, { account: tag(), reserve: tag(), goal: tag(), limit: tag() });
  assert.equal(result.subtotalCents, 1000); assert.equal(total(result.institutions), 1000); assert.equal(result.classes.length, 1);
});

test('unknown null negative and unresolved inclusion remain partial without invented value', () => {
  const rows = [asset(), asset({ id: 'missing', amountCents: null }), asset({ id: 'negative', amountCents: -100 }), asset({ id: 'overlap', relation: 'unknown' }), asset({ id: 'orphan', amountCents: 100, relation: 'included', includedIn: 'absent' })];
  const result = portfolioComposition(rows, { account: tag() }); assert.equal(result.partial, true); assert.equal(result.subtotalCents, 1000); assert.equal(result.institutions[0].shareBasisPoints, 10000);
});

test('unclassified known asset is retained rather than dropped or guessed by ID', () => {
  const result = portfolioComposition([asset({ id: 'bradesco-name-is-not-evidence' })], {});
  assert.equal(result.subtotalCents, 1000); assert.equal(result.institutions[0].id, 'unclassified'); assert.equal(result.classes[0].id, 'unclassified'); assert.equal(result.partial, true);
});

test('inherited classification properties cannot claim an asset', () => {
  const classification = Object.create({ constructor: tag('nubank', 'investment') });
  const result = portfolioComposition([asset({ id: 'constructor' })], classification);
  assert.equal(result.institutions[0].id, 'unclassified'); assert.equal(result.classes[0].id, 'unclassified');
});

test('largest remainders close three equal shares with a deterministic input-independent tie break', () => {
  const rows = [asset({ id: 'a', amountCents: 1 }), asset({ id: 'b', amountCents: 1 }), asset({ id: 'c', amountCents: 1 })];
  const classification = { a: tag('bradesco', 'account'), b: tag('inter', 'investment'), c: tag('mercado-pago', 'other') };
  const result = portfolioComposition(rows, classification); assert.deepEqual(result.institutions.map(group => group.shareBasisPoints), [3334, 3333, 3333]); assert.equal(shares(result.classes), 10000);
  assert.deepEqual(portfolioComposition([...rows].reverse(), classification), result);
});

test('zero base and empty known set never produce NaN or fabricated zero percentage', () => {
  const result = portfolioComposition([asset({ amountCents: 0 })], { account: tag() });
  assert.equal(result.subtotalCents, 0); assert.equal(result.institutions[0].shareBasisPoints, null);
  assert.equal(portfolioComposition([], {}).institutions.length, 0);
});

test('foreign currency stays separate and malformed currency is rejected', () => {
  const result = portfolioComposition([asset(), asset({ id: 'usd', currency: 'USD', amountCents: 5000 })], { account: tag(), usd: tag('inter') });
  assert.equal(result.subtotalCents, 1000); assert.deepEqual(result.otherCurrencies, ['USD']); assert.equal(result.institutions.length, 1);
  assert.throws(() => portfolioComposition([asset({ currency: 'not-a-currency' })], {}), /invalid_composition_currency/);
});

test('malformed classification is rejected and extra private payloads are never projected', () => {
  for (const value of [null, [], { institution: { private: 'invented' }, assetClass: 'account' }, tag('bradesco', 'invalid')]) assert.throws(() => portfolioComposition([asset()], { account: value }), /invalid_asset_classification/);
  const result = portfolioComposition([asset({ raw: 'invented-private-source' })], { account: { ...tag(), raw: 'invented-private-tag' } });
  assert.ok(!JSON.stringify(result).includes('invented-private')); assert.ok(Object.isFrozen(result)); assert.ok(Object.isFrozen(result.institutions[0]));
});

test('duplicates count once and conflicting canonical records fail closed', () => {
  assert.equal(portfolioComposition([asset(), asset()], { account: tag() }).subtotalCents, 1000);
  assert.throws(() => portfolioComposition([asset(), asset({ amountCents: 2 })], { account: tag() }), /conflicting_component/);
});

test('source dates and missing dates propagate to composition quality', () => {
  const result = portfolioComposition([asset(), asset({ id: 'older', asOf: '2026-10-18' }), asset({ id: 'undated', asOf: null })], { account: tag(), older: tag(), undated: tag() });
  assert.equal(result.mixedDates, true); assert.equal(result.partial, true); assert.deepEqual(result.asOfDates, ['2026-10-18', '2026-10-19']);
});

test('extreme safe totals remain exact through grouping and ratio allocation', () => {
  const result = portfolioComposition([asset({ amountCents: Number.MAX_SAFE_INTEGER - 1 }), asset({ id: 'cent', amountCents: 1 })], { account: tag(), cent: tag('inter') });
  assert.equal(result.subtotalCents, Number.MAX_SAFE_INTEGER); assert.equal(total(result.institutions), Number.MAX_SAFE_INTEGER); assert.equal(shares(result.institutions), 10000);
});

test('composition demo filters never broaden unknown or array institution values', () => {
  assert.equal(demoCompositionInstitution('all'), undefined); assert.equal(demoCompositionInstitution('bradesco'), 'bradesco');
  for (const value of ['unknown', ['bradesco'], {}, null]) assert.equal(demoCompositionInstitution(value), null);
  assert.equal(demoComposition('bradesco').subtotalCents, 1300000);
});
