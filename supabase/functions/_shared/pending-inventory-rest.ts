import { resolveExecutionMode, type ExecutionPolicy } from './execution-mode.ts';
import { parseLeaseGrant, type AcquireResult } from './lease-rest.ts';
import { readJsonResponse } from './http-json.ts';
export interface PendingScope { readonly ownerId: string; readonly connectionId: string; readonly revision: number }
export interface PendingItem extends PendingScope { readonly itemId: string }
type Transport = (url: string, init: RequestInit) => Promise<Response>;
const ORIGIN = 'https://vvaufaoahotmaocrcyij.supabase.co';
const object = (raw: unknown): raw is Record<string, unknown> => raw !== null && typeof raw === 'object' && !Array.isArray(raw);
const uuid = (raw: unknown): raw is string => typeof raw === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(raw);
const fail = (): never => { throw Error('pending_inventory_unavailable'); };
function scope(raw: PendingScope) {
  if (!object(raw) || !uuid(raw.ownerId) || !uuid(raw.connectionId) || !Number.isSafeInteger(raw.revision) || raw.revision < 1) return fail();
  return Object.freeze({ ownerId: raw.ownerId, connectionId: raw.connectionId, revision: raw.revision });
}
export function createPendingInventoryPorts(resolve: () => { origin: string; secretKey: string }, options: ExecutionPolicy & { enabled?: boolean; transport?: Transport } = {}) {
  if (options.enabled !== true || resolveExecutionMode(options) === null) return Object.freeze({ resolve: async (_scope: PendingScope, _signal: AbortSignal) => null, store: async (_item: PendingItem, _accounts: readonly unknown[], _signal: AbortSignal) => false, acquire: async (_scope: PendingScope, _signal: AbortSignal): Promise<AcquireResult> => ({ status: 'disabled' }), check: async (_scope: PendingScope, _leaseId: string, _signal: AbortSignal) => false, commit: async (_item: PendingItem, _rows: readonly unknown[], _leaseId: string, _signal: AbortSignal) => false });
  const config = resolve(), origin = config.origin, key = config.secretKey, transport = options.transport;
  if (origin !== ORIGIN || typeof key !== 'string' || !/^sb_secret_[A-Za-z0-9_-]{1,512}$/.test(key) || typeof transport !== 'function') return fail();
  async function rpc(name: 'orbe_resolve_pending_inventory' | 'orbe_stage_account_bindings' | 'orbe_begin_pending_inventory' | 'orbe_check_pending_inventory' | 'orbe_commit_pending_inventory', body: unknown, parent: AbortSignal, limit: number) {
    if (!(parent instanceof AbortSignal) || parent.aborted) return fail();
    const text = JSON.stringify(body);
    if (new TextEncoder().encode(text).length > 131072) return fail();
    const controller = new AbortController(); let response: Response | undefined, abort: () => void = () => {};
    const stopped = new Promise<never>((_, reject) => { abort = () => { controller.abort(); reject(Error('pending_inventory_unavailable')); }; });
    parent.addEventListener('abort', abort, { once: true }); const timer = setTimeout(abort, 20000);
    try {
      const work = async () => {
        if (parent.aborted || controller.signal.aborted) return fail();
        response = await transport!(origin + '/rest/v1/rpc/' + name, { method: 'POST', headers: { apikey: key, Accept: 'application/json', 'Content-Type': 'application/json' }, body: text,
          signal: controller.signal, redirect: 'error', credentials: 'omit', cache: 'no-store', referrerPolicy: 'no-referrer' });
        if (controller.signal.aborted || response.redirected || response.status !== 200) return fail();
        return await readJsonResponse(response, controller.signal, limit);
      };
      return await Promise.race([work(), stopped]);
    } catch { return fail(); }
    finally { clearTimeout(timer); parent.removeEventListener('abort', abort); controller.abort(); try { void response?.body?.cancel().catch(() => {}); } catch { /* Never log private payload. */ } }
  }
  const body = (value: PendingScope) => ({ p_owner_id: value.ownerId, p_connection_id: value.connectionId, p_revision: value.revision });
  async function write(raw: PendingItem, rows: readonly unknown[], signal: AbortSignal, leaseId?: string): Promise<boolean> {
      const value = scope(raw), itemId = raw.itemId;
      if (!uuid(itemId) || !Array.isArray(rows) || rows.length > 1000) return fail();
      const ids = new Set<string>(), accounts = rows.map(row => {
        if (!object(row) || Object.keys(row).sort().join(',') !== 'currency,externalId,kind' || !uuid(row.externalId) || ids.has(row.externalId) || row.kind !== 'unknown' || row.currency !== null && (typeof row.currency !== 'string' || !/^[A-Z]{3}$/.test(row.currency))) return fail();
        ids.add(row.externalId); return { externalId: row.externalId, kind: 'unknown', currency: row.currency };
      });
      const result = await rpc(leaseId === undefined ? 'orbe_stage_account_bindings' : 'orbe_commit_pending_inventory', { ...body(value), p_item_id: itemId, p_accounts: accounts, ...(leaseId === undefined ? {} : { p_lease_id: leaseId }) }, signal, 32);
      if (typeof result !== 'boolean') return fail();
      return result;
  }
  return Object.freeze({
    async resolve(raw: PendingScope, signal: AbortSignal): Promise<Readonly<PendingItem> | null> {
      const value = scope(raw), result = await rpc('orbe_resolve_pending_inventory', body(value), signal, 16384);
      if (result === null) return null;
      if (!object(result) || Object.keys(result).sort().join(',') !== 'connectionId,itemId,ownerId,revision' || result.ownerId !== value.ownerId || result.connectionId !== value.connectionId || result.revision !== value.revision || !uuid(result.itemId)) return fail();
      return Object.freeze({ ...value, itemId: result.itemId });
    },
    store: (raw: PendingItem, rows: readonly unknown[], signal: AbortSignal) => write(raw, rows, signal),
    async acquire(raw: PendingScope, signal: AbortSignal): Promise<AcquireResult> {
      const value = scope(raw);
      const grant = await rpc('orbe_begin_pending_inventory', { p_connection_id: value.connectionId, p_owner_id: value.ownerId, p_expected_revision: value.revision }, signal, 16384);
      return parseLeaseGrant(grant, value, Date.now());
    },
    async check(raw: PendingScope, leaseId: string, signal: AbortSignal): Promise<boolean> {
      const value = scope(raw); if (!uuid(leaseId)) return fail();
      const result = await rpc('orbe_check_pending_inventory', { ...body(value), p_lease_id: leaseId }, signal, 32);
      if (typeof result !== 'boolean') return fail(); return result;
    },
    async commit(raw: PendingItem, rows: readonly unknown[], leaseId: string, signal: AbortSignal): Promise<boolean> {
      if (!uuid(leaseId)) return fail(); return await write(raw, rows, signal, leaseId);
    },
  });
}
