import { selectReadProducts } from './product-scope.ts';
import { normalizeConnection, type ConnectionProduct } from '../../domain/connections.ts';
import { occurrenceMonth } from '../../domain/money.ts';
export interface BatchClock { now(): number; setTimer(callback: () => void, milliseconds: number): unknown; clearTimer(handle: unknown): void }
export interface BatchScope { readonly connectionId: string; readonly revision: number }
export interface PageRequest extends BatchScope { readonly leaseId: string; readonly product: ConnectionProduct; readonly cursor: string | null }
// Constructed by trusted local normalizers. Never deserialize executable work from HTTP.
export interface PageWork { receipt: unknown; stage(signal: AbortSignal): undefined }
export interface BatchPorts {
  acquire(scope: BatchScope, signal: AbortSignal): Promise<unknown>;
  readPage(request: PageRequest, signal: AbortSignal): Promise<PageWork>;
  finalize(scope: BatchScope & { readonly leaseId: string }, signal: AbortSignal): Promise<unknown>;
  promote(assertFresh: () => undefined, signal: AbortSignal): undefined;
  clearStaging(): undefined;
}
export interface ProductReadSummary { product: ConnectionProduct; pages: number; rows: number; partial: boolean; authoritative: boolean; sourceUpdatedAt: string | null }
export type BatchResult =
  | Readonly<{ status: 'disabled' | 'unavailable' | 'busy' | 'failed' | 'cancelled' }>
  | Readonly<{ status: 'cooldown'; nextReadAt: string }>
  | Readonly<{ status: 'complete'; partial: boolean; products: ReadonlyArray<Readonly<ProductReadSummary>> }>;
class Failure extends Error {
  readonly status: 'failed' | 'cancelled';
  constructor(status: 'failed' | 'cancelled') { super(status); this.status = status; }
}
function invalid(): never { throw new Failure('failed'); }
const record = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value);
const uuid = (value: unknown): value is string => typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(value);
function instant(value: unknown): string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?(?:Z|[+-]\d{2}:\d{2})$/.test(value)) return invalid();
  try { occurrenceMonth(value); } catch { return invalid(); }
  const time = /T(\d{2}):(\d{2}):(\d{2})/.exec(value)!;
  if (Number(time[1]) > 23 || Number(time[2]) > 59 || Number(time[3]) > 59) return invalid();
  return new Date(value).toISOString();
}
function validCursor(value: unknown): value is string | null { return value === null || typeof value === 'string' && value.length > 0 && value.length <= 512 && !/[\u0000-\u001f\u007f]/.test(value); }
const defaultClock: BatchClock = { now: () => Date.now(), setTimer: (callback, ms) => setTimeout(callback, ms), clearTimer: handle => clearTimeout(handle as ReturnType<typeof setTimeout>) };

