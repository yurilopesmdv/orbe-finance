import { occurrenceMonth } from '../../domain/money.ts';
import type { OwnedAsset } from '../../data/local/assets.ts';

export interface AccountPageContext {
  readonly ownerSubject: string;
  readonly connectionId: string;
  readonly institutionId: string;
  readonly allowedAccountIds: readonly string[];
}
export interface AccountPage {
  readonly kind: 'page';
  readonly items: readonly Readonly<OwnedAsset>[];
  readonly nextCursor: string | null;
  readonly complete: boolean;
  readonly authoritative: boolean;
  readonly partial: boolean;
  readonly sourceUpdatedAt: string | null;
}
const object = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value);
const uuid = (value: unknown): value is string => typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(value);
function invalid(): never { throw new Error('invalid_account_page'); }
function fields(value: unknown, keys: readonly string[]): Record<string, unknown> {
  if (!object(value) || keys.some(key => !Object.hasOwn(value, key))) return invalid();
  return Object.fromEntries(keys.map(key => [key, value[key]]));
}
function date(value: unknown, instantOnly = false): string | null {
  if (value === null) return null;
  if (typeof value !== 'string') return invalid();
  occurrenceMonth(value);
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return instantOnly ? invalid() : value;
  const time = /T(\d{2}):(\d{2}):(\d{2})/.exec(value);
  if (!time || Number(time[1]) > 23 || Number(time[2]) > 59 || Number(time[3]) > 59) return invalid();
  return new Date(value).toISOString();
}

// Internal bridge DTO only. The caller must establish Auth, OF and account bindings.
// No provider payload, network, cache mutation or inferred balance semantics here.
export function normalizeAccountPage(raw: unknown, context: unknown, policy: { enabled?: boolean; privateDataApproved?: boolean } = {}): AccountPage | Readonly<{ kind: 'disabled' }> {
  if (policy.enabled !== true || policy.privateDataApproved !== true) return Object.freeze({ kind: 'disabled' });
  try {
    const { ownerSubject, connectionId, institutionId, allowedAccountIds } = fields(context, ['ownerSubject', 'connectionId', 'institutionId', 'allowedAccountIds']);
    if (!uuid(ownerSubject) || !uuid(connectionId) || typeof institutionId !== 'string' || !['bradesco', 'mercado-pago', 'inter', 'nubank'].includes(institutionId) || !Array.isArray(allowedAccountIds) || allowedAccountIds.length > 10000 || !allowedAccountIds.every(uuid)) return invalid();
    const allowed = new Set(allowedAccountIds);
    const page = fields(raw, ['connectionId', 'items', 'nextCursor', 'authoritative', 'sourceUpdatedAt']);
    if (page.connectionId !== connectionId || !Array.isArray(page.items) || page.items.length > 1000 || typeof page.authoritative !== 'boolean') return invalid();
    const cursor = page.nextCursor;
    if (!(cursor === null || typeof cursor === 'string' && cursor.length > 0 && cursor.length <= 512 && !/[\u0000-\u001f\u007f]/.test(cursor))) return invalid();
    const sourceUpdatedAt = date(page.sourceUpdatedAt, true);
    let partial = sourceUpdatedAt === null;
    const rows = new Map<string, Readonly<OwnedAsset>>();
    for (const value of page.items) {
      const item = fields(value, ['id', 'connectionId', 'currency', 'balanceCents', 'balanceAsOf', 'relation']);
      if (!uuid(item.id) || !allowed.has(item.id) || item.connectionId !== connectionId || typeof item.currency !== 'string' || !/^[A-Z]{3}$/.test(item.currency) || !(item.balanceCents === null || typeof item.balanceCents === 'number' && Number.isSafeInteger(item.balanceCents)) || !['distinct', 'unknown'].includes(item.relation as string)) return invalid();
      const asOf = date(item.balanceAsOf);
      const row: Readonly<OwnedAsset> = Object.freeze({
        ownerSubject, connectionId, institutionId, product: 'account',
        id: `account:${connectionId}:${item.id}`, currency: item.currency,
        amountCents: item.balanceCents as number | null, asOf, kind: 'asset', relation: item.relation as 'distinct' | 'unknown',
      });
      if (row.amountCents === null || row.amountCents < 0 || asOf === null || row.relation === 'unknown') partial = true;
      const prior = rows.get(row.id);
      if (prior && JSON.stringify(prior) !== JSON.stringify(row)) return invalid();
      rows.set(row.id, row);
    }
    return Object.freeze({ kind: 'page', items: Object.freeze([...rows.values()]), nextCursor: cursor, complete: cursor === null, partial, authoritative: page.authoritative && !partial, sourceUpdatedAt });
  } catch { return invalid(); }
}
