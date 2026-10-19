import { test } from 'node:test';
import assert from 'node:assert/strict';
import { demoOverview, demoAssets, demoMovements } from '../../src/data/demo/scenario.ts';
import { queryMovements } from '../../src/data/local/query.ts';
test('demo portfolio counts included reserve once and flags missing investment', () => {
  const result = demoOverview(); assert.equal(result.portfolio.subtotalCents, 1550000); assert.equal(result.portfolio.partial, true); assert.ok(!result.portfolio.countedIds.includes('bradesco-reserve')); assert.equal(demoAssets.length, 5);
});
test('overview expenses agree with detail and exclude own transfer', () => {
  const summary = demoOverview().expenses; assert.equal(summary.netCents, 95000); assert.equal(summary.grossCents, 100000); assert.equal(summary.refundCents, 5000);
  assert.deepEqual(summary, queryMovements(demoMovements, { month: '2026-10', limit: 1 }, true).summary);
});

test('institution subsets preserve parent and reserve relation', async () => {
  const { demoPortfolio } = await import('../../src/data/demo/scenario.ts');
  const bradesco = demoPortfolio('bradesco'), mp = demoPortfolio('mercado-pago');
  assert.equal(bradesco.summary.subtotalCents, 1300000); assert.equal(bradesco.summary.partial, false);
  assert.equal(mp.summary.subtotalCents, 250000); assert.equal(mp.summary.partial, true);
  assert.equal(demoPortfolio().summary.subtotalCents, bradesco.summary.subtotalCents + mp.summary.subtotalCents);
});
