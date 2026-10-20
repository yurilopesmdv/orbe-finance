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
export function createPluggyAuthPort(resolve: () => Configuration, options: { enabled?: boolean; fixtureOnly?: boolean; transport?: Transport; clock?: BridgeClock } = {}): Readonly<PluggyAuthPort> {
  if (options.enabled !== true || options.fixtureOnly !== true) return Object.freeze({ authenticate: async () => 'disabled' as const, close() {} });
  let clientId: string, clientSecret: string, transport: Transport;
  let now: () => number, setTimer: BridgeClock['setTimer'], clearTimer: BridgeClock['clearTimer'];
  try {
    const config = resolve(), id = config.clientId, secret = config.clientSecret;
    if (typeof id !== 'string' || !/^[A-Za-z0-9_-]{1,256}$/.test(id) || typeof secret !== 'string' || !/^[A-Za-z0-9._~/-]{16,512}$/.test(secret) || typeof options.transport !== 'function') throw Error();
    clientId = id; clientSecret = secret; transport = options.transport;
    const clock = options.clock ?? systemClock;
    now = clock.now.bind(clock); setTimer = clock.setTimer.bind(clock); clearTimer = clock.clearTimer.bind(clock);
  } catch { return Object.freeze({ authenticate: async () => 'unavailable' as const, close() {} }); }
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
  return Object.freeze({
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
    close() {
      closed = true; epoch++; clearKey(); inFlight?.stop();
      // Captured technical credentials can no longer be used by this instance.
      clientId = ''; clientSecret = '';
    },
  });
}
