import { test } from 'node:test';
import assert from 'node:assert/strict';
import { MemoryAssets } from '../../src/data/local/assets.ts';
const scope = { connectionId: 'connection', institutionId: 'bradesco', product: 'account' };
const asset = { ...scope, ownerSubject: 'owner', id: 'account', currency: 'BRL', amountCents: 100000, asOf: '2026-10-19', kind: 'asset', relation: 'distinct' };
const reserve = { ...asset, id: 'reserve', product: 'reserve', amountCents: 20000, relation: 'included', includedIn: 'account' };
function fixture() {
  let principal = { subject: 'owner', generation: 1, unlocked: true };
  const repository = new MemoryAssets(() => principal);
  const promote = (items = [asset], params = scope, complete = true, authoritative = true) => repository.promote(repository.beginImport(params), items, complete, authoritative);
  return { repository, promote, principal: value => { principal = value; } };
}
const list = repository => repository.list({}, true);
test('account and included reserve count once across product snapshots', () => { const f = fixture(); f.promote(); f.promote([reserve], { ...scope, product: 'reserve' }); const result = list(f.repository); assert.equal(result.summary.subtotalCents, 100000); assert.equal(result.summary.partial, false); });
test('orphan reserve stays partial until its parent is received', () => { const f = fixture(); f.promote([reserve], { ...scope, product: 'reserve' }); assert.equal(list(f.repository).summary.partial, true); f.promote(); assert.equal(list(f.repository).summary.partial, false); });
test('partial conflicting or cyclic update preserves prior snapshot', () => {
  const f = fixture(); f.promote(); assert.throws(() => f.promote([{ ...asset, amountCents: 1 }], scope, false), /incomplete_batch/);
  assert.throws(() => f.promote([asset, { ...asset, amountCents: 2 }]), /conflicting_component/);
  assert.throws(() => f.promote([{ ...asset, relation: 'included', includedIn: 'account' }]), /cyclic_inclusion/); assert.equal(list(f.repository).summary.subtotalCents, 100000);
});
test('empty non-authoritative read retains values as partial; authoritative empty removes them', () => { const f = fixture(); f.promote(); f.promote([], scope, true, false); assert.equal(list(f.repository).summary.subtotalCents, 100000); assert.equal(list(f.repository).summary.partial, true); f.promote([]); assert.equal(list(f.repository).items.length, 0); assert.equal(list(f.repository).summary.partial, false); });
test('removing a confirmed parent never turns reserve into extra assets', () => { const f = fixture(); f.promote(); f.promote([reserve], { ...scope, product: 'reserve' }); f.promote([]); const result = list(f.repository); assert.equal(result.summary.subtotalCents, 0); assert.equal(result.summary.partial, true); });
test('older ticket cannot overwrite a newer snapshot', () => { const f = fixture(), old = f.repository.beginImport(scope), recent = f.repository.beginImport(scope); f.repository.promote(recent, [{ ...asset, amountCents: 200000 }], true, true); assert.throws(() => f.repository.promote(old, [asset], true, true), /stale_import/); assert.equal(list(f.repository).summary.subtotalCents, 200000); });
test('owner changes and foreign-owned inputs are denied', () => { const f = fixture(); assert.throws(() => f.promote([{ ...asset, ownerSubject: 'other' }]), /owner_mismatch/); f.promote(); f.principal({ subject: 'other', generation: 1, unlocked: true }); assert.throws(() => list(f.repository), /repository_locked/); });
test('cross-connection inclusion and identity aliasing are rejected', () => {
  const f = fixture(); f.promote(); const otherScope = { connectionId: 'other', institutionId: 'mercado-pago', product: 'reserve' };
  assert.throws(() => f.promote([{ ...reserve, ...otherScope }], otherScope), /cross_connection_inclusion/);
  assert.throws(() => f.promote([{ ...asset, ...otherScope }], otherScope), /asset_identity_conflict/);
});
test('currencies and unknown values stay explicit and copies omit owner/extra data', () => {
  const f = fixture(); f.promote([asset, { ...asset, id: 'usd', currency: 'USD', amountCents: 2500, unusedPII: 'invented-only' }, { ...asset, id: 'unknown', amountCents: null }]);
  const result = list(f.repository); assert.equal(result.summary.subtotalCents, 100000); assert.equal(result.summary.partial, true); assert.equal(f.repository.list({ currency: 'USD' }, true).summary.subtotalCents, 2500);
  assert.equal('ownerSubject' in result.items[0], false); assert.equal('unusedPII' in result.items.find(a => a.id === 'usd'), false); result.items[0].amountCents = 1; assert.equal(list(f.repository).summary.subtotalCents, 100000);
});
test('unknown source completeness defaults partial and closed store exposes nothing', () => { const f = fixture(); f.promote(); assert.equal(f.repository.list().summary.partial, true); f.repository.close(); assert.throws(() => list(f.repository), /repository_locked/); });
