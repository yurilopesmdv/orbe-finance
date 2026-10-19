import { normalizeConnection, type ConnectionProduct } from '../../domain/connections.ts';
import { runReadBatch, type BatchResult, type BatchClock, type BatchScope, type PageRequest } from './read-batch.ts';
import { createAccountStager } from './account-staging.ts';
import { createMovementStager } from './movement-staging.ts';
import { createPositionStager } from './position-staging.ts';
import type { AccountPageContext } from './accounts.ts';
import type { MovementStagerContext } from './movement-staging.ts';
import type { PositionPageContext } from './positions.ts';
import type { AssetStager } from './asset-staging.ts';
import type { MemoryAssets } from '../../data/local/assets.ts';
import type { MemoryLedger } from '../../data/local/ledger.ts';
export interface ProductStores { readonly assets: MemoryAssets; readonly ledger: MemoryLedger }
export interface ProductTransport {
  acquire(scope: BatchScope, signal: AbortSignal): Promise<unknown>;
  readPage(request: PageRequest, signal: AbortSignal): Promise<unknown>;
  finalize(scope: BatchScope & { readonly leaseId: string }, signal: AbortSignal): Promise<unknown>;
}
export type ProductBatchResult = BatchResult & Readonly<{ publishedProducts: readonly ConnectionProduct[] }>;
const contextFields = {
  accounts:['ownerSubject','connectionId','institutionId','allowedAccountIds'],
  transactions:['ownerSubject','connectionId','institutionId','month','allowedAccountIds','categoryIds','confirmedOwnTransfers','accountIds'],
  investments:['ownerSubject','connectionId','institutionId','product','allowedPositionIds','allowedParents'],
  reserves:['ownerSubject','connectionId','institutionId','product','allowedPositionIds','allowedParents'],
} as const;
const object = (value: unknown): value is Record<string,unknown> => !!value && typeof value === 'object' && !Array.isArray(value);
function invalid(): never { throw new Error('invalid_product_batch'); }
export async function runProductBatch(rawMetadata: unknown, contexts: unknown, stores: ProductStores, transport: ProductTransport, options: { enabled?: boolean; privateDataApproved?: boolean; assertCurrent?: () => void; signal?: AbortSignal; clock?: BatchClock } = {}): Promise<ProductBatchResult> {
  const published: ConnectionProduct[] = [];
  const result = (value: BatchResult): ProductBatchResult => Object.freeze({ ...value,publishedProducts:Object.freeze([...published]) });
  if (options.enabled !== true || options.privateDataApproved !== true) return result({ status:'disabled' });
  const assertCurrent = options.assertCurrent;
  try { if (typeof assertCurrent !== 'function') return result({ status:'cancelled' }); assertCurrent(); } catch { return result({ status:'cancelled' }); }
  const signal = options.signal;
  if (!signal || signal.aborted) return result({ status:'cancelled' });
  const stagers = new Map<ConnectionProduct,AssetStager>(); let cleared = false;
  const clear = (): undefined => { if (cleared) return; cleared = true; for (const stager of stagers.values()) { try { stager.clear(); } catch { /* No raw errors or cache deletion. */ } } };
  try {
    const clock = options.clock;
    const metadata = normalizeConnection(rawMetadata,{ integrationEnabled:true,privateDataApproved:true,now:clock ? clock.now() : Date.now() });
    if (metadata.kind !== 'connection' || metadata.readableProducts.length === 0) return result({ status:'unavailable' });
    if (!object(contexts) || !Object.hasOwn(contexts,'ownerSubject')) return invalid();
    const ownerSubject = contexts.ownerSubject;
    if (typeof ownerSubject !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(ownerSubject)) return invalid();
    const approved = { enabled:true,privateDataApproved:true };
    for (const product of metadata.readableProducts) {
      if (!Object.hasOwn(contexts,product)) return invalid();
      const raw = contexts[product];
      if (!object(raw) || contextFields[product].some(key => !Object.hasOwn(raw,key))) return invalid();
      const context = Object.fromEntries(contextFields[product].map(key => [key,raw[key]]));
      if (context.ownerSubject !== ownerSubject || context.connectionId !== metadata.id || context.institutionId !== metadata.institution) return invalid();
      let stage;
      if (product === 'accounts') stage = createAccountStager(stores.assets,context as unknown as AccountPageContext,approved);
      else if (product === 'transactions') stage = createMovementStager(stores.ledger,context as unknown as MovementStagerContext,approved);
      else {
        if (context.product !== (product === 'investments' ? 'investment' : 'reserve')) return invalid();
        stage = createPositionStager(stores.assets,context as unknown as PositionPageContext,approved);
      }
      if (stage.kind !== 'ready') return invalid();
      stagers.set(product,stage);
    }
    const acquire = transport.acquire, readPage = transport.readPage, finalize = transport.finalize;
    if (typeof acquire !== 'function' || typeof readPage !== 'function' || typeof finalize !== 'function') return invalid();
    // Eligible states are derived from active only. Reuse a captured canonical DTO.
    const capturedMetadata = Object.freeze({ id:metadata.id,institution:metadata.institution,revision:metadata.revision,state:'active',capabilities:metadata.capabilities,openFinanceVerifiedAt:metadata.openFinanceVerifiedAt,proxyConsentExpiresAt:metadata.proxyConsentExpiresAt,bankConsentExpiresAt:metadata.bankConsentExpiresAt,sourceUpdatedAt:metadata.sourceUpdatedAt,lastReadAt:metadata.lastReadAt });
    return result(await runReadBatch(capturedMetadata,{
      acquire:(scope,child)=>acquire.call(transport,scope,child),
      async readPage(request,child) {
        const raw = await readPage.call(transport,request,child);
        if (child.aborted) return invalid();
        assertCurrent();
        const stager = stagers.get(request.product); if (!stager) return invalid();
        return stager.prepare(raw,request);
      },
      finalize:(scope,child)=>finalize.call(transport,scope,child),
      promote(fresh,child): undefined {
        for (const product of metadata.readableProducts) {
          fresh(); if (child.aborted) return invalid();
          stagers.get(product)!.promote(fresh,child); published.push(product);
        }
      },
      clearStaging:clear,
    },{ ...approved,assertCurrent,signal,clock }));
  } catch { return result({ status:'failed' }); }
  finally { clear(); }
}
