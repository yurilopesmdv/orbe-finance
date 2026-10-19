import { test } from 'node:test';
import assert from 'node:assert/strict';
import { queryMovements } from '../../src/data/local/query.ts';
const expense = { source: 'demo', accountId: 'a', externalId: 'e', amountCents: 10000, currency: 'BRL', direction: 'debit', type: 'expense', status: 'posted', occurredAt: '2026-10-02', institutionId: 'bradesco', description: 'CAFÉ central', categoryId: 'food' };
const refund = { ...expense, externalId: 'r', amountCents: 2000, direction: 'credit', type: 'refund', occurredAt: '2026-10-03', reversalOf: { source: 'demo', accountId: 'a', externalId: 'e' } };
const query = (data, filters = {}, complete = true) => queryMovements(data, { month: '2026-10', ...filters }, complete);
test('page total covers entire filtered set and stable descending order', () => {
  const result = query([expense, refund], { limit: 1 });
  assert.equal(result.items[0].externalId, 'r'); assert.equal(result.totalCount, 2); assert.equal(result.nextOffset, 1); assert.equal(result.summary.netCents, 8000);
  assert.equal(query([expense, refund], { limit: 1, offset: 1 }).summary.netCents, 8000);
});
test('combined filters and normalized description preserve totals', () => {
  const result = query([expense, { ...expense, externalId: 'other', accountId: 'b' }], { accountId: 'a', institutionId: 'bradesco', categoryId: 'food', search: 'cafe' });
  assert.equal(result.totalCount, 1); assert.equal(result.summary.netCents, 10000);
});
test('explicit uncategorized remains included in expense total', () => {
  const result = query([{ ...expense, categoryId: null }, refund], { categoryId: null });
  assert.equal(result.totalCount, 1); assert.equal(result.summary.netCents, 10000);
});
test('current-month original outside type filter only validates refund', () => {
  const result = query([expense, refund], { type: 'refund' });
  assert.equal(result.items.length, 1); assert.equal(result.summary.grossCents, 0); assert.equal(result.summary.netCents, -2000); assert.equal(result.summary.partial, false);
});
test('prior-month original validates refund without appearing in page', () => {
  const result = query([{ ...expense, occurredAt: '2026-09-30' }, refund]);
  assert.equal(result.totalCount, 1); assert.equal(result.summary.netCents, -2000); assert.equal(result.summary.partial, false);
});
test('incomplete empty source is not a complete zero balance', () => {
  const result = query([], {}, false); assert.equal(result.summary.partial, true); assert.equal(result.totalCount, 0);
});
test('currencies and Sao Paulo month boundaries stay separate', () => {
  const data = [expense, { ...expense, externalId: 'usd', currency: 'USD' }, { ...expense, externalId: 'utc', occurredAt: '2026-10-01T01:00:00Z' }];
  assert.equal(query(data).totalCount, 1); assert.equal(query(data, { currency: 'USD' }).totalCount, 1);
});
test('exact duplicates deduplicate and conflicting hidden records fail', () => {
  assert.equal(query([expense, expense]).totalCount, 1);
  assert.throws(() => query([expense, { ...expense, amountCents: 200 }], { accountId: 'other' }), /conflicting_movement/);
  assert.throws(() => query([expense, { ...expense, categoryId: null }]), /conflicting_local_movement/);
});
test('stable same-day tie ordering is independent of input order', () => {
  const other = { ...expense, externalId: 'b' }; assert.deepEqual(query([expense, other]), query([other, expense]));
});
test('returned records do not mutate input including nested refund reference', () => {
  const input = structuredClone([expense, refund]); const result = query(input); result.items[0].reversalOf.accountId = 'modified'; assert.equal(input[1].reversalOf.accountId, 'a');
});
test('invalid paging and malformed source fail with generic codes', () => {
  for (const filters of [{ limit: 0 }, { limit: 101 }, { offset: -1 }, { month: 'bad' }]) assert.throws(() => query([expense], filters));
  assert.throws(() => query([{ ...expense, description: null }]), /invalid_local_movement/);
});
