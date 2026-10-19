import { calculateExpenses, type Movement, type FinancialType } from '../../domain/expenses.ts';
import { occurrenceMonth } from '../../domain/money.ts';
export interface LocalMovement extends Movement { institutionId: string; description: string; categoryId: string | null }
export interface MovementFilters { month: string; currency?: string; accountId?: string; institutionId?: string; type?: FinancialType; categoryId?: string | null; search?: string; offset?: number; limit?: number }
const identity = (m: Movement) => JSON.stringify([m.source, m.accountId, m.externalId]);
const normalize = (value: string) => value.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
const sortDate = (date: string) => /^\d{4}-\d{2}-\d{2}$/.test(date) ? `${date}T00:00:00` : new Intl.DateTimeFormat('sv-SE', { timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' }).format(new Date(date)).replace(' ', 'T');
export function queryMovements(input: readonly LocalMovement[], filters: MovementFilters, sourceComplete: boolean) {
  const currency = filters.currency ?? 'BRL', offset = filters.offset ?? 0, limit = filters.limit ?? 25;
  if (!Number.isSafeInteger(offset) || offset < 0 || !Number.isSafeInteger(limit) || limit < 1 || limit > 100 || typeof sourceComplete !== 'boolean') throw new Error('invalid_query');
  if (typeof currency !== 'string' || !currency.length || (filters.search !== undefined && typeof filters.search !== 'string')) throw new Error('invalid_query');
  for (const value of [filters.accountId, filters.institutionId, filters.type, filters.categoryId]) if (value !== undefined && value !== null && (typeof value !== 'string' || !value.length)) throw new Error('invalid_query');
  // Validate the complete canonical batch before filtering can hide corrupt records.
  calculateExpenses(input, filters.month, currency);
  const canonical = new Map<string, LocalMovement>();
  for (const movement of input) {
    if (typeof movement.institutionId !== 'string' || !movement.institutionId.length || typeof movement.description !== 'string' || (movement.categoryId !== null && (typeof movement.categoryId !== 'string' || !movement.categoryId.length))) throw new Error('invalid_local_movement');
    const id = identity(movement), prior = canonical.get(id);
    if (prior && (prior.description !== movement.description || prior.categoryId !== movement.categoryId || prior.institutionId !== movement.institutionId)) throw new Error('conflicting_local_movement');
    canonical.set(id, movement);
  }
  const search = normalize(filters.search ?? '');
  const matches = [...canonical.values()].filter(m => m.currency === currency && occurrenceMonth(m.occurredAt) === filters.month && (filters.accountId === undefined || m.accountId === filters.accountId) && (filters.institutionId === undefined || m.institutionId === filters.institutionId) && (filters.type === undefined || m.type === filters.type) && (filters.categoryId === undefined || m.categoryId === filters.categoryId) && normalize(m.description).includes(search));
  matches.sort((a, b) => {
    const aDate = sortDate(a.occurredAt), bDate = sortDate(b.occurredAt);
    return aDate < bDate ? 1 : aDate > bDate ? -1 : identity(a) < identity(b) ? -1 : identity(a) > identity(b) ? 1 : 0;
  });
  const summary = calculateExpenses(matches, filters.month, currency, [...canonical.values()]);
  return { items: matches.slice(offset, offset + limit).map(m => ({ ...m, ...(m.reversalOf ? { reversalOf: { ...m.reversalOf } } : {}) })), totalCount: matches.length, nextOffset: offset + limit < matches.length ? offset + limit : null, summary: { ...summary, partial: summary.partial || !sourceComplete } };
}
