import { resolveExecutionMode, type ExecutionPolicy } from './execution-mode.ts';
import { createMovementIdentity } from './movement-identity.ts';
import { planTransactionMonth } from './transaction-month.ts';
import { createPluggyTargets, type TransactionWindow } from './pluggy-targets.ts';
import { providerCents } from './pluggy-accounts.ts';

export interface PluggyMovementContext {
  ownerSubject: string; connectionId: string; accountId: string; externalAccountId: string; itemId: string;
  accountKind: 'BANK'; month: string; window: TransactionWindow; nextCursor: string | null;
  windowComplete: boolean; sourceUpdatedAt: string | null;
}
interface Snapshot { externalId: string; amountCents: number | null; currency: string; direction: 'credit' | 'debit'; status: 'posted' | 'pending'; occurredAt: string; description: string }
const unavailable = Object.freeze({ kind: 'unavailable' as const });
const uuid = (value: unknown): value is string => typeof value === 'string' && value.length === 36 && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(value);
function fields(value: unknown, keys: readonly string[]): Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value) || !keys.every(key => Object.hasOwn(value, key))) throw Error('movement_projection_invalid');
  return value as Record<string, unknown>;
}
function description(value: unknown): string {
  if (typeof value !== 'string' || value.length > 4096 || /[\u0000-\u001f\u007f]/.test(value)) throw Error('movement_projection_invalid');
  let result = '';
  for (const character of value.normalize('NFC').trim()) { if (result.length + character.length > 240) break; result += character; }
  return result;
}
/** Server-only projection. All context, key configuration and internal cursor must be trusted. */
export async function projectPluggyMovementPage(raw: unknown, rawContext: PluggyMovementContext, readKey: () => Uint8Array | Promise<Uint8Array>, policy: ExecutionPolicy & { enabled?: boolean; signal?: AbortSignal } = {}) {
  if (policy.enabled !== true || resolveExecutionMode(policy) === null) return Object.freeze({ kind: 'disabled' as const });
  let identity: ReturnType<typeof createMovementIdentity> | null = null;
  try {
    const context = fields(rawContext, ['ownerSubject','connectionId','accountId','externalAccountId','itemId','accountKind','month','window','nextCursor','windowComplete','sourceUpdatedAt']);
    const { ownerSubject, connectionId, accountId, externalAccountId, itemId, accountKind, month, nextCursor, windowComplete, sourceUpdatedAt } = context;
    if (![ownerSubject,connectionId,accountId,externalAccountId,itemId].every(uuid) || accountKind !== 'BANK' || typeof windowComplete !== 'boolean') return unavailable;
    if (!(nextCursor === null || typeof nextCursor === 'string' && nextCursor.length >= 16 && nextCursor.length <= 512 && /^[A-Za-z0-9_-]+$/.test(nextCursor))) return unavailable;
    const plan = planTransactionMonth(month, policy);
    if (plan.kind !== 'plan' || sourceUpdatedAt !== null && plan.classifyInstant(sourceUpdatedAt).kind === 'unavailable') return unavailable;
    const windowFields = fields(context.window, ['dateFrom','dateTo']);
    const { dateFrom, dateTo } = windowFields;
    if (typeof dateFrom !== 'string' || typeof dateTo !== 'string' || !plan.windows.some(window => window.dateFrom === dateFrom && window.dateTo === dateTo)) return unavailable;
    const window = Object.freeze({ dateFrom, dateTo });
    const signal = policy.signal;
    if (signal?.aborted) return unavailable;
    const page = fields(raw, ['results','next']), rows = page.results, next = page.next;
    if (!Array.isArray(rows) || rows.length > 500 || (next === null) !== (nextCursor === null)) return unavailable;
    const targets = createPluggyTargets({ itemId: itemId as string, accountIds: [externalAccountId as string] });
    targets.nextTransactions(externalAccountId as string, window, next);
    const snapshots = new Map<string, Readonly<Snapshot>>();
    for (const value of rows) {
      const row = fields(value, ['id','accountId','date','amount','currencyCode','type','status','description']);
      const externalId = row.id, sourceAccount = row.accountId, date = row.date;
      if (!uuid(externalId) || sourceAccount !== externalAccountId || typeof date !== 'string') return unavailable;
      const classified = plan.classifyInstant(date);
      if (classified.kind === 'unavailable' || classified.occurredAt.slice(0,10) < dateFrom || classified.occurredAt.slice(0,10) > dateTo) return unavailable;
      if (classified.kind === 'outside') continue;
      const currency = row.currencyCode, direction = row.type, status = row.status;
      if (typeof currency !== 'string' || !['BRL','USD','EUR'].includes(currency) || !['DEBIT','CREDIT'].includes(direction as string) || !['POSTED','PENDING'].includes(status as string)) return unavailable;
      const signed = providerCents(row.amount);
      if (signed !== null && (direction === 'DEBIT' && signed > 0 || direction === 'CREDIT' && signed < 0)) return unavailable;
      const snapshot = Object.freeze({ externalId, amountCents: signed === null ? null : Math.abs(signed), currency, direction: direction === 'DEBIT' ? 'debit' as const : 'credit' as const, status: status === 'POSTED' ? 'posted' as const : 'pending' as const, occurredAt: classified.occurredAt, description: description(row.description) });
      const prior = snapshots.get(externalId);
      if (prior && JSON.stringify(prior) !== JSON.stringify(snapshot)) return unavailable;
      snapshots.set(externalId, snapshot);
    }
    identity = createMovementIdentity(readKey, { ownerSubject: ownerSubject as string, accountId: accountId as string }, policy);
    const items = [], internalIds = new Set<string>();
    for (const snapshot of snapshots.values()) {
      const result = await identity.deriveMovement(snapshot.externalId);
      if (signal?.aborted || result.kind !== 'id' || internalIds.has(result.movementId)) return unavailable;
      internalIds.add(result.movementId);
      items.push(Object.freeze({ movementId: result.movementId, accountId: accountId as string, amountCents: snapshot.amountCents, currency: snapshot.currency, direction: snapshot.direction, type: 'unknown' as const, status: snapshot.status, occurredAt: snapshot.occurredAt, description: snapshot.description, categoryId: null, reversalOf: null }));
    }
    if (signal?.aborted) return unavailable;
    return Object.freeze({ kind: 'page' as const, page: Object.freeze({ connectionId: connectionId as string, accountId: accountId as string, items: Object.freeze(items), nextCursor, windowComplete, sourceUpdatedAt: sourceUpdatedAt as string | null }) });
  } catch { return unavailable; }
  finally { identity?.close(); }
}