export async function runReadBatch(rawConnection: unknown, ports: BatchPorts, options: { enabled?: boolean; privateDataApproved?: boolean; assertCurrent?: () => void; signal?: AbortSignal; clock?: BatchClock; products?: readonly ConnectionProduct[] } = {}): Promise<BatchResult> {
  if (options.enabled !== true || options.privateDataApproved !== true) return Object.freeze({ status: 'disabled' });
  let controller: AbortController | undefined;
  let parent: AbortSignal | undefined, abort: (() => void) | undefined;
  let leaseTimer: unknown, leaseTimerSet = false, staged = false;
  let clock: BatchClock | undefined;
  try {
    const assertCurrent = options.assertCurrent;
    if (typeof assertCurrent !== 'function') return Object.freeze({ status: 'cancelled' });
    const checkSession = () => { try { assertCurrent(); } catch { throw new Failure('cancelled'); } };
    checkSession();
    parent = options.signal;
    if (!parent || parent.aborted) return Object.freeze({ status: 'cancelled' });
    clock = options.clock ?? defaultClock;
    const metadata = normalizeConnection(rawConnection, { integrationEnabled: true, privateDataApproved: true, now: clock.now() });
    if (metadata.kind !== 'connection' || metadata.readableProducts.length === 0) return Object.freeze({ status: 'unavailable' });
    const selectedProducts = selectReadProducts(metadata.readableProducts, options.products);
    const scope = Object.freeze({ connectionId: metadata.id, revision: metadata.revision });
    controller = new AbortController(); const root = controller;
    let deadline = Infinity;
    abort = () => root.abort(); parent.addEventListener('abort', abort, { once: true });
    const assertFresh = (): undefined => {
      checkSession();
      const time = clock!.now();
      if (!Number.isSafeInteger(time)) invalid();
      if (root.signal.aborted || time >= deadline || metadata.authorizationExpiresAt !== null && time >= Date.parse(metadata.authorizationExpiresAt)) { root.abort(); throw new Failure('cancelled'); }
    };
    async function request<T>(work: (signal: AbortSignal) => Promise<T>): Promise<T> {
      assertFresh(); const child = new AbortController(); let timer: unknown, set = false, stop: (() => void) | undefined;
      try {
        const interruption = new Promise<never>((_, reject) => {
          stop = () => { child.abort(); reject(new Failure('cancelled')); }; root.signal.addEventListener('abort', stop, { once: true });
          timer = clock!.setTimer(() => { child.abort(); reject(new Failure('failed')); }, 20000); set = true;
        });
        const result = await Promise.race([interruption, (async () => { const value = await work(child.signal); if (child.signal.aborted) throw new Failure('cancelled'); return value; })()]);
        assertFresh(); return result;
      } finally { if (stop) root.signal.removeEventListener('abort', stop); if (set) clock!.clearTimer(timer); child.abort(); }
    }
    const grant = await request(signal => ports.acquire(scope, signal));
    if (!record(grant)) invalid();
    if (grant.status === 'disabled' || grant.status === 'unavailable' || grant.status === 'busy') return Object.freeze({ status: grant.status === 'disabled' ? 'unavailable' : grant.status });
    if (grant.status === 'cooldown') {
      const nextReadAt = instant(grant.nextReadAt); if (Date.parse(nextReadAt) <= clock.now() || Date.parse(nextReadAt) > clock.now() + 960000) invalid();
      return Object.freeze({ status: 'cooldown', nextReadAt });
    }
    if (grant.status !== 'acquired' || !uuid(grant.leaseId) || grant.revision !== scope.revision) invalid();
    const leaseId = grant.leaseId, expiresAt = instant(grant.expiresAt), nextReadAt = instant(grant.nextReadAt);
    if (Date.parse(expiresAt) <= clock.now() || Date.parse(expiresAt) > clock.now() + 180000 || ![780000,-90000].includes(Date.parse(nextReadAt) - Date.parse(expiresAt))) invalid();
    deadline = Math.min(Date.parse(expiresAt), metadata.authorizationExpiresAt === null ? Infinity : Date.parse(metadata.authorizationExpiresAt));
    assertFresh(); staged = true;
    leaseTimer = clock.setTimer(abort, Math.max(1, deadline - clock.now())); leaseTimerSet = true;
    const summaries: ProductReadSummary[] = [];
    for (const product of selectedProducts) {
      const seen = new Set<string>(); let cursor: string | null = null, pages = 0, rows = 0, partial = false, authoritative = true;
      let sourceUpdatedAt: string | null | undefined; let consistentSource = true;
      while (true) {
        if (pages >= 100) invalid();
        const context: PageRequest = Object.freeze({ ...scope, leaseId, product, cursor });
        const work: PageWork = await request(signal => ports.readPage(context, signal));
        assertFresh();
        if (!record(work) || typeof work.stage !== 'function' || !record(work.receipt)) invalid();
        const receipt: Record<string, unknown> = work.receipt;
        if (receipt.connectionId !== scope.connectionId || receipt.revision !== scope.revision || receipt.leaseId !== leaseId || receipt.product !== product || !Number.isSafeInteger(receipt.rowCount) || (receipt.rowCount as number) < 0 || (receipt.rowCount as number) > 1000 || !validCursor(receipt.nextCursor) || typeof receipt.complete !== 'boolean' || receipt.complete !== (receipt.nextCursor === null) || typeof receipt.partial !== 'boolean' || typeof receipt.authoritative !== 'boolean') invalid();
        const next: string | null = receipt.nextCursor;
        if (next !== null && (next === cursor || seen.has(next))) invalid();
        const source = receipt.sourceUpdatedAt === null ? null : instant(receipt.sourceUpdatedAt);
        if (source !== null && Date.parse(source) > clock.now() + 60000) invalid();
        rows += receipt.rowCount as number; if (rows > 10000) invalid(); pages++;
        partial ||= receipt.partial; authoritative &&= receipt.authoritative;
        if (source === null || sourceUpdatedAt !== undefined && sourceUpdatedAt !== source) { partial = true; authoritative = false; consistentSource = false; }
        sourceUpdatedAt = source;
        assertFresh(); if (work.stage(root.signal) !== undefined) invalid(); assertFresh();
        if (next === null) break;
        seen.add(next); cursor = next;
      }
      summaries.push({ product, pages, rows, partial, authoritative: authoritative && !partial, sourceUpdatedAt: consistentSource ? sourceUpdatedAt ?? null : null });
    }
    assertFresh();
    if (await request(signal => ports.finalize(Object.freeze({ ...scope, leaseId }), signal)) !== true) invalid();
    assertFresh(); if (ports.promote(assertFresh, root.signal) !== undefined) invalid(); assertFresh();
    return Object.freeze({ status: 'complete', partial: selectedProducts.length < metadata.readableProducts.length || metadata.state === 'partial' || summaries.some(value => value.partial || !value.authoritative), products: Object.freeze(summaries.map(value => Object.freeze({ ...value }))) });
  } catch (error) {
    return Object.freeze({ status: error instanceof Failure ? error.status : 'failed' });
  } finally {
    if (abort && parent) parent.removeEventListener('abort', abort);
    if (leaseTimerSet && clock) clock.clearTimer(leaseTimer);
    controller?.abort();
    if (staged) { try { ports.clearStaging(); } catch { /* Clear only per-run staging; no raw error/log or cache deletion. */ } }
  }
}
