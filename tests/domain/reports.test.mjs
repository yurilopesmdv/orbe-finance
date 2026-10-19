import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spendingReport } from '../../src/data/local/reports.ts';
import { demoMovements } from '../../src/data/demo/scenario.ts';
import { queryMovements } from '../../src/data/local/query.ts';
const report = (data = demoMovements, filters = {}, complete = true) => spendingReport(data, { month: '2026-10', ...filters }, complete);
test('sum of net categories agrees with report and filtered detail', () => {
  const result = report(); assert.equal(result.summary.netCents, 95000);
  assert.equal(result.categories.reduce((total, group) => total + group.summary.netCents, 0), result.summary.netCents);
  for (const group of result.categories) assert.equal(group.summary.netCents, queryMovements(demoMovements, { month: '2026-10', categoryId: group.categoryId, limit: 1 }, true).summary.netCents);
});
test('report aggregation is never limited to first page', () => {
  const rows = Array.from({ length: 201 }, (_, i) => ({ ...demoMovements[0], externalId: String(i), amountCents: 1 }));
  const result = report(rows); assert.equal(result.totalCount, 201); assert.equal(result.summary.netCents, 201); assert.equal(result.categories[0].summary.netCents, 201);
});
test('both legs of transfer remain separate and do not inflate consumption', () => {
  const transfer = demoMovements.find(m => m.type === 'own_transfer');
  const result = report([transfer, { ...transfer, externalId: 'incoming', accountId: 'mp-account', direction: 'credit' }]);
  assert.equal(result.summary.netCents, 0); assert.equal(result.types[0].creditCents, 250000); assert.equal(result.types[0].debitCents, 250000);
});
test('pending and cancelled remain distinct from posted totals', () => {
  const row = demoMovements[0]; const result = report([row, { ...row, externalId: 'pending', status: 'pending' }, { ...row, externalId: 'cancelled', status: 'cancelled' }]);
  assert.equal(result.types[0].postedCount, 1); assert.equal(result.types[0].pendingCount, 1); assert.equal(result.types[0].cancelledCount, 1); assert.equal(result.summary.netCents, row.amountCents);
});
test('uncategorized unknown value remains visible and incomplete', () => {
  const result = report([{ ...demoMovements[0], categoryId: null, amountCents: null }]); assert.equal(result.categories[0].categoryId, null); assert.equal(result.types[0].missingAmountCount, 1); assert.equal(result.summary.partial, true);
});
test('global incomplete source remains incomplete in every category', () => {
  const result = report(demoMovements, {}, false); assert.equal(result.summary.partial, true); assert.ok(result.categories.every(g => g.summary.partial)); assert.ok(result.types.every(g => g.partial));
});
test('currency, institution and month match list filters', () => {
  const result = report([...demoMovements, { ...demoMovements[0], externalId: 'usd', currency: 'USD' }], { institutionId: 'mercado-pago' }); assert.equal(result.summary.netCents, 10000); assert.equal(result.totalCount, 1);
  assert.equal(report(demoMovements, { month: '2026-09' }).totalCount, 0);
});
test('duplicates deduplicate and conflicts fail before aggregate filtering', () => {
  assert.equal(report([...demoMovements, demoMovements[0]]).summary.netCents, 95000);
  assert.throws(() => report([demoMovements[0], { ...demoMovements[0], amountCents: 1 }], { institutionId: 'other' }), /conflicting_movement/);
});
