// Transport-independent core. No deployed entrypoint or provider adapter in T18a.
export interface BridgePorts {
  authenticate(token: string, signal: AbortSignal): Promise<unknown>;
  listConnections(subject: string, signal: AbortSignal, token: string): Promise<unknown>;
}
export interface BridgeClock {
  now(): number;
  setTimer(callback: () => void, milliseconds: number): unknown;
  clearTimer(handle: unknown): void;
}
const systemClock: BridgeClock = {
  now: () => Date.now(),
  setTimer: (callback, milliseconds) => setTimeout(callback, milliseconds),
  clearTimer: handle => clearTimeout(handle as ReturnType<typeof setTimeout>),
};
class Failure extends Error {
  readonly status: number;
  readonly code: string;
  constructor(status: number, code: string) { super(code); this.status = status; this.code = code; }
}
function fail(status: number, code: string): never { throw new Failure(status, code); }
const object = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value);
const uuid = (value: unknown): value is string => typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(value);
const active = (signal: AbortSignal) => { if (signal.aborted) fail(499, 'request_aborted'); };
function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), { status, headers: {
    'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store',
    'Pragma': 'no-cache', 'X-Content-Type-Options': 'nosniff',
  } });
}
function timestamp(value: unknown): string | null {
  if (value === null) return null;
  if (typeof value !== 'string') return fail(503, 'unavailable');
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d{1,6})?(Z|[+-](\d{2}):(\d{2}))$/.exec(value);
  if (!m) return fail(503, 'unavailable');
  const year = Number(m[1]), month = Number(m[2]), day = Number(m[3]);
  const leap = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const days = [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month - 1] ?? 0;
  if (year < 1 || day < 1 || day > days || Number(m[4]) > 23 || Number(m[5]) > 59 || Number(m[6]) > 59 || (m[7] !== 'Z' && (Number(m[8]) > 14 || Number(m[9]) > 59 || (Number(m[8]) === 14 && Number(m[9]) !== 0))) || !Number.isFinite(Date.parse(value))) return fail(503, 'unavailable');
  return new Date(value).toISOString();
}
function nullableBoolean(value: unknown): boolean | null {
  if (value === null || typeof value === 'boolean') return value;
  return fail(503, 'unavailable');
}
function projectConnections(value: unknown, subject: string): unknown[] {
  if (!Array.isArray(value) || value.length > 100) return fail(503, 'unavailable');
  const seen = new Set<string>();
  return value.map(row => {
    if (!object(row) || !uuid(row.id) || seen.has(row.id) || row.owner_id !== subject ||
      !['bradesco', 'mercado-pago', 'inter', 'nubank'].includes(row.institution as string) ||
      !['pending', 'active', 'paused', 'renewal_required', 'revoked', 'error'].includes(row.state as string) ||
      !Number.isSafeInteger(row.revision) || (row.revision as number) < 1) return fail(503, 'unavailable');
    seen.add(row.id);
    const verifiedAt = timestamp(row.open_finance_verified_at);
    if (row.state === 'active' && verifiedAt === null) return fail(503, 'unavailable');
    return {
      id: row.id, institution: row.institution, state: row.state, revision: row.revision,
      capabilities: {
        accounts: nullableBoolean(row.accounts_available), transactions: nullableBoolean(row.transactions_available),
        investments: nullableBoolean(row.investments_available), reserves: nullableBoolean(row.reserves_available),
      },
      openFinanceVerifiedAt: verifiedAt, authorizationExpiresAt: timestamp(row.authorization_expires_at),
      sourceUpdatedAt: timestamp(row.source_updated_at), lastReadAt: timestamp(row.last_read_at),
    };
  });
}
async function emptyBody(request: Request, signal: AbortSignal): Promise<void> {
  const declared = request.headers.get('content-length');
  if (declared !== null && (!/^\d+$/.test(declared) || Number(declared) > 16384)) fail(413, 'body_too_large');
  if (!request.body) fail(400, 'invalid_request');
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = []; let size = 0;
  const cancel = () => { void reader.cancel().catch(() => {}); };
  signal.addEventListener('abort', cancel, { once: true });
  try {
    active(signal);
    while (true) {
      const { value, done } = await reader.read(); active(signal);
      if (done) break;
      size += value.byteLength;
      if (size > 16384) { cancel(); fail(413, 'body_too_large'); }
      chunks.push(value);
    }
    const bytes = new Uint8Array(size); let offset = 0;
    for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
    let parsed: unknown;
    try { parsed = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes)); }
    catch { return fail(400, 'invalid_request'); }
    if (!object(parsed) || Object.keys(parsed).length !== 0) fail(400, 'invalid_request');
  } finally { signal.removeEventListener('abort', cancel); reader.releaseLock(); }
}

export function createBridgeHandler(ports: BridgePorts, options: { enabled?: boolean; clock?: BridgeClock } = {}): (request: Request) => Promise<Response> {
  const enabled = options.enabled === true;
  return async request => {
    // Do not inspect ports, clock, request or body when disabled.
    if (!enabled) return json(503, { error: 'unavailable' });
    const clock = options.clock ?? systemClock;
    let timer: unknown; let timerSet = false;
    const controller = new AbortController();
    let abort: (() => void) | undefined;
    try {
      const url = new URL(request.url);
      if (url.search || url.hash) fail(400, 'invalid_request');
      if (url.pathname !== '/connections/status') fail(404, 'not_found');
      if (request.method !== 'POST') fail(405, 'method_not_allowed');
      if (!/^application\/json(?:\s*;\s*charset=utf-8)?$/i.test(request.headers.get('content-type') ?? '')) fail(415, 'unsupported_media_type');
      const authorization = request.headers.get('authorization') ?? '';
      const bearer = /^Bearer ([A-Za-z0-9._~-]{1,8192})$/i.exec(authorization);
      if (!bearer) fail(401, 'unauthorized');
      if (request.signal.aborted) fail(499, 'request_aborted');
      const deadline = new Promise<never>((_, reject) => {
        abort = () => { controller.abort(); reject(new Failure(499, 'request_aborted')); };
        request.signal.addEventListener('abort', abort, { once: true });
        timer = clock.setTimer(() => { controller.abort(); reject(new Failure(504, 'deadline_exceeded')); }, 20000);
        timerSet = true;
      });
      const work = async () => {
        active(controller.signal);
        const principal = await ports.authenticate(bearer[1]!, controller.signal);
        active(controller.signal);
        if (!object(principal) || !uuid(principal.subject) || typeof principal.expiresAt !== 'number' || !Number.isFinite(principal.expiresAt) || principal.expiresAt <= clock.now()) fail(401, 'unauthorized');
        if (principal.isOwner !== true) fail(403, 'forbidden');
        // Retain validated scalars, never a mutable object owned by an adapter.
        const subject = principal.subject;
        const expiresAt = principal.expiresAt;
        await emptyBody(request, controller.signal); active(controller.signal);
        if (expiresAt <= clock.now()) fail(401, 'unauthorized');
        const rows = await ports.listConnections(subject, controller.signal, bearer[1]!);
        active(controller.signal);
        if (expiresAt <= clock.now()) fail(401, 'unauthorized');
        return json(200, { connections: projectConnections(rows, subject) });
      };
      return await Promise.race([deadline, work()]);
    } catch (error) {
      return error instanceof Failure ? json(error.status, { error: error.code }) : json(503, { error: 'unavailable' });
    } finally {
      if (abort) request.signal.removeEventListener('abort', abort);
      if (timerSet) clock.clearTimer(timer);
      controller.abort();
    }
  };
}
