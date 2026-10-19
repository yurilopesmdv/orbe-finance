import test from 'node:test';
import assert from 'node:assert/strict';
import { compareMonths } from '../../src/domain/comparison.ts';
const observation = (month, netCents, patch = {}) => ({ month, currency: 'BRL', netCents, coverage: 'complete', observedAt: '2026-11-01', ...patch });
const compare = (current, previous, patchCurrent = {}, patchPrevious = {}) => compareMonths(observation('2026-10', current, patchCurrent), observation('2026-09', previous, patchPrevious));

test('complete closed periods compare exact expense difference and percentage', () => {
  const result = compare(12500, 10000);
  assert.equal(result.deltaCents, 2500); assert.equal(result.percentageBasisPoints, 2500); assert.equal(result.percentageUnavailableReason, null); assert.equal(result.partial, false);
});

test('decrease and complete zero current keep meaningful negative percentage', () => {
  assert.equal(compare(7500, 10000).percentageBasisPoints, -2500);
  assert.equal(compare(0, 10000).percentageBasisPoints, -10000);
});

test('zero or negative base never produces infinity or an invented ratio', () => {
  for (const base of [0, -1000]) {
    const result = compare(500, base); assert.equal(result.deltaCents, 500 - base);
    assert.equal(result.percentageBasisPoints, null); assert.equal(result.percentageUnavailableReason, 'base_non_positive'); assert.equal(result.partial, false);
  }
});

test('negative current net consumption is not presented as ordinary percentage reduction', () => {
  const result = compare(-500, 1000); assert.equal(result.deltaCents, -1500); assert.equal(result.percentageBasisPoints, null); assert.equal(result.percentageUnavailableReason, 'negative_current');
});

test('missing history remains unknown instead of zero', () => {
  const result = compare(1000, null, {}, { coverage: 'missing', observedAt: null });
  assert.equal(result.deltaCents, null); assert.equal(result.previous.netCents, null); assert.equal(result.percentageUnavailableReason, 'missing_observation'); assert.equal(result.partial, true);
});

test('partial unknown amount is different from known partial subtotal', () => {
  const missing = compare(null, 1000, { coverage: 'partial' }); assert.equal(missing.deltaCents, null); assert.equal(missing.percentageUnavailableReason, 'missing_value');
  const known = compare(1200, 1000, { coverage: 'partial' }); assert.equal(known.deltaCents, 200); assert.equal(known.percentageBasisPoints, null); assert.equal(known.percentageUnavailableReason, 'partial_period');
});

test('current month remains open even if caller claims complete coverage', () => {
  const result = compare(1200, 1000, { observedAt: '2026-10-19' });
  assert.equal(result.deltaCents, 200); assert.equal(result.partial, true); assert.equal(result.percentageUnavailableReason, 'open_period');
});

test('period closure uses Brasilia rather than UTC at month boundary', () => {
  const result = compare(1200, 1000, { observedAt: '2026-11-01T01:00:00Z' });
  assert.equal(result.percentageBasisPoints, null); assert.equal(result.percentageUnavailableReason, 'open_period');
  assert.equal(compare(1200, 1000, { observedAt: '2026-11-01T03:00:00Z' }).percentageBasisPoints, 2000);
});

test('unknown source observation date prevents percentage while preserving known difference', () => {
  const result = compare(1200, 1000, { observedAt: null });
  assert.equal(result.deltaCents, 200); assert.equal(result.partial, true); assert.equal(result.percentageUnavailableReason, 'undated_period');
});

test('year transition accepts consecutive months but reordered or skipped months fail', () => {
  const current = observation('2026-01', 100, { observedAt: '2026-02-01' });
  const previous = observation('2025-12', 50, { observedAt: '2026-01-01' });
  assert.equal(compareMonths(current, previous).percentageBasisPoints, 10000);
  assert.throws(() => compareMonths(previous, current), /comparison_period_order/);
  assert.throws(() => compareMonths(current, { ...previous, month: '2025-11' }), /comparison_period_order/);
});

test('currency and malformed amounts dates or coverage fail closed', () => {
  for (const patch of [{ currency: 'USD' }, { netCents: NaN }, { netCents: 0.1 }, { observedAt: '2026-02-30' }, { observedAt: '2026-11-01T24:00:00Z' }, { month: '2026-13' }, { coverage: 'invented' }, { coverage: 'missing', netCents: 0, observedAt: null }, { coverage: 'complete', netCents: null }, { observedAt: '2026-08-01' }]) assert.throws(() => compare(1000, 1000, patch));
});

test('ratio rounds exact half away from zero at two percentage decimals', () => {
  assert.equal(compare(20001, 20000).percentageBasisPoints, 1);
  assert.equal(compare(19999, 20000).percentageBasisPoints, -1);
  assert.equal(compare(2, 3).percentageBasisPoints, -3333);
});

test('safe integer limits do not lose cents or silently overflow difference and ratio', () => {
  const max = Number.MAX_SAFE_INTEGER;
  assert.equal(compare(max, max - 1).deltaCents, 1);
  const difference = compare(max, -max); assert.equal(difference.deltaCents, null); assert.equal(difference.percentageUnavailableReason, 'out_of_range');
  const ratio = compare(max, 1); assert.equal(ratio.deltaCents, max - 1); assert.equal(ratio.percentageBasisPoints, null); assert.equal(ratio.percentageUnavailableReason, 'out_of_range');
});

test('canonical frozen output never promotes arbitrary fields or caller mutation', () => {
  const input = observation('2026-10', 1000, { privatePayload: { token: 'invented-canary' } });
  const result = compareMonths(input, observation('2026-09', 500)); input.netCents = 999;
  assert.equal(result.current.netCents, 1000); assert.ok(Object.isFrozen(result)); assert.ok(Object.isFrozen(result.current));
  assert.ok(!JSON.stringify(result).includes('invented-canary')); assert.equal('privatePayload' in result.current, false);
});
