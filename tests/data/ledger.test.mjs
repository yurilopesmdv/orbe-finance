import { test } from 'node:test';
import assert from 'node:assert/strict';
import { MemoryLedger } from '../../src/data/local/ledger.ts';
const scope = { source: 'invented', accountId: 'account', month: '2026-10' };
const movement = { ...scope, ownerSubject: 'owner-one', externalId: 'one', amountCents: 10000, currency: 'BRL', direction: 'debit', type: 'expense', status: 'posted', occurredAt: '2026-10-01', institutionId: 'bradesco', description: 'Invented market', categoryId: 'food' };
function fixture() {
  let principal = { subject: 'owner-one', generation: 1, unlocked: true };
  const ledger = new MemoryLedger(() => principal);
  ledger.createCategory({ ownerSubject: 'owner-one', id: 'food', name: 'Alimentação' });
  ledger.createCategory({ ownerSubject: 'owner-one', id: 'health', name: 'Saúde' });
  const promote = (items = [movement], complete = true) => ledger.promote(ledger.beginImport(scope), items, complete);
  return { ledger, promote, principal: next => { principal = next; } };
}
const list = ledger => ledger.list({ month: '2026-10' }, true);
test('initial locked principal cannot construct a repository', () => { assert.throws(() => new MemoryLedger(() => null), /repository_locked/); assert.throws(() => new MemoryLedger(() => ({ subject: 'owner-one', generation: 1, unlocked: 'yes' })), /repository_locked/); });
test('principal or generation change purges and permanently denies old repository', () => {
  for (const next of [{ subject: 'other', generation: 1, unlocked: true }, { subject: 'owner-one', generation: 2, unlocked: true }, null]) {
    const f = fixture(); f.promote(); f.principal(next); assert.throws(() => list(f.ledger), /repository_locked/); f.principal({ subject: 'owner-one', generation: 1, unlocked: true }); assert.throws(() => list(f.ledger), /repository_locked/);
  }
});
test('foreign-owned input and category are rejected', () => { const f = fixture(); assert.throws(() => f.promote([{ ...movement, ownerSubject: 'other' }]), /owner_mismatch/); assert.throws(() => f.ledger.createCategory({ ownerSubject: 'other', id: 'foreign', name: 'Other' }), /owner_mismatch/); assert.equal(list(f.ledger).totalCount, 0); });
test('partial or conflicting batch leaves confirmed version intact', () => {
  const f = fixture(); f.promote(); assert.throws(() => f.promote([{ ...movement, amountCents: 1 }], false), /incomplete_batch/); assert.equal(list(f.ledger).summary.netCents, 10000);
  assert.throws(() => f.promote([movement, { ...movement, amountCents: 2 }]), /conflicting_movement/); assert.equal(list(f.ledger).summary.netCents, 10000);
});
test('late older import cannot replace newer result', () => { const f = fixture(), old = f.ledger.beginImport(scope), recent = f.ledger.beginImport(scope); f.ledger.promote(recent, [{ ...movement, amountCents: 20000 }], true); assert.throws(() => f.ledger.promote(old, [movement], true), /stale_import/); assert.equal(list(f.ledger).summary.netCents, 20000); });
test('scope mismatch cannot insert account or date from another batch', () => { const f = fixture(); for (const patch of [{ accountId: 'other' }, { occurredAt: '2026-09-30' }]) assert.throws(() => f.promote([{ ...movement, ...patch }]), /out_of_scope_movement/); });
test('reimport updates source but preserves manual override and absence does not delete', () => {
  const f = fixture(); f.promote(); f.ledger.setOverride(movement, { categoryId: 'health' }); f.promote([{ ...movement, categoryId: 'food', amountCents: 20000 }]);
  assert.equal(list(f.ledger).items[0].categoryId, 'health'); assert.equal(list(f.ledger).summary.netCents, 20000); f.promote([]); assert.equal(list(f.ledger).totalCount, 1);
});
test('archiving preserves historical override and blocks new assignment', () => {
  const f = fixture(); f.promote([movement, { ...movement, externalId: 'two' }]); f.ledger.setOverride(movement, { categoryId: 'health' }); f.ledger.archiveCategory('health');
  assert.equal(f.ledger.classificationFor(movement).categoryId, 'health'); assert.throws(() => f.ledger.setOverride({ ...movement, externalId: 'two' }, { categoryId: 'health' }), /category_unavailable/);
});
test('explicit uncategorized remains in total above rule/provider', () => { const f = fixture(); f.promote(); f.ledger.setRule({ ownerSubject: 'owner-one', id: 'rule', priority: 1, contains: 'market', categoryId: 'health' }); f.ledger.setOverride(movement, { categoryId: null }); const result = list(f.ledger); assert.equal(result.items[0].categoryId, null); assert.equal(result.summary.netCents, 10000); });
test('unknown and foreign category/rule cannot be assigned', () => { const f = fixture(); f.promote(); assert.throws(() => f.ledger.setOverride(movement, { categoryId: 'foreign' }), /category_unavailable/); assert.throws(() => f.ledger.setRule({ ownerSubject: 'other', id: 'rule', priority: 1, contains: 'market', categoryId: 'food' }), /owner_mismatch/); });
test('read copies and projection exclude owner and unexpected provider fields', () => { const f = fixture(); f.promote([{ ...movement, secretExtra: 'invented-extra' }]); const result = list(f.ledger); assert.equal('secretExtra' in result.items[0], false); assert.equal('ownerSubject' in result.items[0], false); result.items[0].amountCents = 1; assert.equal(list(f.ledger).summary.netCents, 10000); });
test('closed repository exposes no rows or aggregates and completeness defaults partial', () => { const f = fixture(); f.promote(); assert.equal(f.ledger.list({ month: '2026-10' }).summary.partial, true); f.ledger.close(); assert.throws(() => list(f.ledger), /repository_locked/); });

test('foreign currency is preserved without entering BRL total', () => {
  const f = fixture(); f.promote([movement, { ...movement, externalId: 'usd', currency: 'USD', amountCents: 2500 }]);
  assert.equal(list(f.ledger).summary.netCents, 10000);
  const usd = f.ledger.list({ month: '2026-10', currency: 'USD' }, true); assert.equal(usd.totalCount, 1); assert.equal(usd.summary.netCents, 2500);
});
test('cross-period duplicate requires explicit reconciliation, never last arrival', () => {
  const f = fixture(); f.promote(); const ticket = f.ledger.beginImport({ ...scope, month: '2026-09' });
  assert.throws(() => f.ledger.promote(ticket, [{ ...movement, occurredAt: '2026-09-30' }], true), /movement_period_conflict/); assert.equal(list(f.ledger).summary.netCents, 10000);
});
