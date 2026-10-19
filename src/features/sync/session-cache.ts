import { MemoryAssets } from '../../data/local/assets.ts';
import { MemoryLedger } from '../../data/local/ledger.ts';
import type { MovementFilters } from '../../data/local/query.ts';
import type { MemoryPrincipal } from '../../data/local/scope.ts';
import { runProductBatch, type ProductBatchResult, type ProductTransport } from './product-batch.ts';
import type { BatchClock } from './read-batch.ts';
export interface SessionAccess {
  assertUnlocked(): void;
  getSnapshot(): Readonly<{ state: string }>;
  subscribe(listener: () => void): () => void;
}
export interface SyncSession {
  readonly kind: 'ready'; readonly scopeId: string;
  getSnapshot(): Readonly<{ state: 'active' | 'closed'; running: boolean }>;
  queryAssets(filters?: Parameters<MemoryAssets['list']>[0], sourceComplete?: boolean): ReturnType<MemoryAssets['list']>;
  queryMovements(filters: MovementFilters, sourceComplete?: boolean): ReturnType<MemoryLedger['list']>;
  run(metadata: unknown, contexts: unknown, transport: ProductTransport, options?: { clock?: BatchClock }): Promise<ProductBatchResult>;
  cancel(): void;
  close(): void;
}
function unavailable(): never { throw new Error('sync_session_unavailable'); }
const outcome = (status: 'busy'|'cancelled'): ProductBatchResult => Object.freeze({ status,publishedProducts:Object.freeze([]) });
// scopeFactory supplies a new LOCAL opaque UUID. Never decode an Auth subject/token.
// Runtime-specific generation and production cache remain gated outside this module.
export function createSyncSession(session: SessionAccess, scopeFactory: () => string, policy: { enabled?: boolean; privateDataApproved?: boolean } = {}): SyncSession | Readonly<{ kind:'disabled' }> {
  if (policy.enabled !== true || policy.privateDataApproved !== true) return Object.freeze({ kind:'disabled' });
  let assets: MemoryAssets | undefined, ledger: MemoryLedger | undefined, unsubscribe: (() => void) | undefined;
  let principal: MemoryPrincipal | null = null, active: AbortController | undefined, closed = false;
  const close = () => {
    if (closed) return; closed = true; principal = null; const pending = active; active = undefined; pending?.abort();
    assets?.close(); ledger?.close();
    const stop = unsubscribe; unsubscribe = undefined; try { stop?.(); } catch { /* No raw listener errors. */ }
  };
  try {
    const verify = session.assertUnlocked, snapshot = session.getSnapshot, subscribe = session.subscribe;
    if (typeof verify !== 'function' || typeof snapshot !== 'function' || typeof subscribe !== 'function' || typeof scopeFactory !== 'function') return unavailable();
    const assertCurrent = (): void => {
      try { if (closed || verify.call(session) !== undefined || snapshot.call(session).state !== 'unlocked') throw new Error(); }
      catch { close(); return unavailable(); }
    };
    assertCurrent();
    const scopeId = scopeFactory();
    if (typeof scopeId !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(scopeId)) return unavailable();
    principal = Object.freeze({ subject:scopeId,generation:0,unlocked:true });
    assets = new MemoryAssets(()=>principal); ledger = new MemoryLedger(()=>principal);
    const assetStore = assets, ledgerStore = ledger;
    const stop = subscribe.call(session,()=>{ try { if (snapshot.call(session).state !== 'unlocked') close(); } catch { close(); } });
    if (typeof stop !== 'function') return unavailable();
    if (closed) { try { stop(); } catch {} return unavailable(); }
    unsubscribe = stop; assertCurrent();
    return Object.freeze<SyncSession>({
      kind:'ready' as const,scopeId,
      getSnapshot:()=>Object.freeze({ state:closed ? 'closed' as const : 'active' as const,running:active !== undefined }),
      queryAssets(filters: Parameters<MemoryAssets['list']>[0] = {}, sourceComplete = false) { assertCurrent(); return assetStore.list(filters,sourceComplete); },
      queryMovements(filters: MovementFilters, sourceComplete = false) { assertCurrent(); return ledgerStore.list(filters,sourceComplete); },
      async run(metadata: unknown, contexts: unknown, transport: ProductTransport, options: { clock?: BatchClock } = {}): Promise<ProductBatchResult> {
        try { assertCurrent(); } catch { return outcome('cancelled'); }
        if (active) return outcome('busy');
        const controller = new AbortController(); active = controller;
        try {
          return await runProductBatch(metadata,contexts,{ assets:assetStore,ledger:ledgerStore },transport,{ enabled:true,privateDataApproved:true,assertCurrent,signal:controller.signal,clock:options.clock,expectedOwnerSubject:scopeId });
        } catch { return Object.freeze({ status:'failed',publishedProducts:Object.freeze([]) }); }
        finally { controller.abort(); if (active === controller) active = undefined; }
      },
      cancel:()=>{ active?.abort(); },
      close,
    });
  } catch { close(); return unavailable(); }
}
