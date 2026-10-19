import { assertCents, occurrenceMonth, sumCents } from '../../domain/money.ts';
import { reconcilePortfolio, type AssetComponent } from '../../domain/portfolio.ts';
import { MemoryScope, type MemoryPrincipal } from './scope.ts';
export interface LocalGoal { id: string; title: string; currency: string; targetCents: number; deadline?: string | null }
export interface OwnedGoal extends LocalGoal { ownerSubject: string }
export interface GoalBudget { ownerSubject: string; root: AssetComponent; revision: number; allocatableCents: number | null; sourceReservesExcluded: boolean }
type Budget = Omit<GoalBudget, 'ownerSubject'>;
interface Allocation { goalId: string; rootId: string; amountCents: number }
const key = (goalId: string, rootId: string) => JSON.stringify([goalId, rootId]);
const validText = (value: unknown, max = 200): value is string => typeof value === 'string' && value.trim().length > 0 && value.length <= max;
const knownBudget = (budget: Budget) => budget.allocatableCents !== null && budget.root.amountCents !== null && budget.root.amountCents >= 0 && budget.root.asOf !== null && budget.sourceReservesExcluded;
export class MemoryGoals {
  #scope: MemoryScope;
  #goals = new Map<string, LocalGoal>();
  #budgets = new Map<string, Budget>();
  #allocations = new Map<string, Allocation>();
  constructor(guard: () => MemoryPrincipal | null) { this.#scope = new MemoryScope(guard, () => { this.#goals.clear(); this.#budgets.clear(); this.#allocations.clear(); }); }
  close() { this.#scope.close(); }
  createGoal(input: OwnedGoal) {
    this.#scope.assertOwner(input.ownerSubject); assertCents(input.targetCents);
    if (!validText(input.id) || !validText(input.title, 120) || this.#goals.has(input.id) || !/^[A-Z]{3}$/.test(input.currency) || input.targetCents <= 0) throw new Error('invalid_goal');
    if (input.deadline !== undefined && input.deadline !== null) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(input.deadline)) throw new Error('invalid_goal_deadline'); occurrenceMonth(input.deadline);
    }
    this.#goals.set(input.id, { id: input.id, title: input.title.trim(), currency: input.currency, targetCents: input.targetCents, deadline: input.deadline ?? null });
  }
  setBudget(input: GoalBudget) {
    this.#scope.assertOwner(input.ownerSubject);
    if (!input.root || input.root.kind !== 'asset' || input.root.relation !== 'distinct' || input.root.includedIn) throw new Error('noncanonical_goal_root');
    if (!Number.isSafeInteger(input.revision) || input.revision < 1 || typeof input.sourceReservesExcluded !== 'boolean' || !/^[A-Z]{3}$/.test(input.root.currency)) throw new Error('invalid_goal_budget');
    reconcilePortfolio([input.root], input.root.currency);
    if (input.allocatableCents !== null) { assertCents(input.allocatableCents); if (input.allocatableCents < 0 || (input.root.amountCents !== null && input.allocatableCents > input.root.amountCents)) throw new Error('invalid_goal_budget'); }
    const root: AssetComponent = { id: input.root.id, currency: input.root.currency, amountCents: input.root.amountCents, asOf: input.root.asOf, kind: 'asset', relation: 'distinct' };
    const budget: Budget = { root, revision: input.revision, allocatableCents: input.allocatableCents, sourceReservesExcluded: input.sourceReservesExcluded };
    const prior = this.#budgets.get(root.id);
    if (prior) {
      if (budget.revision < prior.revision || (root.asOf !== null && prior.root.asOf !== null && Date.parse(root.asOf) < Date.parse(prior.root.asOf))) throw new Error('stale_goal_budget');
      if (budget.revision === prior.revision) { if (JSON.stringify(budget) !== JSON.stringify(prior)) throw new Error('goal_budget_version_conflict'); return; }
      if (root.currency !== prior.root.currency) throw new Error('currency_mismatch');
    }
    this.#budgets.set(root.id, budget);
  }
  #assigned(rootId: string, values = this.#allocations) { return sumCents([...values.values()].filter(value => value.rootId === rootId).map(value => value.amountCents)); }
  allocate(goalId: string, rootId: string, amountCents: number, expectedRevision: number) {
    this.#scope.assert(); assertCents(amountCents);
    const goal = this.#goals.get(goalId), budget = this.#budgets.get(rootId);
    if (!goal || !budget) throw new Error('goal_resource_not_found');
    if (amountCents < 0) throw new Error('negative_allocation');
    if (goal.currency !== budget.root.currency) throw new Error('currency_mismatch');
    if (budget.revision !== expectedRevision) throw new Error('stale_goal_budget');
    const id = key(goalId, rootId), previous = this.#allocations.get(id)?.amountCents ?? 0;
    if (amountCents > previous && !knownBudget(budget)) throw new Error('allocation_unavailable');
    const candidate = new Map(this.#allocations);
    if (amountCents === 0) candidate.delete(id); else candidate.set(id, { goalId, rootId, amountCents });
    const total = this.#assigned(rootId, candidate);
    if (knownBudget(budget) && total > budget.allocatableCents! && amountCents > previous) throw new Error('allocation_exceeds_budget');
    sumCents([...candidate.values()].filter(value => value.goalId === goalId).map(value => value.amountCents));
    this.#scope.assert(); this.#allocations = candidate;
  }
  deleteGoal(id: string) {
    this.#scope.assert();
    if (!this.#goals.has(id)) throw new Error('goal_resource_not_found');
    this.#goals.delete(id); for (const [allocationId, allocation] of this.#allocations) if (allocation.goalId === id) this.#allocations.delete(allocationId);
  }
  list() {
    this.#scope.assert();
    const budgets = [...this.#budgets.values()].map(budget => { const assignedCents = this.#assigned(budget.root.id); return { rootId: budget.root.id, currency: budget.root.currency, revision: budget.revision, asOf: budget.root.asOf, allocatableCents: budget.allocatableCents, assignedCents, unavailable: !knownBudget(budget), overallocated: knownBudget(budget) && assignedCents > budget.allocatableCents! }; });
    const goals = [...this.#goals.values()].map(goal => { const allocations = [...this.#allocations.values()].filter(value => value.goalId === goal.id).map(value => ({ ...value })); return { ...goal, allocatedCents: sumCents(allocations.map(value => value.amountCents)), allocations, partial: allocations.some(value => budgets.some(budget => budget.rootId === value.rootId && (budget.unavailable || budget.overallocated))) }; });
    return { goals, budgets };
  }
  virtualComponents(): AssetComponent[] {
    this.#scope.assert();
    return [...this.#allocations.values()].map(value => { const budget = this.#budgets.get(value.rootId)!; return { id: JSON.stringify(['local-goal', value.goalId, value.rootId]), currency: budget.root.currency, amountCents: value.amountCents, asOf: budget.root.asOf, kind: 'allocation', relation: 'included', includedIn: value.rootId }; });
  }
}
