import { normalizeMovementPage, type MovementPageContext } from './movements.ts';
import type { PageRequest, PageWork } from './read-batch.ts';
import type { MemoryLedger, ImportTicket, OwnedMovement } from '../../data/local/ledger.ts';
export interface MovementStagerContext extends Omit<MovementPageContext, 'accountId' | 'confirmedOwnTransferIds'> {
  readonly accountIds: readonly string[];
  readonly confirmedOwnTransfers: readonly Readonly<{ accountId: string; movementId: string }>[];
}
export interface MovementStager {
  readonly kind: 'ready';
  prepare(envelope: unknown, request: PageRequest): PageWork;
  promote(assertFresh: () => undefined, signal: AbortSignal): undefined;
  clear(): undefined;
}
const uuid = (value: unknown): value is string => typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(value);
const cursor = (value: unknown): value is string | null => value === null || typeof value === 'string' && value.length > 0 && value.length <= 512 && !/[\u0000-\u001f\u007f]/.test(value);
function invalid(): never { throw new Error('invalid_movement_staging'); }
function list(value: unknown, max: number): readonly string[] {
  if (!Array.isArray(value) || value.length > max) return invalid();
  return Object.freeze([...value]);
}
export function createMovementStager(store: MemoryLedger, input: MovementStagerContext, policy: { enabled?: boolean; privateDataApproved?: boolean } = {}): MovementStager | Readonly<{ kind: 'disabled' }> {
  if (policy.enabled !== true || policy.privateDataApproved !== true) return Object.freeze({ kind: 'disabled' });
  let context: MovementStagerContext;
  try {
    if (!input || ['ownerSubject','connectionId','institutionId','month','allowedAccountIds','categoryIds','confirmedOwnTransfers','accountIds'].some(key => !Object.hasOwn(input,key))) return invalid();
    const evidence = input.confirmedOwnTransfers;
    if (!Array.isArray(evidence) || evidence.length > 10000) return invalid();
    const confirmedOwnTransfers = Object.freeze(evidence.map(ref => {
      if (!ref || !Object.hasOwn(ref,'accountId') || !Object.hasOwn(ref,'movementId')) return invalid();
      const accountId = ref.accountId, movementId = ref.movementId;
      if (!uuid(accountId) || !uuid(movementId)) return invalid();
      return Object.freeze({ accountId,movementId });
    }));
    context = Object.freeze({ ownerSubject: input.ownerSubject, connectionId: input.connectionId, institutionId: input.institutionId, month: input.month, allowedAccountIds: list(input.allowedAccountIds,10000), categoryIds: list(input.categoryIds,1000), confirmedOwnTransfers, accountIds: list(input.accountIds,100) });
    if (context.confirmedOwnTransfers.some(ref => !context.allowedAccountIds.includes(ref.accountId))) return invalid();
    if (context.accountIds.length === 0 || new Set(context.accountIds).size !== context.accountIds.length || !context.accountIds.every(id => uuid(id) && context.allowedAccountIds.includes(id))) return invalid();
    normalizeMovementPage({ connectionId: context.connectionId, accountId: context.accountIds[0], items: [], nextCursor: null, windowComplete: false, sourceUpdatedAt: null }, { ...context, accountId: context.accountIds[0], confirmedOwnTransferIds: context.confirmedOwnTransfers.filter(ref => ref.accountId === context.accountIds[0]).map(ref => ref.movementId) }, { enabled: true, privateDataApproved: true });
  } catch { return invalid(); }
  let closed = false, generation = 0, index = 0, pages = 0, received = 0;
  let globalCursor: string | null = null, accountCursor: string | null = null;
  let leaseId: string | undefined, revision: number | undefined;
  const tickets = new Map<string, ImportTicket>(), rows = new Map<string, Map<string, Readonly<OwnedMovement>>>();
  const seenGlobal = new Set<string>(), seenAccount = new Set<string>();
  const clear = (): undefined => {
    closed = true; generation++; rows.clear(); seenGlobal.clear(); seenAccount.clear();
    const pending = [...tickets.values()]; tickets.clear();
    for (const ticket of pending) { try { store.abortImport(ticket); } catch { /* Locked stores purge their own state. */ } }
  };
  const attempt = <T,>(work: () => T): T => { try { return work(); } catch { clear(); return invalid(); } };
  return Object.freeze({
    kind: 'ready' as const,
    prepare(envelope: unknown, request: PageRequest): PageWork {
      return attempt(() => {
        if (closed || index >= context.accountIds.length || !request || ['connectionId','revision','leaseId','product','cursor'].some(key => !Object.hasOwn(request,key))) return invalid();
        const req = Object.freeze({ connectionId: request.connectionId, revision: request.revision, leaseId: request.leaseId, product: request.product, cursor: request.cursor });
        if (req.connectionId !== context.connectionId || req.product !== 'transactions' || !uuid(req.leaseId) || !Number.isSafeInteger(req.revision) || req.revision < 1 || !cursor(req.cursor) || req.cursor !== globalCursor || leaseId !== undefined && (leaseId !== req.leaseId || revision !== req.revision)) return invalid();
        if (!envelope || typeof envelope !== 'object' || Array.isArray(envelope) || ['accountCursor','nextCursor','page'].some(key => !Object.hasOwn(envelope,key))) return invalid();
        const data = envelope as Record<string,unknown>, requestedAccountCursor = data.accountCursor, nextCursor = data.nextCursor, rawPage = data.page;
        if (!cursor(requestedAccountCursor) || requestedAccountCursor !== accountCursor || !cursor(nextCursor)) return invalid();
        const accountId = context.accountIds[index]!;
        const page = normalizeMovementPage(rawPage, { ...context, accountId, confirmedOwnTransferIds: context.confirmedOwnTransfers.filter(ref => ref.accountId === accountId).map(ref => ref.movementId) }, { enabled: true, privateDataApproved: true });
        if (page.kind !== 'page' || (nextCursor === null) !== (page.complete && index === context.accountIds.length - 1)) return invalid();
        const version = generation;
        const receipt = Object.freeze({ ...req, nextCursor, complete: nextCursor === null, rowCount: page.rowCount, partial: page.partial, authoritative: page.windowComplete && !page.partial, sourceUpdatedAt: page.sourceUpdatedAt });
        return Object.freeze({ receipt, stage(signal: AbortSignal): undefined {
          return attempt(() => {
            if (closed || version !== generation || !signal || signal.aborted || pages >= 100 || received + page.rowCount > 10000 || req.cursor !== globalCursor || requestedAccountCursor !== accountCursor || context.accountIds[index] !== accountId || leaseId !== undefined && (leaseId !== req.leaseId || revision !== req.revision) || nextCursor !== null && (nextCursor === req.cursor || seenGlobal.has(nextCursor)) || page.nextCursor !== null && (page.nextCursor === requestedAccountCursor || seenAccount.has(page.nextCursor))) return invalid();
            const candidate = new Map(rows.get(accountId));
            for (const movement of page.items) {
              const prior = candidate.get(movement.externalId);
              if (prior && JSON.stringify(prior) !== JSON.stringify(movement)) return invalid();
              candidate.set(movement.externalId,movement);
            }
            if (!tickets.has(accountId)) tickets.set(accountId,store.beginImport({ source: `connection:${context.connectionId}`, accountId, month: context.month }));
            rows.set(accountId,candidate); leaseId = req.leaseId; revision = req.revision;
            pages++; received += page.rowCount; generation++; globalCursor = nextCursor;
            if (nextCursor !== null) seenGlobal.add(nextCursor);
            if (page.complete) { index++; accountCursor = null; seenAccount.clear(); }
            else { accountCursor = page.nextCursor; seenAccount.add(page.nextCursor!); }
          });
        } });
      });
    },
    promote(assertFresh: () => undefined, signal: AbortSignal): undefined {
      return attempt(() => {
        if (closed || index !== context.accountIds.length || globalCursor !== null || tickets.size !== context.accountIds.length || !signal || signal.aborted || typeof assertFresh !== 'function') return invalid();
        const guard = (): undefined => { if (closed || signal.aborted || assertFresh() !== undefined || signal.aborted) return invalid(); };
        guard();
        store.promoteBatches(context.accountIds.map(accountId => ({ ticket: tickets.get(accountId)!, items: [...rows.get(accountId)!.values()], complete: true })),guard);
        tickets.clear(); clear();
      });
    },
    clear,
  });
}
