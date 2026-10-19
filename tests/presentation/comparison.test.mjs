import test from 'node:test';
import assert from 'node:assert/strict';
import { percentageLabel } from '../../src/components/comparison-label.ts';

test('integer basis points render exact percentage with positive negative and subunit values', () => {
  assert.equal(percentageLabel(1234, false), '12,34%'); assert.equal(percentageLabel(-1, false), '-0,01%'); assert.equal(percentageLabel(0, false), '0,00%');
});

test('maximum safe basis points preserve their last two digits', () => {
  assert.equal(percentageLabel(Number.MAX_SAFE_INTEGER, false), '90.071.992.547.409,91%');
  assert.equal(percentageLabel(-Number.MAX_SAFE_INTEGER, false), '-90.071.992.547.409,91%');
});

test('hidden label does not reveal value sign existence or validity', () => {
  for (const value of [null, 0, -1500, Number.MAX_SAFE_INTEGER, NaN]) assert.equal(percentageLabel(value, true), 'Percentual oculto');
});

test('null and malformed percentage never become zero or infinity', () => {
  for (const value of [null, Infinity, NaN, 0.1, Number.MAX_SAFE_INTEGER + 1]) assert.equal(percentageLabel(value, false), 'Percentual indisponível');
});
