import { test } from 'node:test';
import assert from 'node:assert/strict';
import { formatCents, moneyLabel } from '../../src/components/money-label.ts';
const normalize = value => value.replace(/\u00a0/g, ' ');
test('safe integer extrema retain every cent in displayed value', () => {
  assert.equal(normalize(formatCents(Number.MAX_SAFE_INTEGER)), 'R$ 90.071.992.547.409,91');
  assert.equal(normalize(formatCents(-Number.MAX_SAFE_INTEGER)), '-R$ 90.071.992.547.409,91');
});
test('small negative amounts keep sign even when whole units are zero', () => {
  assert.equal(normalize(formatCents(-1)), '-R$ 0,01'); assert.equal(normalize(formatCents(-99)), '-R$ 0,99'); assert.equal(normalize(formatCents(-101)), '-R$ 1,01');
});
test('zero cents and ordinary amounts keep two exact fractional digits', () => {
  assert.equal(normalize(formatCents(0)), 'R$ 0,00'); assert.equal(normalize(formatCents(10)), 'R$ 0,10'); assert.equal(normalize(formatCents(123456)), 'R$ 1.234,56');
});
test('explicit currency changes label, never amount or conversion', () => { assert.equal(normalize(formatCents(123456, 'USD')), 'US$ 1.234,56'); });
test('strict helper rejects unsafe or fractional money and invalid currency', () => {
  for (const value of [NaN, Infinity, 0.1, Number.MAX_SAFE_INTEGER + 1]) assert.throws(() => formatCents(value)); assert.throws(() => formatCents(1, 'invalid'), /invalid_currency/);
});
test('same UI label hides value before parsing and distinguishes unknown from zero', () => {
  assert.equal(moneyLabel(Number.MAX_SAFE_INTEGER + 1, true, 'invalid'), 'Valor oculto'); assert.equal(moneyLabel(null, false), 'Não informado'); assert.equal(moneyLabel(Infinity, false), 'Valor indisponível'); assert.equal(normalize(moneyLabel(0, false)), 'R$ 0,00');
});
