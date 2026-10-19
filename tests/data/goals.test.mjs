import { test } from 'node:test';
import assert from 'node:assert/strict';
import { MemoryGoals } from '../../src/data/local/goals.ts';
import { reconcilePortfolio } from '../../src/domain/portfolio.ts';
const root = { id: 'root', currency: 'BRL', amountCents: 100000, asOf: '2026-10-19', kind: 'asset', relation: 'distinct' };
const budget = { ownerSubject: 'owner', root, revision: 1, allocatableCents: 80000, sourceReservesExcluded: true };
function fixture() {
  let principal = { subject: 'owner', generation: 1, unlocked: true }; const goals = new MemoryGoals(() => principal);
  for (const id of ['a','b']) goals.createGoal({ ownerSubject: 'owner', id, title: 'Meta inventada ' + id, currency: 'BRL', targetCents: 100000 });
  goals.setBudget(budget); return { goals, principal: next => { principal = next; } };
}
test('concurrent calls cannot allocate more than explicit unreserved budget', async () => {
  const { goals } = fixture(); const results = await Promise.allSettled(['a','b'].map(id => Promise.resolve().then(() => goals.allocate(id, 'root', 60000, 1))));
  assert.equal(results.filter(r => r.status === 'fulfilled').length, 1); assert.equal(goals.list().budgets[0].assignedCents, 60000);
});
test('local allocations never add money to portfolio or duplicate source reserve', () => {
  const { goals } = fixture(); goals.allocate('a', 'root', 60000, 1); const reserve = { ...root, id: 'reserve', amountCents: 20000, relation: 'included', includedIn: 'root' };
  assert.equal(reconcilePortfolio([root,reserve,...goals.virtualComponents()]).subtotalCents, 100000); assert.equal(goals.list().goals[0].allocatedCents, 60000);
});
test('unknown amount date or reservation treatment blocks increases', () => {
  for (const patch of [{ allocatableCents: null }, { root: { ...root, asOf: null } }, { sourceReservesExcluded: false }]) { const { goals } = fixture(); goals.setBudget({ ...budget, ...patch, revision: 2 }); assert.throws(() => goals.allocate('a','root',1,2), /allocation_unavailable/); }
});
test('included assets and credit limits cannot create a second budget', () => {
  const { goals } = fixture(); for (const patch of [{ relation: 'included', includedIn: 'parent' }, { kind: 'credit_limit' }]) assert.throws(() => goals.setBudget({ ...budget, root: { ...root, ...patch } }), /noncanonical_goal_root/);
});
test('source decrease preserves assignments, marks excess and allows reduction', () => {
  const { goals } = fixture(); goals.allocate('a','root',60000,1); goals.setBudget({ ...budget, revision: 2, allocatableCents: 30000 }); assert.equal(goals.list().budgets[0].overallocated, true); assert.equal(goals.list().goals[0].allocatedCents,60000);
  assert.throws(() => goals.allocate('b','root',1,2), /allocation_exceeds_budget/); goals.allocate('a','root',50000,2); goals.allocate('a','root',20000,2); assert.equal(goals.list().budgets[0].overallocated, false);
});
test('unknown new source still allows local unlinking without bank action', () => { const { goals } = fixture(); goals.allocate('a','root',10000,1); goals.setBudget({ ...budget, revision: 2, allocatableCents: null }); goals.allocate('a','root',0,2); assert.equal(goals.list().budgets[0].assignedCents,0); });
test('stale versions and changed content at same version are rejected', () => {
  const { goals } = fixture(); goals.setBudget({ ...budget, revision: 2 }); assert.throws(() => goals.allocate('a','root',1000,1), /stale_goal_budget/); assert.throws(() => goals.setBudget({ ...budget, revision: 2, allocatableCents: 1 }), /goal_budget_version_conflict/); assert.throws(() => goals.setBudget(budget), /stale_goal_budget/);
});
test('currency mismatch never converts or mixes allocation', () => { const { goals } = fixture(); goals.createGoal({ ownerSubject: 'owner', id: 'usd', title: 'Meta USD', currency: 'USD', targetCents: 100 }); assert.throws(() => goals.allocate('usd','root',100,1), /currency_mismatch/); });
test('deleting goal releases association without changing imported asset', () => { const { goals } = fixture(); goals.allocate('a','root',10000,1); goals.deleteGoal('a'); assert.equal(goals.list().budgets[0].assignedCents,0); assert.equal(root.amountCents,100000); });
test('another owner or generation cannot read aggregate or write', () => { const f = fixture(); assert.throws(() => f.goals.createGoal({ ownerSubject: 'other', id: 'x', title: 'Other', currency: 'BRL', targetCents: 1 }), /owner_mismatch/); f.principal({ subject: 'owner', generation: 2, unlocked: true }); assert.throws(() => f.goals.list(), /repository_locked/); });
test('returned state cannot mutate budgets or allocations', () => { const { goals } = fixture(); goals.allocate('a','root',1000,1); const result = goals.list(); result.goals[0].allocations[0].amountCents = 1; result.budgets[0].allocatableCents = 999999; assert.equal(goals.list().goals[0].allocatedCents,1000); assert.equal(goals.list().budgets[0].allocatableCents,80000); });
test('negative and unsafe amounts invalid goals and inferred budget overflow are refused', () => { const { goals } = fixture(); assert.throws(() => goals.allocate('a','root',-1,1), /negative_allocation/); assert.throws(() => goals.allocate('a','root',Number.MAX_SAFE_INTEGER + 1,1), /invalid_cents/); assert.throws(() => goals.setBudget({ ...budget, revision: 2, allocatableCents: 100001 }), /invalid_goal_budget/); assert.throws(() => goals.createGoal({ ownerSubject: 'owner', id: 'bad', title: 'Bad', currency: 'BRL', targetCents: 0 }), /invalid_goal/); });
