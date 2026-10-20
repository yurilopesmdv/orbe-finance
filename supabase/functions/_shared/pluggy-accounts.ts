import { resolveExecutionMode, type ExecutionPolicy } from './execution-mode.ts';
import { exactInteger, exactNumberText } from './exact-json.ts';
interface Binding { externalId: string; internalId: string; balanceAsOf: string | null; relation: 'distinct' | 'unknown' }
export interface AccountProjectionContext { itemId: string; connectionId: string; bindings: readonly Binding[]; sourceUpdatedAt: string | null; coverageApproved: boolean }
interface AccountDto { readonly id: string; readonly connectionId: string; readonly currency: string; readonly balanceCents: number | null; readonly balanceAsOf: string | null; readonly relation: 'distinct' | 'unknown' }
const object = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value);
function invalid(): never { throw Error('provider_account_invalid'); }
function uuid(value: unknown): string {
  if (typeof value !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(value)) return invalid(); return value;
}
function timestamp(value: unknown): string | null {
  if (value === null) return null;
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.[0-9]{1,3})?Z$/.test(value)) return invalid();
  const parsed = new Date(value);
  if (!Number.isFinite(parsed.getTime()) || parsed.toISOString().slice(0,19) !== value.slice(0,19)) return invalid(); return parsed.toISOString();
}
export function providerCents(value: unknown): number | null {
  if (value === null) return null;
  const literal = exactNumberText(value), match = /^(-?)([0-9]+)(?:\.([0-9]+))?(?:[eE]([+-]?[0-9]+))?$/.exec(literal);
  if (!match) return invalid();
  const exponent = Number(match[4] ?? '0');
  if (!Number.isSafeInteger(exponent) || Math.abs(exponent) > 32) return invalid();
  const fraction = match[3] ?? '', scale = 2 + exponent - fraction.length;
  let amount = BigInt(match[2]! + fraction);
  if (scale >= 0) amount *= 10n ** BigInt(scale);
  else { const divisor = 10n ** BigInt(-scale); if (amount % divisor !== 0n) return invalid(); amount /= divisor; }
  if (match[1] === '-') amount = -amount;
  if (amount > BigInt(Number.MAX_SAFE_INTEGER) || amount < -BigInt(Number.MAX_SAFE_INTEGER)) return invalid();
  return Number(amount);
}
/** Pure fixture projection; caller must separately establish ownership and read authorization. */
export function projectPluggyAccounts(raw: unknown, rawContext: AccountProjectionContext, policy: ExecutionPolicy & { enabled?: boolean } = {}) {
  if (policy.enabled !== true || resolveExecutionMode(policy) === null) return Object.freeze({ kind: 'disabled' as const });
  try {
    if (!object(rawContext) || !Object.hasOwn(rawContext,'itemId') || !Object.hasOwn(rawContext,'connectionId') || !['bindings','sourceUpdatedAt','coverageApproved'].every(key => Object.hasOwn(rawContext,key)) || !Array.isArray(rawContext.bindings) || rawContext.bindings.length > 1000 || typeof rawContext.coverageApproved !== 'boolean') return invalid();
    const itemId = uuid(rawContext.itemId), connectionId = uuid(rawContext.connectionId), sourceUpdatedAt = timestamp(rawContext.sourceUpdatedAt);
    const coverageApproved = rawContext.coverageApproved;
    const bindings = new Map<string, Readonly<Binding>>(), internal = new Set<string>();
    for (const candidate of rawContext.bindings) {
      if (!object(candidate) || !Object.hasOwn(candidate,'externalId') || !Object.hasOwn(candidate,'internalId') || !['balanceAsOf','relation'].every(key => Object.hasOwn(candidate,key)) || !['distinct','unknown'].includes(candidate.relation as string)) return invalid();
      const externalId = uuid(candidate.externalId), internalId = uuid(candidate.internalId), balanceAsOf = timestamp(candidate.balanceAsOf);
      if (bindings.has(externalId) || internal.has(internalId)) return invalid();
      bindings.set(externalId,Object.freeze({ externalId, internalId, balanceAsOf, relation: candidate.relation as Binding['relation'] })); internal.add(internalId);
    }
    if (!object(raw) || !['results','page','total','totalPages'].every(key => Object.hasOwn(raw,key)) || !Array.isArray(raw.results) || raw.results.length > 1000) return invalid();
    const page = exactInteger(raw.page,1,1), total = exactInteger(raw.total,1000), pages = exactInteger(raw.totalPages,1);
    if (page !== 1 || total !== raw.results.length || (total > 0 && pages !== 1)) return invalid();
    let partial = !coverageApproved || sourceUpdatedAt === null, excludedCreditCount = 0, unsupportedCurrencyCount = 0;
    const items: Readonly<AccountDto>[] = [], seen = new Set<string>();
    for (const source of raw.results) {
      if (!object(source) || !Object.hasOwn(source,'id') || !Object.hasOwn(source,'itemId') || source.itemId !== itemId) return invalid();
      const externalId = uuid(source.id), binding = bindings.get(externalId);
      if (!binding || seen.has(externalId) || !Object.hasOwn(source,'type')) return invalid(); seen.add(externalId);
      if (source.type === 'CREDIT') { excludedCreditCount++; partial = true; continue; }
      if (source.type !== 'BANK' || !Object.hasOwn(source,'currencyCode') || typeof source.currencyCode !== 'string' || !/^[A-Z]{3}$/.test(source.currencyCode) || !Object.hasOwn(source,'balance')) return invalid();
      const currency = source.currencyCode, supported = ['BRL','USD','EUR'].includes(currency);
      if (!supported) unsupportedCurrencyCount++;
      // Validate numeric provenance even for unsupported units, then preserve unknown value.
      if (!supported && source.balance !== null) exactNumberText(source.balance);
      const balanceCents = supported ? providerCents(source.balance) : null;
      const row: Readonly<AccountDto> = Object.freeze({ id: binding.internalId, connectionId, currency, balanceCents, balanceAsOf: binding.balanceAsOf, relation: binding.relation });
      if (balanceCents === null || balanceCents < 0 || row.balanceAsOf === null || row.relation === 'unknown') partial = true;
      items.push(row);
    }
    return Object.freeze({ kind: 'page' as const, page: Object.freeze({ connectionId, items: Object.freeze(items), nextCursor: null, authoritative: !partial, sourceUpdatedAt }),
      coverage: Object.freeze({ partial, excludedCreditCount, unsupportedCurrencyCount }) });
  } catch { return invalid(); }
}
