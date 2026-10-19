import { test } from 'node:test';
import assert from 'node:assert/strict';
import { demoReportFilters } from '../../src/data/demo/report-route.ts';
test('known report filters preserve period institution and uncategorized', () => {
  assert.deepEqual(demoReportFilters({ month: '2026-10', institution: 'mercado-pago', category: 'uncategorized' }), { month: '2026-10', institutionId: 'mercado-pago', categoryId: null });
});
test('unknown route filters never broaden the query silently', () => {
  for (const params of [{ month: 'bad', institution: 'all', category: 'food' }, { month: '2026-10', institution: 'other', category: 'food' }, { month: '2026-10', institution: 'all', category: 'other-owner-category' }, { month: ['2026-10'], institution: 'all', category: 'food' }, {}]) assert.equal(demoReportFilters(params), null);
});
