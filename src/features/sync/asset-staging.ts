import type { PageRequest, PageWork } from './read-batch.ts';
import type { MemoryAssets, AssetTicket, OwnedAsset, AssetScope } from '../../data/local/assets.ts';
export interface AssetPage {
  readonly kind: 'page'; readonly items: readonly Readonly<OwnedAsset>[]; readonly rowCount: number;
  readonly nextCursor: string | null; readonly complete: boolean; readonly authoritative: boolean; readonly partial: boolean; readonly sourceUpdatedAt: string | null;
}
export interface AssetStager {
  readonly kind: 'ready';
  prepare(raw: unknown, request: PageRequest): PageWork;
  promote(assertFresh: () => undefined, signal: AbortSignal): undefined;
  clear(): undefined;
}
const uuid = (value: unknown): value is string => typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(value);
const validCursor = (value: unknown): value is string | null => value === null || typeof value === 'string' && value.length > 0 && value.length <= 512 && !/[\u0000-\u001f\u007f]/.test(value);
// Internal engine: only concrete, validated local factories supply normalizePage.
// This function is never accepted from a transport payload.
export function createAssetStager(store: MemoryAssets, input: AssetScope, normalizePage: (raw: unknown) => AssetPage, failureCode: 'invalid_account_staging' | 'invalid_position_staging', policy: { enabled?: boolean; privateDataApproved?: boolean } = {}): AssetStager | Readonly<{ kind: 'disabled' }> {
  if (policy.enabled !== true || policy.privateDataApproved !== true) return Object.freeze({ kind: 'disabled' });
  function invalid(): never { throw new Error(failureCode); }
  let context: Readonly<AssetScope>;
  try {
    context = Object.freeze({ connectionId: input.connectionId, institutionId: input.institutionId, product: input.product });
    if (!uuid(context.connectionId) || !['bradesco','mercado-pago','inter','nubank'].includes(context.institutionId) || !['account','investment','reserve'].includes(context.product) || typeof normalizePage !== 'function') return invalid();
  } catch { return invalid(); }
  const coordinatorProduct = { account: 'accounts', investment: 'investments', reserve: 'reserves' }[context.product];
  let closed = false, generation = 0, ticket: AssetTicket | undefined;
  let leaseId: string | undefined, revision: number | undefined, expectedCursor: string | null = null;
  let complete = false, pages = 0, receivedRows = 0, authoritative = true;
  let source: string | null | undefined;
  const rows = new Map<string, Readonly<OwnedAsset>>(), seen = new Set<string>();
  const clear = (): undefined => {
    closed = true; generation++; rows.clear(); seen.clear();
    const previous = ticket; ticket = undefined;
    if (previous) { try { store.abortImport(previous); } catch { /* A locked store purges its own memory. */ } }
  };
  const attempt = <T,>(work: () => T): T => { try { return work(); } catch { clear(); return invalid(); } };
  return Object.freeze({
    kind: 'ready' as const,
    prepare(raw: unknown, request: PageRequest): PageWork {
      return attempt(() => {
        if (closed || complete || !request || ['connectionId', 'revision', 'leaseId', 'product', 'cursor'].some(key => !Object.hasOwn(request, key))) return invalid();
        const req = Object.freeze({ connectionId: request.connectionId, revision: request.revision, leaseId: request.leaseId, product: request.product, cursor: request.cursor });
        if (req.connectionId !== context.connectionId || req.product !== coordinatorProduct || !uuid(req.leaseId) || !Number.isSafeInteger(req.revision) || req.revision < 1 || !validCursor(req.cursor) || req.cursor !== expectedCursor || leaseId !== undefined && (leaseId !== req.leaseId || revision !== req.revision)) return invalid();
        const page = normalizePage(raw);
        if (page.kind !== 'page') return invalid();
        const version = generation;
        const receipt = Object.freeze({ ...req, rowCount: page.rowCount, nextCursor: page.nextCursor, complete: page.complete, authoritative: page.authoritative, partial: page.partial, sourceUpdatedAt: page.sourceUpdatedAt });
        return Object.freeze({ receipt, stage(signal: AbortSignal): undefined {
          return attempt(() => {
            if (closed || complete || version !== generation || !signal || signal.aborted || pages >= 100 || receivedRows + page.rowCount > 10000 || req.cursor !== expectedCursor || leaseId !== undefined && (leaseId !== req.leaseId || revision !== req.revision) || page.nextCursor !== null && (page.nextCursor === req.cursor || seen.has(page.nextCursor))) return invalid();
            const candidate = new Map(rows);
            for (const row of page.items) {
              const prior = candidate.get(row.id);
              if (prior && JSON.stringify(prior) !== JSON.stringify(row)) return invalid();
              candidate.set(row.id, row);
            }
            ticket ??= store.beginImport({ connectionId: context.connectionId, institutionId: context.institutionId, product: context.product });
            leaseId = req.leaseId; revision = req.revision;
            for (const [id, row] of candidate) rows.set(id, row);
            authoritative &&= page.authoritative && !page.partial && page.sourceUpdatedAt !== null && (source === undefined || source === page.sourceUpdatedAt);
            source = page.sourceUpdatedAt; receivedRows += page.rowCount; pages++; generation++;
            complete = page.complete; expectedCursor = page.nextCursor;
            if (page.nextCursor !== null) seen.add(page.nextCursor);
          });
        } });
      });
    },
    promote(assertFresh: () => undefined, signal: AbortSignal): undefined {
      return attempt(() => {
        if (closed || !complete || !ticket || !signal || signal.aborted || typeof assertFresh !== 'function') return invalid();
        const guard = (): undefined => {
          if (closed || signal.aborted || assertFresh() !== undefined || signal.aborted) return invalid();
        };
        guard(); store.promote(ticket, [...rows.values()], true, authoritative, guard);
        ticket = undefined; clear();
      });
    },
    clear,
  });
}
