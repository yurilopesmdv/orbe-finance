import { resolveExecutionMode, type ExecutionPolicy } from './execution-mode.ts';
import { readJsonResponse } from './http-json.ts';
import type { BridgeClock } from './bridge.ts';
const uuid = (raw: unknown): raw is string => typeof raw === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(raw);
type Configuration = { origin: string; secretKey: string };
type Transport = (url: string, init: RequestInit) => Promise<Response>;
const defaultClock: BridgeClock = { now: Date.now, setTimer: (fn, ms) => setTimeout(fn, ms), clearTimer: id => clearTimeout(id as ReturnType<typeof setTimeout>) };
function unavailable(): never { throw Error('account_binding_unavailable'); }
export function createAccountBindingResolver(resolveConfig: () => Configuration, options: ExecutionPolicy & { enabled?: boolean; transport?: Transport; clock?: BridgeClock } = {}) {
  if (options.enabled !== true || resolveExecutionMode(options) === null) return async (_subject: string, _connection: string, _revision: number, _lease: string, _signal: AbortSignal): Promise<unknown> => null;
  let origin: string, secretKey: string, transport: Transport;
  try {
    const config = resolveConfig(); origin = config.origin; secretKey = config.secretKey;
    if (!/^https:\/\/[a-z]{20}\.supabase\.co$/.test(origin) || !/^sb_secret_[A-Za-z0-9_-]{1,512}$/.test(secretKey) || typeof options.transport !== 'function') return unavailable();
    transport = options.transport;
  } catch { return unavailable(); }
  const clock = options.clock ?? defaultClock;
  return async (subject: string, connectionId: string, revision: number, leaseId: string, signal: AbortSignal): Promise<unknown> => {
    if (!uuid(subject) || !uuid(connectionId) || !uuid(leaseId) || !Number.isSafeInteger(revision) || revision < 1 || signal.aborted) return unavailable();
    const controller = new AbortController(); let timer: unknown, set = false, abort: (() => void) | undefined, response: Response | undefined;
    try {
      const start = clock.now(); if (!Number.isSafeInteger(start) || start < 0) return unavailable();
      const deadline = new Promise<never>((_, reject) => {
        abort = () => { controller.abort(); reject(Error('account_binding_unavailable')); }; signal.addEventListener('abort', abort, { once: true });
        timer = clock.setTimer(abort, 20000); set = true;
      });
      const work = async () => {
        if (controller.signal.aborted || signal.aborted) return unavailable();
        response = await transport(origin + '/rest/v1/rpc/orbe_resolve_account_read', { method: 'POST',
          headers: { apikey: secretKey, 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify({ p_owner_id: subject, p_connection_id: connectionId, p_revision: revision, p_lease_id: leaseId }),
          signal: controller.signal, redirect: 'error', credentials: 'omit', cache: 'no-store', referrerPolicy: 'no-referrer' });
        if (controller.signal.aborted || signal.aborted || response.redirected || response.status !== 200) return unavailable();
        const result = await readJsonResponse(response, controller.signal, 131072), end = clock.now();
        if (controller.signal.aborted || signal.aborted || !Number.isSafeInteger(end) || end < start || end - start >= 20000) return unavailable();
        return result;
      };
      return await Promise.race([deadline, work()]);
    } catch { return unavailable(); }
    finally { controller.abort(); if (abort) signal.removeEventListener('abort', abort); if (set) { try { clock.clearTimer(timer); } catch { /* Generic failure only. */ } } try { void response?.body?.cancel().catch(() => {}); } catch { /* Do not wait for cancellation. */ } }
  };
}
