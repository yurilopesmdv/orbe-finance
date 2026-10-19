import { test } from 'node:test';
import assert from 'node:assert/strict';
import { applyDemoOverrides, movementKey } from '../../src/data/demo/overrides.ts';
import { demoMovements } from '../../src/data/demo/scenario.ts';
test('separate overrides survive replacement of source batch', () => {
  const id = movementKey(demoMovements[0]); const changes = { [id]: { categoryId: 'health' } };
  const reloaded = demoMovements.map(m => ({ ...m, categoryId: 'other' }));
  assert.equal(applyDemoOverrides(reloaded, changes)[0].categoryId, 'health'); assert.equal(reloaded[0].categoryId, 'other');
});
test('explicit uncategorized and corrected type are independent', () => {
  const id = movementKey(demoMovements[0]); const result = applyDemoOverrides(demoMovements, { [id]: { categoryId: null, type: 'own_transfer' } });
  assert.equal(result[0].categoryId, null); assert.equal(result[0].type, 'own_transfer'); assert.equal(demoMovements[0].type, 'expense');
});
