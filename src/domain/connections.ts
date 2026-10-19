import { occurrenceMonth } from './money.ts';
export const connectionProducts = ['accounts', 'transactions', 'investments', 'reserves'] as const;
export type ConnectionProduct = typeof connectionProducts[number];
export interface ConnectionPolicy { integrationEnabled?: boolean; privateDataApproved?: boolean; now?: number }
const object = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value);
function invalid(): never { throw new Error('invalid_connection_metadata'); }
function timestamp(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?(?:Z|[+-]\d{2}:\d{2})$/.test(value)) return invalid();
  try { occurrenceMonth(value); } catch { return invalid(); }
  const time = /T(\d{2}):(\d{2}):(\d{2})/.exec(value)!;
  if (Number(time[1]) > 23 || Number(time[2]) > 59 || Number(time[3]) > 59) return invalid();
  return new Date(value).toISOString();
}
export function normalizeConnection(raw: unknown, policy: ConnectionPolicy = {}) {
  if (policy.integrationEnabled !== true) return Object.freeze({ kind: 'disabled' as const, reason: 'integration_disabled' as const, readableProducts: Object.freeze([] as ConnectionProduct[]) });
  if (policy.privateDataApproved !== true) return Object.freeze({ kind: 'disabled' as const, reason: 'private_data_unapproved' as const, readableProducts: Object.freeze([] as ConnectionProduct[]) });
  const now = policy.now;
  if (typeof now !== 'number' || !Number.isSafeInteger(now) || now < 0 || !Number.isFinite(new Date(now).getTime()) || !object(raw) || !object(raw.capabilities)) return invalid();
  if (['id', 'institution', 'revision', 'state', 'capabilities'].some(key => !Object.hasOwn(raw, key))) return invalid();
  const rawCapabilities = raw.capabilities;
  if (typeof raw.id !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(raw.id) || !['bradesco', 'mercado-pago', 'inter', 'nubank'].includes(raw.institution as string) || !['pending', 'active', 'paused', 'renewal_required', 'revoked', 'error'].includes(raw.state as string) || !Number.isSafeInteger(raw.revision) || (raw.revision as number) < 1) return invalid();
  const capabilities = Object.fromEntries(connectionProducts.map(product => {
    const value = Object.hasOwn(rawCapabilities, product) ? rawCapabilities[product] : undefined;
    if (value !== undefined && value !== null && typeof value !== 'boolean') return invalid();
    return [product, value ?? null];
  })) as Record<ConnectionProduct, boolean | null>;
  const field = (key: string) => Object.hasOwn(raw, key) ? raw[key] : undefined;
  const verifiedAt = timestamp(field('openFinanceVerifiedAt')), proxyExpiry = timestamp(field('proxyConsentExpiresAt')), bankExpiry = timestamp(field('bankConsentExpiresAt')), sourceUpdatedAt = timestamp(field('sourceUpdatedAt')), lastReadAt = timestamp(field('lastReadAt'));
  const expiresAt = [proxyExpiry, bankExpiry].filter((value): value is string => value !== null).sort((a, b) => Date.parse(a) - Date.parse(b))[0] ?? null;
  if ([verifiedAt, sourceUpdatedAt, lastReadAt].some(value => value !== null && Date.parse(value) > now + 60000)) return invalid();
  let state = raw.state as 'pending' | 'active' | 'paused' | 'renewal_required' | 'revoked' | 'error' | 'unsupported' | 'partial';
  let blockedReason: string | null = state === 'active' ? null : state;
  let readable: ConnectionProduct[] = [];
  if (state === 'active') {
    if (verifiedAt === null) { state = 'unsupported'; blockedReason = 'open_finance_unverified'; }
    else if (expiresAt !== null && Date.parse(expiresAt) <= now) { state = 'renewal_required'; blockedReason = 'authorization_expired'; }
    else if (proxyExpiry === null) { state = 'partial'; blockedReason = 'proxy_authorization_unknown'; }
    else {
      readable = connectionProducts.filter(product => capabilities[product] === true);
      if (readable.length === 0 && connectionProducts.every(product => capabilities[product] === false)) { state = 'unsupported'; blockedReason = 'products_unavailable'; }
      else if (readable.length < connectionProducts.length) { state = 'partial'; blockedReason = readable.length === 0 ? 'capability_unknown' : null; }
    }
  }
  return Object.freeze({
    kind: 'connection' as const, id: raw.id, institution: raw.institution as string, revision: raw.revision as number,
    state, blockedReason, capabilities: Object.freeze(capabilities), readableProducts: Object.freeze(readable),
    openFinanceVerifiedAt: verifiedAt, proxyConsentExpiresAt: proxyExpiry, bankConsentExpiresAt: bankExpiry, authorizationExpiresAt: expiresAt, sourceUpdatedAt, lastReadAt,
  });
}
