import { test } from 'node:test';
import assert from 'node:assert/strict';
import { calculateExpenses } from '../../src/domain/expenses.ts';
import { reconcilePortfolio } from '../../src/domain/portfolio.ts';
import { MemoryLedger } from '../../src/data/local/ledger.ts';
import { MemoryAssets } from '../../src/data/local/assets.ts';
const canary = { privatePayload: 'CANARY_NOT_TO_RETAIN' };
const ref = { source: 'demo', accountId: 'account', externalId: 'original' };
const movement = { ...ref, ownerSubject: 'owner', amountCents: 100, currency: 'BRL', direction: 'credit', type: 'refund', status: 'posted', occurredAt: '2026-10-19', institutionId: 'bradesco', description: 'Invented', categoryId: null };
const asset = { id: 'root', currency: 'BRL', amountCents: 10000, asOf: '2026-10-19', kind: 'asset', relation: 'distinct' };
const principal = () => ({ subject: 'owner', generation: 1, unlocked: true });
test('inclusion identifier rejects non-scalars without echoing raw content', () => {
  for (const includedIn of [canary, null, 123, [], '']) assert.throws(() => reconcilePortfolio([{ ...asset, id: 'child', relation: 'included', includedIn }]), error => error.message === 'invalid_inclusion_reference' && !error.message.includes('CANARY'));
});
test('reversal reference rejects non-scalars and unexpected container fields', () => {
  for (const reversalOf of [null, [], 123, { ...ref, source: canary }, { ...ref, privatePayload: canary }]) assert.throws(() => calculateExpenses([{ ...movement, reversalOf }], '2026-10'), /invalid_reversal_reference/);
});
test('malformed refund cannot promote payload or replace confirmed ledger version', () => {
  const ledger = new MemoryLedger(principal), scope = { source: 'demo', accountId: 'account', month: '2026-10' };
  ledger.promote(ledger.beginImport(scope), [{ ...movement, type: 'expense', direction: 'debit' }], true);
  assert.throws(() => ledger.promote(ledger.beginImport(scope), [{ ...movement, reversalOf: { ...ref, source: canary } }], true), /invalid_reversal_reference/);
  const result = ledger.list({ month: '2026-10' }, true); assert.equal(result.summary.netCents, 100); assert.ok(!JSON.stringify(result).includes('CANARY'));
});
test('malformed inclusion cannot enter asset snapshot or erase prior value', () => {
  const assets = new MemoryAssets(principal), scope = { connectionId: 'connection', institutionId: 'bradesco', product: 'account' };
  assets.promote(assets.beginImport(scope), [{ ...asset, ...scope, ownerSubject: 'owner' }], true, true);
  assert.throws(() => assets.promote(assets.beginImport(scope), [{ ...asset, ...scope, ownerSubject: 'owner', relation: 'included', includedIn: canary }], true, true), /invalid_inclusion_reference/);
  const result = assets.list({}, true); assert.equal(result.summary.subtotalCents, 10000); assert.ok(!JSON.stringify(result).includes('CANARY'));
});
