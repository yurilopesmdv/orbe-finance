import { resolveExecutionMode, type ExecutionPolicy } from './execution-mode.ts';
import { readJsonResponse } from './http-json.ts';
import type { DiscoveryResult } from './inventory-discovery.ts';
type Coordinator = { run(input: { connectionId: string; revision: number }, token: string, signal: AbortSignal): Promise<DiscoveryResult> };
const reply = (status: number, body: unknown) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', Pragma: 'no-cache', 'X-Content-Type-Options': 'nosniff' } });
const object = (value: unknown): value is Record<string, unknown> => value !== null && typeof value === 'object' && !Array.isArray(value);
const uuid = (value: unknown): value is string => typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(value);
export function createInventoryHandler(coordinator: Coordinator, options: ExecutionPolicy & { enabled?: boolean } = {}) {
  if (options.enabled !== true || resolveExecutionMode(options) === null) return Object.freeze({ handler: async (_request: Request) => reply(503, { error: 'unavailable' }), close() {} });
  let active: AbortController | null = null, closed = false;
  return Object.freeze({
    async handler(request: Request): Promise<Response> {
      if (closed) return reply(503, { error: 'unavailable' });
      if (active) return reply(429, { error: 'busy' });
      const controller = new AbortController(); active = controller;
      let timer: ReturnType<typeof setTimeout> | undefined, abort: () => void = () => {};
      try {
        const url = new URL(request.url);
        if (url.pathname !== '/accounts/discover') return reply(404, { error: 'not_found' });
        if (url.search || url.hash) return reply(400, { error: 'invalid_request' });
        if (request.method !== 'POST') return reply(405, { error: 'method_not_allowed' });
        if (!/^application\/json(?:\s*;\s*charset=utf-8)?$/i.test(request.headers.get('content-type') ?? '')) return reply(415, { error: 'unsupported_media_type' });
        const bearer = /^Bearer ([A-Za-z0-9._~-]{1,8192})$/i.exec(request.headers.get('authorization') ?? '');
        if (!bearer) return reply(401, { error: 'unauthorized' });
        if (request.signal.aborted) return reply(499, { error: 'request_aborted' });
        const stopped = new Promise<Response>(resolve => { abort = () => { controller.abort(); resolve(reply(499, { error: 'request_aborted' })); }; });
        request.signal.addEventListener('abort', abort, { once: true }); controller.signal.addEventListener('abort', abort, { once: true });
        timer = setTimeout(abort, 120000);
        const work = async (): Promise<Response> => {
          let raw: unknown;
          try { raw = await readJsonResponse(new Response(request.body, { headers: request.headers }), controller.signal, 16384); }
          catch { return controller.signal.aborted ? reply(499, { error: 'request_aborted' }) : reply(400, { error: 'invalid_request' }); }
          if (controller.signal.aborted) return reply(499, { error: 'request_aborted' });
          if (!object(raw) || Object.keys(raw).sort().join(',') !== 'connectionId,revision' || !uuid(raw.connectionId) || !Number.isSafeInteger(raw.revision) || (raw.revision as number) < 1) return reply(400, { error: 'invalid_request' });
          const result = await coordinator.run(Object.freeze({ connectionId: raw.connectionId, revision: raw.revision as number }), bearer[1]!, controller.signal);
          if (controller.signal.aborted) return reply(499, { error: 'request_aborted' });
          if (!object(result)) return reply(503, { error: 'unavailable' });
          if (result.status === 'complete') {
            if (!Number.isSafeInteger(result.registeredAccounts) || result.registeredAccounts < 0 || result.registeredAccounts > 1000) return reply(503, { error: 'unavailable' });
            return reply(200, { status: 'complete', registeredAccounts: result.registeredAccounts });
          }
          const statuses = { forbidden: 403, conflict: 409, busy: 429, rate_limited: 429, cancelled: 499 } as const;
          if (typeof result.status === 'string' && Object.hasOwn(statuses, result.status)) return reply(statuses[result.status as keyof typeof statuses], { error: result.status });
          return reply(503, { error: 'unavailable' });
        };
        return await Promise.race([work(), stopped]);
      } catch { return reply(503, { error: 'unavailable' }); }
      finally {
        if (timer !== undefined) clearTimeout(timer);
        request.signal.removeEventListener('abort', abort); controller.signal.removeEventListener('abort', abort); controller.abort();
        if (active === controller) active = null;
      }
    },
    close() { closed = true; active?.abort(); },
  });
}
