import { resolveExecutionMode, type ExecutionPolicy } from './execution-mode.ts';
import { readJsonResponse } from './http-json.ts';
import type { BridgeClock } from './bridge.ts';
const uuid = (raw: unknown): raw is string => typeof raw === 'string' && raw.length === 36 && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(raw);
type Configuration = { origin: string; secretKey: string };
type Transport = (url: string, init: RequestInit) => Promise<Response>;
const defaultClock: BridgeClock = { now: Date.now, setTimer: (fn, ms) => setTimeout(fn, ms), clearTimer: id => clearTimeout(id as ReturnType<typeof setTimeout>) };
function unavailable(): never { throw Error('movement_progress_unavailable'); }
export interface MovementReadScope { ownerId: string; connectionId: string; revision: number; leaseId: string; sessionId: string }
export interface MovementPageScope extends MovementReadScope { month: string; cursorHash: string }
export interface MovementPageCommit extends MovementPageScope { claimId: string; nextHash: string | null; rowCount: number }
const hash = (value: unknown): value is string => typeof value === 'string' && /^[0-9a-f]{64}$/.test(value);
const record = (raw: unknown): raw is Record<string, unknown> => typeof raw === 'object' && raw !== null && !Array.isArray(raw);
function scope(raw: MovementReadScope) {
  if (!record(raw) || !['ownerId','connectionId','revision','leaseId','sessionId'].every(key => Object.hasOwn(raw,key))) return unavailable();
  const { ownerId, connectionId, revision, leaseId, sessionId } = raw;
  if (!uuid(ownerId) || !uuid(connectionId) || !uuid(leaseId) || !uuid(sessionId) || !Number.isSafeInteger(revision) || revision < 1) return unavailable();
  return { p_owner_id: ownerId, p_connection_id: connectionId, p_revision: revision, p_lease_id: leaseId, p_session_id: sessionId };
}
function page(raw: MovementPageScope) {
  const captured = scope(raw), { month, cursorHash } = raw;
  if (!Object.hasOwn(raw,'month') || !Object.hasOwn(raw,'cursorHash') || typeof month !== 'string' || month.length !== 7 || !/^20[0-9]{2}-(0[1-9]|1[0-2])$/.test(month) || !hash(cursorHash)) return unavailable();
  return { ...captured, p_month: month, p_cursor_hash: cursorHash };
}
export function createMovementProgressPorts(resolveConfig: () => Configuration, options: ExecutionPolicy & { enabled?: boolean; transport?: Transport; clock?: BridgeClock } = {}) {
  if (options.enabled !== true || resolveExecutionMode(options) === null) return Object.freeze({
    resolve: async (_scope: MovementReadScope, _signal: AbortSignal): Promise<unknown> => null,
    claim: async (_scope: MovementPageScope, _signal: AbortSignal): Promise<Readonly<{claimId:string;pageNumber:number;leaseExpiresAt:number}> | null> => null,
    commit: async (_scope: MovementPageCommit, _signal: AbortSignal) => false,
  });
  let origin: string, secretKey: string, transport: Transport;
  try {
    const config = resolveConfig(); origin = config.origin; secretKey = config.secretKey;
    if (!/^https:\/\/[a-z]{20}\.supabase\.co$/.test(origin) || !/^sb_secret_[A-Za-z0-9_-]{1,512}$/.test(secretKey) || typeof options.transport !== 'function') return unavailable();
    transport = options.transport;
  } catch { return unavailable(); }
  const clock = options.clock ?? defaultClock;
  async function call(endpoint: 'orbe_resolve_movement_read' | 'orbe_claim_movement_page' | 'orbe_commit_movement_page', body: unknown, signal: AbortSignal): Promise<unknown> {
    if (signal.aborted) return unavailable();
    const payload = JSON.stringify(body), controller = new AbortController(); let timer: unknown, set = false, abort: (() => void) | undefined, response: Response | undefined;
    try {
      const start = clock.now(); if (!Number.isSafeInteger(start) || start < 0) return unavailable();
      const deadline = new Promise<never>((_, reject) => {
        abort = () => { controller.abort(); reject(Error('movement_progress_unavailable')); }; signal.addEventListener('abort', abort, { once: true });
        timer = clock.setTimer(abort, 20000); set = true;
      });
      const work = async () => {
        if (controller.signal.aborted || signal.aborted) return unavailable();
        response = await transport(origin + '/rest/v1/rpc/' + endpoint, { method: 'POST',
          headers: { apikey: secretKey, 'Content-Type': 'application/json', Accept: 'application/json', 'Cache-Control': 'no-store' },
          body: payload, signal: controller.signal, redirect: 'error', credentials: 'omit', cache: 'no-store', referrerPolicy: 'no-referrer' });
        if (controller.signal.aborted || signal.aborted || response.redirected || response.status !== 200) return unavailable();
        const result = await readJsonResponse(response, controller.signal, 131072), end = clock.now();
        if (controller.signal.aborted || signal.aborted || !Number.isSafeInteger(end) || end < start || end - start >= 20000) return unavailable();
        return result;
      };
      return await Promise.race([deadline, work()]);
    } catch { return unavailable(); }
    finally { controller.abort(); if (abort) signal.removeEventListener('abort', abort); if (set) { try { clock.clearTimer(timer); } catch { /* Generic failure only. */ } } try { void response?.body?.cancel().catch(() => {}); } catch { /* Best effort. */ } }
  }
  return Object.freeze({
    resolve: (input: MovementReadScope, signal: AbortSignal) => call('orbe_resolve_movement_read', scope(input), signal),
    claim: async (input: MovementPageScope, signal: AbortSignal): Promise<Readonly<{claimId:string;pageNumber:number;leaseExpiresAt:number}> | null> => {
      const raw = await call('orbe_claim_movement_page', page(input), signal);
      if (raw === null) return null;
      const now = clock.now();
      if (!record(raw) || !['claimId','pageNumber','leaseExpiresAt'].every(key => Object.hasOwn(raw,key)) || !uuid(raw.claimId) || !Number.isInteger(raw.pageNumber) || (raw.pageNumber as number) < 1 || (raw.pageNumber as number) > 100 || typeof raw.leaseExpiresAt !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,6})?(?:Z|[+-]\d{2}:\d{2})$/.test(raw.leaseExpiresAt)) return unavailable();
      const expiry = Date.parse(raw.leaseExpiresAt);
      if (!Number.isSafeInteger(now) || now < 0 || !Number.isSafeInteger(expiry) || expiry <= now || expiry > now + 120000) return unavailable();
      return Object.freeze({ claimId: raw.claimId, pageNumber: raw.pageNumber as number, leaseExpiresAt: expiry });
    },
    commit: async (input: MovementPageCommit, signal: AbortSignal): Promise<boolean> => {
      const captured = page(input), { claimId, nextHash, rowCount } = input;
      if (!['claimId','nextHash','rowCount'].every(key => Object.hasOwn(input,key)) || !uuid(claimId) || nextHash !== null && !hash(nextHash) || !Number.isInteger(rowCount) || rowCount < 0 || rowCount > 500) return unavailable();
      const raw = await call('orbe_commit_movement_page', { ...captured, p_claim_id: claimId, p_next_hash: nextHash, p_row_count: rowCount }, signal);
      if (typeof raw !== 'boolean') return unavailable();
      return raw;
    },
  });
}
