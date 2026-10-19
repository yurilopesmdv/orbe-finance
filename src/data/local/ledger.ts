import { classifyMovement, type ClassificationFields, type ClassificationRule } from '../../domain/classification.ts';
import { occurrenceMonth } from '../../domain/money.ts';
import type { MovementRef } from '../../domain/expenses.ts';
import { queryMovements, selectMovements, type LocalMovement, type MovementFilters } from './query.ts';
import { MemoryScope, type MemoryPrincipal } from './scope.ts';
export type LedgerPrincipal = MemoryPrincipal;
export interface OwnedMovement extends LocalMovement { ownerSubject: string }
export interface OwnedCategory { ownerSubject: string; id: string; name: string }
export interface OwnedRule extends ClassificationRule { ownerSubject: string }
export interface ImportScope { source: string; accountId: string; month: string }
export interface ImportTicket { readonly token: symbol }
const identity = (m: MovementRef) => JSON.stringify([m.source, m.accountId, m.externalId]);
const scopeKey = (s: ImportScope) => JSON.stringify([s.source, s.accountId, s.month]);
const validText = (value: unknown, max = 200): value is string => typeof value === 'string' && value.trim().length > 0 && value.length <= max;
type Category = { id: string; name: string; archived: boolean };
export class MemoryLedger {
  #scope: MemoryScope;
  #rows = new Map<string, LocalMovement>();
  #categories = new Map<string, Category>();
  #rules = new Map<string, ClassificationRule>();
  #overrides = new Map<string, ClassificationFields>();
  #tickets = new Map<symbol, ImportScope>();
  constructor(guard: () => LedgerPrincipal | null) {
    this.#scope = new MemoryScope(guard, () => { this.#rows.clear(); this.#categories.clear(); this.#rules.clear(); this.#overrides.clear(); this.#tickets.clear(); });
  }
  #authorize() { this.#scope.assert(); }
  close() { this.#scope.close(); }
  #owned(subject: string) { this.#scope.assertOwner(subject); }
  beginImport(scope: ImportScope): ImportTicket {
    this.#authorize();
    if (!validText(scope.source) || !validText(scope.accountId) || !/^\d{4}-(?:0[1-9]|1[0-2])$/.test(scope.month)) throw new Error('invalid_import_scope');
    // A newer request in the same scope invalidates any late earlier request.
    for (const [token, prior] of this.#tickets) if (scopeKey(prior) === scopeKey(scope)) this.#tickets.delete(token);
    const token = Symbol('ledger-import'); this.#tickets.set(token, { ...scope }); return Object.freeze({ token });
  }
  abortImport(ticket: ImportTicket) { this.#authorize(); this.#tickets.delete(ticket.token); }
  promote(ticket: ImportTicket, items: readonly OwnedMovement[], complete: boolean, beforeCommit?: () => undefined) {
    this.#authorize();
    const scope = this.#tickets.get(ticket?.token);
    if (!scope) throw new Error('stale_import');
    if (complete !== true) throw new Error('incomplete_batch');
    if (!Array.isArray(items) || items.length > 10000) throw new Error('invalid_batch_size');
    const clean = items.map(item => {
      if (!item || typeof item !== 'object') throw new Error('invalid_movement');
      this.#owned(item.ownerSubject);
      if (item.source !== scope.source || item.accountId !== scope.accountId || occurrenceMonth(item.occurredAt) !== scope.month) throw new Error('out_of_scope_movement');
      const movement: LocalMovement = {
        source: item.source, accountId: item.accountId, externalId: item.externalId, amountCents: item.amountCents, currency: item.currency,
        direction: item.direction, type: item.type, status: item.status, occurredAt: item.occurredAt, institutionId: item.institutionId, description: item.description, categoryId: item.categoryId,
        ...(item.reversalOf ? { reversalOf: { source: item.reversalOf.source, accountId: item.reversalOf.accountId, externalId: item.reversalOf.externalId } } : {}),
      };
      return movement;
    });
    const currencies = [...new Set(clean.map(movement => movement.currency))];
    const canonical = currencies.flatMap(currency => selectMovements(clean, { month: scope.month, currency }, true).items);
    const candidate = new Map(this.#rows);
    for (const movement of canonical) {
      const previous = candidate.get(identity(movement));
      if (previous && occurrenceMonth(previous.occurredAt) !== scope.month) throw new Error('movement_period_conflict');
      candidate.set(identity(movement), movement);
    }
    // Validate the merged view before one atomic pointer swap; preserve rows absent from a read.
    for (const currency of currencies) selectMovements([...candidate.values()], { month: scope.month, currency }, true);
    if (beforeCommit !== undefined && (typeof beforeCommit !== 'function' || beforeCommit() !== undefined)) throw new Error('invalid_commit_guard');
    this.#authorize();
    if (this.#tickets.get(ticket.token) !== scope) throw new Error('stale_import');
    this.#rows = candidate; this.#tickets.delete(ticket.token);
  }
  createCategory(input: OwnedCategory) {
    this.#authorize(); this.#owned(input.ownerSubject);
    if (!validText(input.id, 80) || !validText(input.name, 80) || this.#categories.has(input.id)) throw new Error('invalid_category');
    this.#categories.set(input.id, { id: input.id, name: input.name.trim(), archived: false });
  }
  archiveCategory(id: string) {
    this.#authorize(); const category = this.#categories.get(id);
    if (!category) throw new Error('category_not_found');
    this.#categories.set(id, { ...category, archived: true });
  }
  setRule(input: OwnedRule) {
    this.#authorize(); this.#owned(input.ownerSubject);
    if (input.categoryId !== undefined && input.categoryId !== null) {
      const category = this.#categories.get(input.categoryId);
      if (!category || category.archived) throw new Error('category_unavailable');
    }
    const rule: ClassificationRule = { id: input.id, priority: input.priority, contains: input.contains, categoryId: input.categoryId, type: input.type, accountId: input.accountId, direction: input.direction };
    // Shared rule validation does not require a financial record or any external service.
    classifyMovement({ description: '', accountId: 'rule-validation', direction: 'debit' }, [...this.#categories.values()], [rule]);
    this.#rules.set(rule.id, rule);
  }
  setOverride(ref: MovementRef, patch: ClassificationFields) {
    this.#authorize(); const key = identity(ref), movement = this.#rows.get(key), prior = this.#overrides.get(key);
    if (!movement) throw new Error('movement_not_found');
    if (patch.categoryId === undefined && patch.type === undefined) throw new Error('invalid_override');
    const next = { ...prior, ...(patch.categoryId === undefined ? {} : { categoryId: patch.categoryId }), ...(patch.type === undefined ? {} : { type: patch.type }) };
    if (next.categoryId !== undefined && next.categoryId !== null) {
      const category = this.#categories.get(next.categoryId);
      if (!category || (category.archived && prior?.categoryId !== next.categoryId)) throw new Error('category_unavailable');
    }
    this.#classify(movement, next); this.#overrides.set(key, next);
  }
  #classify(movement: LocalMovement, override = this.#overrides.get(identity(movement))) {
    return classifyMovement({ description: movement.description, accountId: movement.accountId, direction: movement.direction, provider: { categoryId: movement.categoryId, type: movement.type }, trustedOwnTransfer: movement.type === 'own_transfer', override }, [...this.#categories.values()], [...this.#rules.values()]);
  }
  classificationFor(ref: MovementRef) {
    this.#authorize(); const movement = this.#rows.get(identity(ref));
    if (!movement) throw new Error('movement_not_found');
    return this.#classify(movement);
  }
  list(filters: MovementFilters, sourceComplete = false) {
    this.#authorize();
    const movements = [...this.#rows.values()].map(movement => { const classification = this.#classify(movement); return { ...movement, categoryId: classification.categoryId, type: classification.type }; });
    return queryMovements(movements, filters, sourceComplete);
  }
}
