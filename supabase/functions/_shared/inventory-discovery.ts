import type { PendingItem, PendingScope } from './pending-inventory-rest.ts';
import type { InventoryReadResult } from './pluggy-auth.ts';
interface Ports {
  authenticate(token: string, signal: AbortSignal): Promise<unknown>;
  resolve(scope: PendingScope, signal: AbortSignal): Promise<Readonly<PendingItem> | null>;
  readInventory(context: { itemId: string; connectionId: string }, signal: AbortSignal): Promise<InventoryReadResult>;
  store(context: PendingItem, rows: readonly unknown[], signal: AbortSignal): Promise<boolean>;
}
type Status = 'disabled' | 'unavailable' | 'forbidden' | 'conflict' | 'cancelled' | 'busy' | 'rate_limited';
export type DiscoveryResult = Readonly<{ status: Status }> | Readonly<{ status: 'complete'; registeredAccounts: number }>;
const object = (value: unknown): value is Record<string, unknown> => value !== null && typeof value === 'object' && !Array.isArray(value);
const uuid = (value: unknown): value is string => typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(value);
class Failure extends Error { readonly status: Status; constructor(status: Status) { super('inventory_discovery_unavailable'); this.status = status; } }
const fail = (status: Status = 'unavailable'): never => { throw new Failure(status); };
const result = (status: Status): DiscoveryResult => Object.freeze({ status });
export function createInventoryDiscovery(ports: Ports, options: { enabled?: boolean; privateDataApproved?: boolean; fixtureOnly?: boolean; now?: () => number } = {}) {
  if (options.enabled !== true || options.privateDataApproved !== true || options.fixtureOnly !== true) return Object.freeze({ run: async (_input: unknown, _token: string, _signal: AbortSignal): Promise<DiscoveryResult> => result('disabled'), close() {} });
  const now = options.now ?? Date.now;
  let active: AbortController | null = null, closed = false;
  return Object.freeze({
    async run(input: { connectionId: string; revision: number }, token: string, parent: AbortSignal): Promise<DiscoveryResult> {
      if (closed) return result('unavailable');
      if (active) return result('busy');
      const controller = new AbortController(); active = controller;
      let timer: ReturnType<typeof setTimeout> | undefined, stop: () => void = () => {}, lastTime = -1, start = 0;
      function fresh(expiry = Infinity) {
        if (controller.signal.aborted || closed || parent.aborted) return fail('cancelled');
        const time = now();
        if (!Number.isSafeInteger(time) || time < 0 || time < lastTime || time - start >= 120000 || time >= expiry) return fail();
        lastTime = time; return time;
      }
      function principal(raw: unknown) {
        if (!object(raw) || !uuid(raw.subject) || typeof raw.expiresAt !== 'number' || !Number.isSafeInteger(raw.expiresAt)) return fail();
        if (raw.isOwner !== true) return fail('forbidden');
        fresh(raw.expiresAt); return Object.freeze({ ownerId: raw.subject, expiresAt: raw.expiresAt });
      }
      function context(raw: unknown, scope: PendingScope): Readonly<PendingItem> {
        if (!object(raw) || Object.keys(raw).sort().join(',') !== 'connectionId,itemId,ownerId,revision' || raw.ownerId !== scope.ownerId || raw.connectionId !== scope.connectionId || raw.revision !== scope.revision || !uuid(raw.itemId)) return fail('conflict');
        return Object.freeze({ ...scope, itemId: raw.itemId });
      }
      try {
        if (!(parent instanceof AbortSignal) || parent.aborted) return result('cancelled');
        if (!object(input) || Object.keys(input).sort().join(',') !== 'connectionId,revision' || !uuid(input.connectionId) || !Number.isSafeInteger(input.revision) || input.revision < 1 || typeof token !== 'string' || !/^[A-Za-z0-9._~-]{1,8192}$/.test(token)) return fail();
        const request = Object.freeze({ connectionId: input.connectionId, revision: input.revision });
        start = now(); if (!Number.isSafeInteger(start) || start < 0) return fail(); fresh();
        const stopped = new Promise<never>((_, reject) => { stop = () => { controller.abort(); reject(new Failure('cancelled')); }; });
        parent.addEventListener('abort', stop, { once: true }); controller.signal.addEventListener('abort', stop, { once: true });
        timer = setTimeout(stop, 120000);
        const work = async (): Promise<DiscoveryResult> => {
          const first = principal(await ports.authenticate(token, controller.signal)); fresh(first.expiresAt);
          const scope = Object.freeze({ ...request, ownerId: first.ownerId });
          const binding = context(await ports.resolve(scope, controller.signal), scope); fresh(first.expiresAt);
          const collected = await ports.readInventory(Object.freeze({ itemId: binding.itemId, connectionId: binding.connectionId }), controller.signal); fresh(first.expiresAt);
          if (collected.status !== 'complete') return result(collected.status === 'rate_limited' ? 'rate_limited' : collected.status === 'cancelled' ? 'cancelled' : 'unavailable');
          if (!object(collected.inventory) || collected.inventory.kind !== 'inventory' || !Array.isArray(collected.inventory.accounts) || collected.inventory.accounts.length > 1000 || !Number.isSafeInteger(collected.inventory.creditAccounts) || collected.inventory.creditAccounts < 0 || collected.inventory.creditAccounts > collected.inventory.accounts.length || !Number.isSafeInteger(collected.consentExpiresAt)) return fail();
          const expiry = Math.min(first.expiresAt, collected.consentExpiresAt); fresh(expiry);
          const ids = new Set<string>(), accounts = Object.freeze(collected.inventory.accounts.map(row => {
            if (!object(row) || Object.keys(row).sort().join(',') !== 'currency,externalId,kind' || !uuid(row.externalId) || ids.has(row.externalId) || row.kind !== 'unknown' || row.currency !== null && (typeof row.currency !== 'string' || !/^[A-Z]{3}$/.test(row.currency))) return fail();
            ids.add(row.externalId); return Object.freeze({ externalId: row.externalId, kind: 'unknown' as const, currency: row.currency });
          }));
          const second = principal(await ports.authenticate(token, controller.signal)); fresh(expiry);
          if (second.ownerId !== first.ownerId) return fail('forbidden');
          const confirmed = context(await ports.resolve(scope, controller.signal), scope); fresh(Math.min(expiry, second.expiresAt));
          if (confirmed.itemId !== binding.itemId) return fail('conflict');
          const stored = await ports.store(binding, accounts, controller.signal); fresh(Math.min(expiry, second.expiresAt));
          if (stored !== true) return fail('conflict');
          return Object.freeze({ status: 'complete', registeredAccounts: accounts.length });
        };
        return await Promise.race([work(), stopped]);
      } catch (error) { return result(error instanceof Failure ? error.status : 'unavailable'); }
      finally {
        if (timer !== undefined) clearTimeout(timer);
        parent?.removeEventListener?.('abort', stop); controller.signal.removeEventListener('abort', stop); controller.abort();
        if (active === controller) active = null;
      }
    },
    close() { closed = true; active?.abort(); },
  });
}
