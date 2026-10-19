import test from 'node:test';
import assert from 'node:assert/strict';
import { demoComparisonFilters, demoMonthComparison } from '../../src/data/demo/comparison.ts';
import { demoMovements } from '../../src/data/demo/scenario.ts';
import { selectMovements } from '../../src/data/local/query.ts';

test('demo route preserves account type and category filters including all', () => {
  const selected = demoComparisonFilters({ month: '2026-10', institution: 'bradesco', account: 'bradesco-account', type: 'expense', category: 'food' });
  assert.equal(selected.accountId, 'bradesco-account'); assert.equal(selected.type, 'expense'); assert.equal(selected.categoryId, 'food');
  const all = demoComparisonFilters({ month: '2026-10', institution: 'all', account: 'all', type: 'all', category: 'all' });
  assert.equal(all.categoryId, undefined); assert.equal(all.institutionId, undefined);
});

test('unknown route filters arrays extra values and mismatched bank/account never broaden selection', () => {
  const base = { month: '2026-10', institution: 'all', category: 'all' };
  for (const patch of [{ month: '2026-08' }, { month: ['2026-10'] }, { account: 'unknown' }, { type: 'unknown-type' }, { category: ['all'] }, { category: 'unknown' }, { scopeCategory: 'all' }, { token: 'invented' }, { institution: 'bradesco', account: 'mp-account' }]) assert.equal(demoComparisonFilters({ ...base, ...patch }), null);
});

test('October partial and explicitly complete empty September yield known observed difference without percentage', () => {
  const result = demoMonthComparison(demoMovements, { month: '2026-10' });
  assert.equal(result.current.netCents, 95000); assert.equal(result.previous.netCents, 0);
  assert.equal(result.current.coverage, 'partial'); assert.equal(result.previous.coverage, 'complete');
  assert.equal(result.deltaCents, 95000); assert.equal(result.percentageBasisPoints, null); assert.equal(result.percentageUnavailableReason, 'open_period');
});

test('August stays missing rather than becoming a queried empty history', () => {
  const result = demoMonthComparison(demoMovements, { month: '2026-09' });
  assert.equal(result.current.netCents, 0); assert.equal(result.previous.month, '2026-08'); assert.equal(result.previous.netCents, null);
  assert.equal(result.previous.coverage, 'missing'); assert.equal(result.deltaCents, null); assert.equal(result.percentageUnavailableReason, 'missing_observation');
});

test('comparison uses the same canonical selection and respects manual classification', () => {
  const filters = { month: '2026-10', institutionId: 'bradesco', accountId: 'bradesco-account', categoryId: 'food', type: 'expense' };
  const current = demoMonthComparison(demoMovements, filters);
  assert.equal(current.current.netCents, selectMovements(demoMovements, filters, true).summary.netCents); assert.equal(current.current.netCents, 20000);
  const corrected = demoMovements.map(m => m.externalId === 'market' ? { ...m, type: 'own_transfer' } : m);
  assert.equal(demoMonthComparison(corrected, filters).current.netCents, 0);
});

test('unavailable selected amounts stay null and unsupported currency or month is rejected', () => {
  const noAmounts = demoMovements.map(m => ({ ...m, amountCents: null }));
  assert.equal(demoMonthComparison(noAmounts, { month: '2026-10' }).current.netCents, null);
  assert.throws(() => demoMonthComparison(demoMovements, { month: '2026-10', currency: 'USD' }), /invalid_demo_comparison/);
  assert.throws(() => demoMonthComparison(demoMovements, { month: '2026-08' }), /invalid_demo_comparison/);
});
