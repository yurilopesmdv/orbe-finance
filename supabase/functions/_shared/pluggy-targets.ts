/** Server-only URL construction. The caller must first verify owner/session/lease. */
export interface ResolvedPluggyBinding { itemId: string; accountIds: readonly string[] }
export interface TransactionWindow { dateFrom: string; dateTo: string }
const ORIGIN = 'https://api.pluggy.ai';
const TRANSACTIONS = ORIGIN + '/v2/transactions';
const object = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value);
function invalid(): never { throw new Error('pluggy_target_invalid'); }
function id(value: unknown): string {
  if (typeof value !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(value)) return invalid();
  return value;
}
function day(value: unknown): string {
  if (typeof value !== 'string' || !/^[1-9][0-9]{3}-[0-9]{2}-[0-9]{2}$/.test(value)) return invalid();
  const date = new Date(value + 'T00:00:00Z');
  if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== value) return invalid();
  return value;
}
function window(raw: TransactionWindow) {
  if (!object(raw) || Object.keys(raw).sort().join(',') !== 'dateFrom,dateTo') return invalid();
  const dateFrom = day(raw.dateFrom), dateTo = day(raw.dateTo);
  const span = Date.parse(dateTo) - Date.parse(dateFrom);
  if (span < 0 || span > 30 * 86400000) return invalid();
  return { dateFrom, dateTo };
}
export function createPluggyTargets(binding: ResolvedPluggyBinding) {
  let itemId: string, accounts: Set<string>;
  try {
    if (!object(binding) || Object.keys(binding).sort().join(',') !== 'accountIds,itemId') return invalid();
    itemId = id(binding.itemId);
    const rows = binding.accountIds;
    if (!Array.isArray(rows) || rows.length > 1000) return invalid();
    accounts = new Set(rows.map(id));
    if (accounts.size !== rows.length) return invalid();
  } catch { return invalid(); }
  const account = (raw: string) => { const value = id(raw); if (!accounts.has(value)) return invalid(); return value; };
  return Object.freeze({
    item: () => ORIGIN + '/items/' + itemId,
    accounts: () => ORIGIN + '/accounts?itemId=' + itemId,
    investments(page = 1) {
      if (!Number.isSafeInteger(page) || page < 1 || page > 1000) return invalid();
      return ORIGIN + '/investments?itemId=' + itemId + '&page=' + page + '&pageSize=100';
    },
    firstTransactions(rawAccount: string, rawWindow: TransactionWindow) {
      const accountId = account(rawAccount), { dateFrom, dateTo } = window(rawWindow);
      return TRANSACTIONS + '?accountId=' + accountId + '&dateFrom=' + dateFrom + '&dateTo=' + dateTo;
    },
    nextTransactions(rawAccount: string, rawWindow: TransactionWindow, rawNext: unknown): string | null {
      const accountId = account(rawAccount), expected = window(rawWindow);
      if (rawNext === null) return null;
      if (typeof rawNext !== 'string' || rawNext.length > 2048 || !/^\?[A-Za-z0-9._~%+=&-]+$/.test(rawNext) || /%(?![0-9A-Fa-f]{2})/.test(rawNext)) return invalid();
      if (rawNext.slice(1).split('&').some(pair => !pair || !pair.includes('='))) return invalid();
      try { decodeURIComponent(rawNext.slice(1).replaceAll('+', '%20')); } catch { return invalid(); }
      const params = new URLSearchParams(rawNext.slice(1));
      const fields = ['accountId', 'dateFrom', 'dateTo', 'after'];
      if ([...params.keys()].length !== 4 || fields.some(name => params.getAll(name).length !== 1) || params.get('accountId') !== accountId || params.get('dateFrom') !== expected.dateFrom || params.get('dateTo') !== expected.dateTo) return invalid();
      const after = params.get('after');
      if (!after || after.length > 1536 || /[^\x21-\x7e]/.test(after)) return invalid();
      // Keep the opaque next query byte-for-byte; only the endpoint/host come from us.
      return TRANSACTIONS + rawNext;
    },
  });
}
