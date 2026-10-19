import { occurrenceMonth } from '../../domain/money.ts';
import type { FinancialType, MovementRef } from '../../domain/expenses.ts';
import type { OwnedMovement } from '../../data/local/ledger.ts';

export interface MovementPageContext {
  readonly ownerSubject: string;
  readonly connectionId: string;
  readonly institutionId: string;
  readonly accountId: string;
  readonly month: string;
  readonly allowedAccountIds: readonly string[];
  readonly categoryIds: readonly string[];
  readonly confirmedOwnTransferIds: readonly string[];
}
export interface MovementPage {
  readonly kind: 'page';
  readonly items: readonly Readonly<OwnedMovement>[];
  readonly rowCount: number;
  readonly nextCursor: string | null;
  readonly complete: boolean;
  readonly windowComplete: boolean;
  readonly partial: boolean;
  readonly sourceUpdatedAt: string | null;
}
const uuid = (value: unknown): value is string => typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(value);
const category = (value: unknown): value is string => typeof value === 'string' && /^[a-zA-Z0-9:_-]{1,80}$/.test(value);
const types = ['income', 'expense', 'own_transfer', 'contribution', 'redemption', 'yield', 'refund', 'card_settlement', 'unknown'];
const object = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value);
function invalid(): never { throw new Error('invalid_movement_page'); }
function fields(value: unknown, keys: readonly string[]) {
  if (!object(value) || keys.some(key => !Object.hasOwn(value, key))) return invalid();
  return Object.fromEntries(keys.map(key => [key, value[key]]));
}
function ids(value: unknown, max: number, validator: (value: unknown) => value is string): Set<string> {
  if (!Array.isArray(value) || value.length > max) return invalid();
  const result = new Set<string>();
  for (const id of value) { if (!validator(id)) return invalid(); result.add(id); }
  return result;
}
function date(value: unknown, instantOnly = false): string {
  if (typeof value !== 'string') return invalid();
  occurrenceMonth(value);
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return instantOnly ? invalid() : value;
  const time = /T(\d{2}):(\d{2}):(\d{2})/.exec(value);
  if (!time || Number(time[1]) > 23 || Number(time[2]) > 59 || Number(time[3]) > 59) return invalid();
  return new Date(value).toISOString();
}
// This is a minimum internal DTO, not a Pluggy payload parser or authorization port.
export function normalizeMovementPage(raw: unknown, input: unknown, policy: { enabled?: boolean; privateDataApproved?: boolean } = {}): MovementPage | Readonly<{ kind: 'disabled' }> {
  if (policy.enabled !== true || policy.privateDataApproved !== true) return Object.freeze({ kind: 'disabled' });
  try {
    const context = fields(input, ['ownerSubject', 'connectionId', 'institutionId', 'accountId', 'month', 'allowedAccountIds', 'categoryIds', 'confirmedOwnTransferIds']);
    const { ownerSubject, connectionId, institutionId, accountId, month } = context;
    if (!uuid(ownerSubject) || !uuid(connectionId) || !uuid(accountId) || typeof institutionId !== 'string' || !['bradesco', 'mercado-pago', 'inter', 'nubank'].includes(institutionId) || typeof month !== 'string' || !/^\d{4}-(?:0[1-9]|1[0-2])$/.test(month)) return invalid();
    const accounts = ids(context.allowedAccountIds, 10000, uuid), categories = ids(context.categoryIds, 1000, category), confirmed = ids(context.confirmedOwnTransferIds, 10000, uuid);
    if (!accounts.has(accountId)) return invalid();
    const page = fields(raw, ['connectionId', 'accountId', 'items', 'nextCursor', 'windowComplete', 'sourceUpdatedAt']);
    if (page.connectionId !== connectionId || page.accountId !== accountId || !Array.isArray(page.items) || page.items.length > 1000 || typeof page.windowComplete !== 'boolean') return invalid();
    const cursor = page.nextCursor;
    if (!(cursor === null || typeof cursor === 'string' && cursor.length > 0 && cursor.length <= 512 && !/[\u0000-\u001f\u007f]/.test(cursor))) return invalid();
    const sourceUpdatedAt = page.sourceUpdatedAt === null ? null : date(page.sourceUpdatedAt, true);
    let partial = !page.windowComplete || sourceUpdatedAt === null;
    const source = `connection:${connectionId}`, rows = new Map<string, Readonly<OwnedMovement>>();
    for (const value of page.items) {
      const item = fields(value, ['movementId', 'accountId', 'amountCents', 'currency', 'direction', 'type', 'status', 'occurredAt', 'description', 'categoryId', 'reversalOf']);
      if (!uuid(item.movementId) || item.accountId !== accountId || !(item.amountCents === null || typeof item.amountCents === 'number' && Number.isSafeInteger(item.amountCents) && item.amountCents >= 0) || typeof item.currency !== 'string' || !/^[A-Z]{3}$/.test(item.currency) || !['credit', 'debit'].includes(item.direction as string) || !types.includes(item.type as string) || !['posted', 'pending', 'cancelled'].includes(item.status as string) || typeof item.description !== 'string' || item.description.length > 240 || /[\u0000-\u001f\u007f]/.test(item.description) || !(item.categoryId === null || category(item.categoryId) && categories.has(item.categoryId))) return invalid();
      const occurredAt = date(item.occurredAt);
      if (occurrenceMonth(occurredAt) !== month) return invalid();
      if (['expense', 'contribution', 'card_settlement'].includes(item.type as string) && item.direction !== 'debit' || ['income', 'redemption', 'yield', 'refund'].includes(item.type as string) && item.direction !== 'credit') return invalid();
      let type = item.type as FinancialType;
      if (type === 'own_transfer' && !confirmed.has(item.movementId)) { type = 'unknown'; partial = true; }
      let reversalOf: Readonly<MovementRef> | undefined;
      if (item.reversalOf !== null) {
        const ref = fields(item.reversalOf, ['accountId', 'movementId']);
        if (type !== 'refund' || !uuid(ref.accountId) || !accounts.has(ref.accountId) || !uuid(ref.movementId) || ref.accountId === accountId && ref.movementId === item.movementId) return invalid();
        reversalOf = Object.freeze({ source, accountId: ref.accountId, externalId: ref.movementId });
      } else if (type === 'refund') partial = true;
      if (item.amountCents === null || type === 'unknown') partial = true;
      const movement: Readonly<OwnedMovement> = Object.freeze({ ownerSubject, source, accountId, externalId: item.movementId, institutionId, amountCents: item.amountCents as number | null, currency: item.currency, direction: item.direction as 'credit' | 'debit', type, status: item.status as 'posted' | 'pending' | 'cancelled', occurredAt, description: item.description.normalize('NFC').trim(), categoryId: item.categoryId as string | null, ...(reversalOf ? { reversalOf } : {}) });
      const prior = rows.get(movement.externalId);
      if (prior && JSON.stringify(prior) !== JSON.stringify(movement)) return invalid();
      rows.set(movement.externalId, movement);
    }
    return Object.freeze({ kind: 'page', items: Object.freeze([...rows.values()]), rowCount: page.items.length, nextCursor: cursor, complete: cursor === null, windowComplete: page.windowComplete, partial, sourceUpdatedAt });
  } catch { return invalid(); }
}
