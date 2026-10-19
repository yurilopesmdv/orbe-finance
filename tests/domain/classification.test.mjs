import { test } from 'node:test';
import assert from 'node:assert/strict';
import { classifyMovement } from '../../src/domain/classification.ts';
const catalog = [{ id: 'food', archived: false }, { id: 'health', archived: false }, { id: 'old', archived: true }];
const base = { description: 'Compra CAFÉ   central', accountId: 'a', direction: 'debit', provider: { categoryId: 'food', type: 'expense' } };
const rule = { id: 'r', priority: 10, contains: 'cafe central', categoryId: 'health' };
const run = (input = base, rules = []) => classifyMovement(input, catalog, rules);
test('manual category survives changed provider and rule', () => {
  const input = { ...base, override: { categoryId: 'health' } };
  assert.equal(run(input, [rule]).categoryOrigin, 'override');
  assert.equal(run({ ...input, provider: { categoryId: 'food', type: 'income' } }).categoryId, 'health');
});
test('explicit uncategorized blocks fallback without changing financial type', () => {
  const result = run({ ...base, override: { categoryId: null } }, [rule]);
  assert.equal(result.categoryId, null); assert.equal(result.categoryOrigin, 'override'); assert.equal(result.type, 'expense');
});
test('rule matches accents case and whitespace before provider', () => {
  const result = run(base, [rule]); assert.equal(result.categoryId, 'health'); assert.equal(result.categoryOrigin, 'rule');
});
test('rule winner is deterministic under reordered input', () => {
  const rules = [{ ...rule, id: 'z', categoryId: 'food' }, { ...rule, id: 'a' }];
  assert.deepEqual(run(base, rules), run(base, [...rules].reverse())); assert.equal(run(base, rules).categoryRuleId, 'a');
});
test('lower numerical priority wins', () => {
  assert.equal(run(base, [rule, { ...rule, id: 'first', priority: 1, categoryId: 'food' }]).categoryId, 'food');
});
test('account and direction constrain matching', () => {
  assert.equal(run(base, [{ ...rule, accountId: 'other' }]).categoryOrigin, 'provider');
  assert.equal(run(base, [{ ...rule, direction: 'credit' }]).categoryOrigin, 'provider');
});
test('category and type have independent provenance', () => {
  const result = run({ ...base, override: { type: 'income' } }, [rule]);
  assert.equal(result.categoryOrigin, 'rule'); assert.equal(result.typeOrigin, 'override'); assert.equal(result.type, 'income');
});
test('separate rules can supply category and type', () => {
  const result = run(base, [rule, { id: 'type', priority: 20, contains: 'cafe', type: 'refund' }]);
  assert.equal(result.categoryRuleId, 'r'); assert.equal(result.typeRuleId, 'type'); assert.equal(result.type, 'refund');
});
test('archived category retained in historical override', () => {
  assert.equal(run({ ...base, override: { categoryId: 'old' } }).categoryId, 'old');
});
test('archived automatic and missing categories require review', () => {
  for (const categoryId of ['old', 'missing']) {
    const result = run({ ...base, provider: { ...base.provider, categoryId } });
    assert.equal(result.categoryId, null); assert.equal(result.needsReview, true);
  }
});
test('missing override category blocks replacement and flags review', () => {
  const result = run({ ...base, override: { categoryId: 'removed' } }, [rule]);
  assert.equal(result.categoryOrigin, 'override'); assert.equal(result.categoryId, null); assert.equal(result.needsReview, true);
});
test('no classification remains uncategorized and unknown', () => {
  const result = run({ ...base, provider: undefined }); assert.equal(result.categoryId, null); assert.equal(result.type, 'unknown'); assert.equal(result.needsReview, true);
});
test('Pix description never confirms own transfer', () => {
  const result = run({ ...base, description: 'Pix mesma titularidade', provider: { type: 'own_transfer' } });
  assert.equal(result.type, 'unknown'); assert.equal(result.needsReview, true);
});
test('trusted source linkage or explicit override permits own transfer', () => {
  assert.equal(run({ ...base, provider: { type: 'own_transfer' }, trustedOwnTransfer: true }).type, 'own_transfer');
  assert.equal(run({ ...base, override: { type: 'own_transfer' } }).type, 'own_transfer');
});
test('automatic own transfer rule is rejected even before matching', () => {
  assert.throws(() => run(base, [{ ...rule, type: 'own_transfer' }]), /unconfirmed_transfer_rule/);
});
test('literal rule matching does not evaluate regex syntax', () => {
  assert.equal(run(base, [{ ...rule, contains: '.*' }]).categoryOrigin, 'provider');
});
test('invalid duplicate catalogs and rules fail closed', () => {
  assert.throws(() => classifyMovement(base, [...catalog, catalog[0]], []), /invalid_category_catalog/);
  assert.throws(() => run(base, [rule, rule]), /invalid_rule/);
  assert.throws(() => run(base, [{ ...rule, contains: '  ' }]), /invalid_rule/);
  assert.throws(() => run({ ...base, provider: { type: 'bogus' } }), /invalid_classification/);
});
test('inputs and rule order are not mutated', () => {
  const input = structuredClone(base), rules = [structuredClone(rule)]; const before = JSON.stringify([input, rules, catalog]);
  run(input, rules); assert.equal(JSON.stringify([input, rules, catalog]), before);
});
