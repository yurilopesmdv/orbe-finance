import { createExactJsonDecoder } from './exact-json.ts';
import { createPluggyTargets } from './pluggy-targets.ts';
import { projectPluggyAccounts, type AccountProjectionContext } from './pluggy-accounts.ts';
import { readJsonResponse } from './http-json.ts';
import type { BridgeClock } from './bridge.ts';

type Configuration = { clientId: string; clientSecret: string };
type Transport = (url: string, init: RequestInit) => Promise<Response>;
export type PluggyAuthStatus = 'disabled' | 'unavailable' | 'cancelled' | 'busy' | 'rate_limited' | 'ready';
export interface PluggyAuthPort { authenticate(signal: AbortSignal): Promise<PluggyAuthStatus>; close(): void }
const systemClock: BridgeClock = {
  now: () => Date.now(),
  setTimer: (callback, ms) => setTimeout(callback, ms),
  clearTimer: handle => clearTimeout(handle as ReturnType<typeof setTimeout>),
};
const TTL = 119 * 60 * 1000;
const object = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value);

/** Server-only preparation. No deployed composition enables this fixture transport. */
function createCore(resolve: () => Configuration, options: { enabled?: boolean; fixtureOnly?: boolean; transport?: Transport; clock?: BridgeClock } = {}) {
  if (options.enabled !== true || options.fixtureOnly !== true) return Object.freeze({ authenticate: async () => 'disabled' as const, readAccounts: async (_context: AccountProjectionContext, _signal: AbortSignal) => ({ status: 'disabled' as const }), close() {} });
  let clientId: string, clientSecret: string, transport: Transport;
  let now: () => number, setTimer: BridgeClock['setTimer'], clearTimer: BridgeClock['clearTimer'];
  try {
    const config = resolve(), id = config.clientId, secret = config.clientSecret;
    if (typeof id !== 'string' || !/^[A-Za-z0-9_-]{1,256}$/.test(id) || typeof secret !== 'string' || !/^[A-Za-z0-9._~/-]{16,512}$/.test(secret) || typeof options.transport !== 'function') throw Error();
    clientId = id; clientSecret = secret; transport = options.transport;
    const clock = options.clock ?? systemClock;
    now = clock.now.bind(clock); setTimer = clock.setTimer.bind(clock); clearTimer = clock.clearTimer.bind(clock);
  } catch { return Object.freeze({ authenticate: async () => 'unavailable' as const, readAccounts: async (_context: AccountProjectionContext, _signal: AbortSignal) => ({ status: 'unavailable' as const }), close() {} }); }
  let key: string | null = null, expiresAt = 0, lastNow = -1, epoch = 0, closed = false;
  let expiryTimer: unknown, expiryScheduled = false;
  let inFlight: { controller: AbortController; stop(): void } | null = null;
  function clearKey() {
    key = null; expiresAt = 0;
    if (expiryScheduled) { expiryScheduled = false; try { clearTimer(expiryTimer); } catch { /* No provider content escapes. */ } }
  }
  function time(): number {
    let value: number;
    try { value = now(); } catch { clearKey(); throw Error(); }
    if (!Number.isSafeInteger(value) || value < 0 || value < lastNow) { clearKey(); throw Error(); }
    lastNow = value; return value;
  }
  let stopRead: (() => void) | null = null;
  const port = Object.freeze({
    async authenticate(signal: AbortSignal): Promise<PluggyAuthStatus> {
      if (closed) return 'unavailable';
      if (signal.aborted) return 'cancelled';
      let startedAt: number;
      try { startedAt = time(); } catch { return 'unavailable'; }
      if (key !== null && expiresAt > startedAt) return 'ready';
      clearKey();
      if (inFlight) return 'busy';
      const generation = epoch, controller = new AbortController();
      let stopReason: 'cancelled' | 'unavailable' | null = null;
      let resolveStop: (value: PluggyAuthStatus) => void = () => {};
      const stopped = new Promise<PluggyAuthStatus>(resolve => { resolveStop = resolve; });
      const stop = (reason: 'cancelled' | 'unavailable') => {
        if (stopReason) return;
        stopReason = reason; controller.abort(); resolveStop(reason);
      };
      const cancel = () => stop('cancelled');
      inFlight = { controller, stop: cancel };
      signal.addEventListener('abort', cancel, { once: true });
      let deadline: unknown, deadlineScheduled = false;
      try {
        deadline = setTimer(() => stop('unavailable'), 20000); deadlineScheduled = true;
        if (signal.aborted) { cancel(); return 'cancelled'; }
        const exchange = async (): Promise<PluggyAuthStatus | { apiKey: string }> => {
          let response: Response | undefined;
          try {
            response = await transport('https://api.pluggy.ai/auth', {
              method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json', 'Cache-Control': 'no-store' },
              body: JSON.stringify({ clientId, clientSecret }), signal: controller.signal,
              redirect: 'error', credentials: 'omit', cache: 'no-store', referrerPolicy: 'no-referrer',
            });
            if (controller.signal.aborted || closed || epoch !== generation || response.redirected) throw Error();
            if (response.status === 429) return 'rate_limited';
            if (response.status !== 200 || !response.ok) throw Error();
            const length = response.headers.get('content-length');
            if (length !== null && (!/^[0-9]+$/.test(length) || Number(length) > 4096)) throw Error();
            const data = await readJsonResponse(response, controller.signal, 4096);
            if (controller.signal.aborted || !object(data) || Object.keys(data).length !== 1 || typeof data.apiKey !== 'string' || !/^[A-Za-z0-9._~-]{16,4000}$/.test(data.apiKey)) throw Error();
            return { apiKey: data.apiKey };
          } catch { return stopReason ?? 'unavailable'; }
          finally { try { await response?.body?.cancel(); } catch { /* Already consumed or locked; no raw output. */ } }
        };
        const outcome = await Promise.race([exchange(), stopped]);
        if (typeof outcome === 'string') return outcome;
        if (controller.signal.aborted || signal.aborted || closed || epoch !== generation) return stopReason ?? 'cancelled';
        const completedAt = time();
        if (completedAt - startedAt >= 20000) return 'unavailable';
        key = outcome.apiKey; expiresAt = startedAt + TTL;
        expiryTimer = setTimer(clearKey, expiresAt - completedAt); expiryScheduled = true;
        return 'ready';
      } catch { clearKey(); return stopReason ?? 'unavailable'; }
      finally {
        if (deadlineScheduled) { try { clearTimer(deadline); } catch { /* Keep local state closed to the completed request. */ } }
        signal.removeEventListener('abort', cancel); controller.abort();
        if (inFlight?.controller === controller) inFlight = null;
      }
    },
    async readAccounts(rawContext: AccountProjectionContext, signal: AbortSignal): Promise<AccountReadResult> {
      if (closed) return Object.freeze({ status: 'unavailable' });
      if (signal.aborted) return Object.freeze({ status: 'cancelled' });
      if (stopRead) return Object.freeze({ status: 'busy' });
      let context: AccountProjectionContext, decode: ReturnType<typeof createExactJsonDecoder>, target: string;
      try {
        decode = createExactJsonDecoder();
        // Validate own fields before snapshotting. No provider data is needed here.
        projectPluggyAccounts(decode('{"page":1,"total":0,"totalPages":0,"results":[]}'), rawContext, { enabled: true, fixtureOnly: true });
        context = Object.freeze({ itemId: rawContext.itemId, connectionId: rawContext.connectionId,
          sourceUpdatedAt: rawContext.sourceUpdatedAt, coverageApproved: rawContext.coverageApproved,
          bindings: Object.freeze(rawContext.bindings.map(row => Object.freeze({ externalId: row.externalId, internalId: row.internalId, balanceAsOf: row.balanceAsOf, relation: row.relation }))) });
        projectPluggyAccounts(decode('{"page":1,"total":0,"totalPages":0,"results":[]}'), context, { enabled: true, fixtureOnly: true });
        target = createPluggyTargets({ itemId: context.itemId, accountIds: context.bindings.map(row => row.externalId) }).accounts();
      } catch { return Object.freeze({ status: 'unavailable' }); }
      const controller = new AbortController(), generation = epoch;
      let stopped = false, deadline: unknown, scheduled = false, start: number;
      let resolveStop: (value: AccountReadResult) => void = () => {};
      const interrupted = new Promise<AccountReadResult>(resolve => { resolveStop = resolve; });
      const stop = (status: 'cancelled' | 'unavailable') => { if (stopped) return; stopped = true; controller.abort(); resolveStop(Object.freeze({ status })); };
      const cancel = () => stop('cancelled'); stopRead = cancel;
      signal.addEventListener('abort', cancel, { once: true });
      try {
        start = time(); deadline = setTimer(() => stop('unavailable'), 20000); scheduled = true;
        if (signal.aborted) cancel();
        const work = async (): Promise<AccountReadResult> => {
          let response: Response | undefined;
          try {
            if (controller.signal.aborted) return { status: 'cancelled' };
            const auth = await port.authenticate(controller.signal);
            if (auth !== 'ready') return Object.freeze({ status: auth });
            if (controller.signal.aborted || closed || generation !== epoch || !key || time() - start >= 20000) throw Error();
            const requestKey = key;
            response = await transport(target, { method: 'GET', headers: { Accept: 'application/json', 'X-API-KEY': requestKey, 'Cache-Control': 'no-store' },
              signal: controller.signal, redirect: 'error', credentials: 'omit', cache: 'no-store', referrerPolicy: 'no-referrer' });
            if (controller.signal.aborted || closed || generation !== epoch || response.redirected) throw Error();
            if (response.status === 401 || response.status === 403) { clearKey(); throw Error(); }
            if (response.status === 429) return Object.freeze({ status: 'rate_limited' });
            if (response.status !== 200 || !response.ok) throw Error();
            const raw = await readJsonResponse(response, controller.signal, 131072, decode);
            if (controller.signal.aborted || closed || generation !== epoch || key !== requestKey || time() >= expiresAt || time() - start >= 20000) throw Error();
            const projected = projectPluggyAccounts(raw, context, { enabled: true, fixtureOnly: true });
            if (projected.kind !== 'page') throw Error();
            return Object.freeze({ status: 'complete', page: projected.page, coverage: projected.coverage });
          } catch { return Object.freeze({ status: controller.signal.aborted ? 'cancelled' : 'unavailable' }); }
          finally { try { void response?.body?.cancel().catch(() => {}); } catch { /* Never await an untrusted cancellation. */ } }
        };
        return await Promise.race([interrupted, work()]);
      } catch { return Object.freeze({ status: 'unavailable' }); }
      finally {
        controller.abort(); signal.removeEventListener('abort', cancel);
        if (scheduled) { try { clearTimer(deadline); } catch { /* No payload or credentials in errors. */ } }
        if (stopRead === cancel) stopRead = null;
      }
    },
    close() {
      closed = true; epoch++; clearKey(); stopRead?.(); inFlight?.stop();
      // Captured technical credentials can no longer be used by this instance.
      clientId = ''; clientSecret = '';
    },
  });
  return port;
}

type Projection = Extract<ReturnType<typeof projectPluggyAccounts>, { kind: 'page' }>;
export type AccountReadResult = Readonly<{ status: Exclude<PluggyAuthStatus, 'ready'> }> | Readonly<{ status: 'complete'; page: Projection['page']; coverage: Projection['coverage'] }>;
type Options = Parameters<typeof createCore>[1];
export function createPluggyAuthPort(resolve: () => Configuration, options: Options = {}): Readonly<PluggyAuthPort> {
  const core = createCore(resolve, options);
  return Object.freeze({ authenticate: core.authenticate, close: core.close });
}
/** Fixture-only internal provider port; caller must establish owner/session/lease. */
export function createPluggyAccountsPort(resolve: () => Configuration, options: Options = {}) {
  const core = createCore(resolve, options);
  return Object.freeze({ readAccounts: core.readAccounts, close: core.close });
}
