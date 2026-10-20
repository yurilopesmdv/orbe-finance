import { resolveExecutionMode, type ExecutionPolicy } from './execution-mode.ts';
import type { BridgeClock } from './bridge.ts';
import type { LeasePorts, ReadScope } from './lease-rest.ts';
import type { AccountProjectionContext } from './pluggy-accounts.ts';
import type { AccountReadResult } from './pluggy-auth.ts';
import { createExactJsonDecoder } from './exact-json.ts';
import { projectPluggyAccounts } from './pluggy-accounts.ts';
import { readJsonResponse } from './http-json.ts';
export interface AccountReadPorts {
  authenticate(token: string, signal: AbortSignal): Promise<unknown>;
  resolve(subject: string, connectionId: string, revision: number, leaseId: string, signal: AbortSignal): Promise<unknown>;
  check: LeasePorts['check'];
  readAccounts(context: AccountProjectionContext, signal: AbortSignal): Promise<AccountReadResult>;
}
const record = (raw: unknown): raw is Record<string, unknown> => typeof raw === 'object' && raw !== null && !Array.isArray(raw);
const uuid = (raw: unknown): raw is string => typeof raw === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(raw);
const clockDefault: BridgeClock = { now: Date.now, setTimer: (fn, ms) => setTimeout(fn, ms), clearTimer: id => clearTimeout(id as ReturnType<typeof setTimeout>) };
class Failure extends Error { readonly status: number; readonly code: string; constructor(status: number, code: string) { super(code); this.status = status; this.code = code; } }
function fail(status = 503, code = 'unavailable'): never { throw new Failure(status, code); }
const response = (status: number, body: unknown) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', Pragma: 'no-cache', 'X-Content-Type-Options': 'nosniff' } });
export function createAccountReadHandler(ports: AccountReadPorts, options: ExecutionPolicy & { enabled?: boolean; clock?: BridgeClock } = {}) {
  const executionMode = options.enabled === true ? resolveExecutionMode(options) : null;
  if (executionMode === null) return async (_request: Request) => response(503, { error: 'unavailable' });
  const clock = options.clock ?? clockDefault;
  return async (request: Request): Promise<Response> => {
    const controller = new AbortController(); let timer: unknown, scheduled = false;
    let abort: (() => void) | undefined, lastNow = -1, start = 0;
    const now = () => { const value = clock.now(); if (!Number.isSafeInteger(value) || value < 0 || value < lastNow) fail(); lastNow = value; return value; };
    const fresh = (expiry = Infinity) => { if (controller.signal.aborted || request.signal.aborted) fail(499, 'request_aborted'); const instant = now(); if (instant - start >= 20000) fail(504, 'deadline_exceeded'); if (instant >= expiry) fail(401, 'unauthorized'); };
    try {
      const url = new URL(request.url);
      if (url.search || url.hash) fail(400, 'invalid_request');
      if (url.pathname !== '/accounts/read') fail(404, 'not_found');
      if (request.method !== 'POST') fail(405, 'method_not_allowed');
      if (!/^application\/json(?:\s*;\s*charset=utf-8)?$/i.test(request.headers.get('content-type') ?? '')) fail(415, 'unsupported_media_type');
      const match = /^Bearer ([A-Za-z0-9._~-]{1,8192})$/i.exec(request.headers.get('authorization') ?? '');
      if (!match) fail(401, 'unauthorized');
      start = now(); fresh(); const token = match[1]!;
      const deadline = new Promise<never>((_, reject) => {
        abort = () => { controller.abort(); reject(new Failure(499, 'request_aborted')); };
        request.signal.addEventListener('abort', abort, { once: true });
        timer = clock.setTimer(() => { controller.abort(); reject(new Failure(504, 'deadline_exceeded')); }, 20000); scheduled = true;
      });
      const principal = (raw: unknown) => {
        if (!record(raw) || !['subject','expiresAt','isOwner'].every(key => Object.hasOwn(raw,key)) || !uuid(raw.subject) || typeof raw.expiresAt !== 'number' || !Number.isSafeInteger(raw.expiresAt) || raw.expiresAt <= now()) fail(401, 'unauthorized');
        if (raw.isOwner !== true) fail(403, 'forbidden');
        return Object.freeze({ subject: raw.subject, expiresAt: raw.expiresAt });
      };
      const work = async () => {
        const first = principal(await ports.authenticate(token, controller.signal)); fresh(first.expiresAt);
        let body: unknown;
        try { body = await readJsonResponse(new Response(request.body, { headers: request.headers }), controller.signal, 16384); }
        catch { fresh(first.expiresAt); fail(400, 'invalid_request'); }
        fresh(first.expiresAt);
        if (!record(body) || Object.keys(body).sort().join(',') !== 'connectionId,cursor,leaseId,revision' || !uuid(body.connectionId) || !uuid(body.leaseId) || !Number.isSafeInteger(body.revision) || (body.revision as number) < 1 || body.cursor !== null) fail(400, 'invalid_request');
        const scope: Readonly<ReadScope> = Object.freeze({ ownerId: first.subject, connectionId: body.connectionId, revision: body.revision as number }), leaseId = body.leaseId;
        const resolved = await ports.resolve(scope.ownerId, scope.connectionId, scope.revision, leaseId, controller.signal); fresh(first.expiresAt);
        if (!record(resolved) || !['ownerId','connectionId','revision','projection'].every(key => Object.hasOwn(resolved,key)) || resolved.ownerId !== scope.ownerId || resolved.connectionId !== scope.connectionId || resolved.revision !== scope.revision || !record(resolved.projection)) fail(404, 'not_found');
        const raw = resolved.projection as unknown as AccountProjectionContext;
        const decode = createExactJsonDecoder(), empty = decode('{"page":1,"total":0,"totalPages":0,"results":[]}');
        projectPluggyAccounts(empty, raw, { enabled: true, mode: executionMode, privateDataApproved: true });
        const context = Object.freeze({ itemId: raw.itemId, connectionId: raw.connectionId, sourceUpdatedAt: raw.sourceUpdatedAt, coverageApproved: raw.coverageApproved,
          bindings: Object.freeze(raw.bindings.map(row => Object.freeze({ externalId: row.externalId, internalId: row.internalId, balanceAsOf: row.balanceAsOf, relation: row.relation }))) });
        if (context.connectionId !== scope.connectionId) fail(404, 'not_found');
        projectPluggyAccounts(empty, context, { enabled: true, mode: executionMode, privateDataApproved: true });
        if (await ports.check(scope, leaseId, 'accounts', controller.signal) !== true) fail(409, 'read_not_available'); fresh(first.expiresAt);
        const result = await ports.readAccounts(context, controller.signal); fresh(first.expiresAt);
        if (result.status !== 'complete') fail(result.status === 'rate_limited' ? 429 : 503, result.status === 'rate_limited' ? 'rate_limited' : 'unavailable');
        const final = principal(await ports.authenticate(token, controller.signal)); fresh(Math.min(first.expiresAt, final.expiresAt));
        if (final.subject !== first.subject) fail(401, 'unauthorized');
        if (await ports.check(scope, leaseId, 'accounts', controller.signal) !== true) fail(409, 'read_not_available'); fresh(Math.min(first.expiresAt, final.expiresAt));
        // Trusted internal adapter output, copied through an explicit response whitelist.
        if (result.page.connectionId !== scope.connectionId || result.page.items.length > 1000 || result.page.nextCursor !== null) fail();
        return response(200, { connectionId: scope.connectionId, revision: scope.revision, leaseId, product: 'accounts',
          items: result.page.items.map(row => ({ id: row.id, connectionId: row.connectionId, currency: row.currency, balanceCents: row.balanceCents, balanceAsOf: row.balanceAsOf, relation: row.relation })),
          rowCount: result.page.items.length, nextCursor: null, complete: true, authoritative: result.page.authoritative, partial: result.coverage.partial,
          sourceUpdatedAt: result.page.sourceUpdatedAt, coverage: { excludedCreditCount: result.coverage.excludedCreditCount, unsupportedCurrencyCount: result.coverage.unsupportedCurrencyCount } });
      };
      return await Promise.race([deadline, work()]);
    } catch (error) { return error instanceof Failure ? response(error.status, { error: error.code }) : response(503, { error: 'unavailable' }); }
    finally { controller.abort(); if (abort) request.signal.removeEventListener('abort', abort); if (scheduled) { try { clock.clearTimer(timer); } catch { /* No request content escapes. */ } } }
  };
}
