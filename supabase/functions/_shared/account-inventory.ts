import { resolveExecutionMode, type ExecutionPolicy } from './execution-mode.ts';
import { exactInteger } from './exact-json.ts';
const object = (value: unknown): value is Record<string, unknown> => value !== null && typeof value === 'object' && !Array.isArray(value);
const fail = (): never => { throw Error('account_inventory_invalid'); };
const uuid = (value: unknown): string => {
  if (typeof value !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(value)) return fail();
  return value;
};
/** Private metadata projection only; does not authorize collection or create bindings. */
export function projectAccountInventory(raw: unknown, expectedItemId: string, policy: ExecutionPolicy & { enabled?: boolean } = {}) {
  if (policy.enabled !== true || resolveExecutionMode(policy) === null) return Object.freeze({ kind: 'disabled' as const });
  try {
    const itemId = uuid(expectedItemId);
    if (!object(raw) || !['page', 'total', 'totalPages', 'results'].every(key => Object.hasOwn(raw, key)) || !Array.isArray(raw.results) || raw.results.length > 1000) return fail();
    const page = exactInteger(raw.page, 1, 1), total = exactInteger(raw.total, 1000), pages = exactInteger(raw.totalPages, 1);
    if (page !== 1 || total !== raw.results.length || total > 0 && pages !== 1) return fail();
    const ids = new Set<string>(), accounts: Readonly<{ externalId: string; kind: 'unknown'; currency: string | null }>[] = [];
    let creditAccounts = 0;
    for (const row of raw.results) {
      if (!object(row) || !['id', 'itemId', 'type'].every(key => Object.hasOwn(row, key)) || row.itemId !== itemId) return fail();
      const externalId = uuid(row.id);
      if (ids.has(externalId) || row.type !== 'BANK' && row.type !== 'CREDIT') return fail();
      ids.add(externalId);
      let currency: string | null = null;
      if (row.type === 'BANK') {
        if (!Object.hasOwn(row, 'currencyCode') || typeof row.currencyCode !== 'string' || !/^[A-Z]{3}$/.test(row.currencyCode)) return fail();
        currency = row.currencyCode;
      } else creditAccounts++;
      accounts.push(Object.freeze({ externalId, kind: 'unknown' as const, currency }));
    }
    return Object.freeze({ kind: 'inventory' as const, accounts: Object.freeze(accounts), creditAccounts });
  } catch { return fail(); }
}
