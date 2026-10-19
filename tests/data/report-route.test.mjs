import { test } from 'node:test';
import assert from 'node:assert/strict';
import { demoReportFilters } from '../../src/data/demo/report-route.ts';
test('known report filters preserve period institution and uncategorized', () => {
  assert.deepEqual(demoReportFilters({ month: '2026-10', institution: 'mercado-pago', category: 'uncategorized' }), { month: '2026-10', institutionId: 'mercado-pago', categoryId: null });
});
test('unknown route filters never broaden the query silently', () => {
  for (const params of [{ month: 'bad', institution: 'all', category: 'food' }, { month: '2026-10', institution: 'other', category: 'food' }, { month: '2026-10', institution: 'all', category: 'other-owner-category' }, { month: ['2026-10'], institution: 'all', category: 'food' }, {}]) assert.equal(demoReportFilters(params), null);
});

import { spendingReport } from '../../src/data/local/reports.ts';
import { queryMovements } from '../../src/data/local/query.ts';
import { demoMovements } from '../../src/data/demo/scenario.ts';

test('account and type survive drill-down and reconcile the selected category total', () => {
  const filters = { month: '2026-10', institutionId: 'bradesco', accountId: 'bradesco-account', type: 'expense' };
  const report = spendingReport(demoMovements, filters, true);
  const category = report.categories.find(group => group.categoryId === 'food');
  const parsed = demoReportFilters({ month: filters.month, institution: filters.institutionId, account: filters.accountId, type: filters.type, category: category.categoryId });
  assert.equal(parsed.accountId, filters.accountId); assert.equal(parsed.type, 'expense');
  const detail = queryMovements(demoMovements, parsed, true);
  assert.equal(detail.summary.netCents, category.summary.netCents); assert.equal(detail.summary.netCents, 20000);
  assert.equal(detail.totalCount, 1);
});

test('unknown account, mismatched institution, unknown type arrays and extra parameters fail closed', () => {
  const base = { month: '2026-10', institution: 'bradesco', category: 'food' };
  for (const extra of [{ account: 'other-owner-account' }, { account: 'mp-account' }, { type: 'invalid' }, { account: ['bradesco-account'] }, { type: ['expense'] }, { token: 'invented' }, { scopeCategory: 'housing' }, { scopeCategory: ['food'] }]) assert.equal(demoReportFilters({ ...base, ...extra }), null);
});

test('all account/type options preserve the older route behavior without broadening malformed values', () => {
  const parsed = demoReportFilters({ month: '2026-10', institution: 'all', category: 'uncategorized', account: 'all', type: 'all', scopeCategory: 'all' });
  assert.deepEqual(parsed, { month: '2026-10', institutionId: undefined, categoryId: null });
});

test('filtered parent category is preserved for exact partiality recomputation', () => {
  const withUnknown = [...demoMovements, { ...demoMovements[0], externalId: 'unknown-other-category', categoryId: 'housing', amountCents: null }];
  const parent = { month: '2026-10', institutionId: 'bradesco', accountId: 'bradesco-account', type: 'expense', categoryId: 'food' };
  const report = spendingReport(withUnknown, parent, true);
  const parsed = demoReportFilters({ month: parent.month, institution: parent.institutionId, account: parent.accountId, type: parent.type, category: 'food', scopeCategory: 'food' });
  const { scopeCategoryId, ...detailFilters } = parsed;
  const context = spendingReport(withUnknown, { ...detailFilters, categoryId: scopeCategoryId }, true);
  assert.equal(report.summary.partial, false); assert.equal(context.summary.partial, report.summary.partial);
  assert.equal(context.summary.netCents, report.summary.netCents);
});
