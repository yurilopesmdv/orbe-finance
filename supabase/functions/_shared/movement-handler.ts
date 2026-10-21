import { resolveExecutionMode, type ExecutionPolicy } from './execution-mode.ts';
import type { BridgeClock } from './bridge.ts';
import type { AccountProjectionContext } from './pluggy-accounts.ts';
import type { ProviderMovementReadResult } from './pluggy-auth.ts';
import type { AuthorizedMovementRead } from './movement-read.ts';
import type { MovementReadScope, MovementPageScope, MovementPageCommit } from './movement-progress-rest.ts';
import { createExactJsonDecoder } from './exact-json.ts';
import { projectPluggyAccounts } from './pluggy-accounts.ts';
import { readJsonResponse } from './http-json.ts';
export interface MovementHandlerPorts {
  authenticate(token: string, signal: AbortSignal): Promise<unknown>;
  resolve(scope: MovementReadScope, signal: AbortSignal): Promise<unknown>;
  claim(scope: MovementPageScope, signal: AbortSignal): Promise<Readonly<{claimId:string;pageNumber:number;leaseExpiresAt:number}> | null>;
  commit(scope: MovementPageCommit, signal: AbortSignal): Promise<boolean>;
  readMovements(context: AccountProjectionContext, request: AuthorizedMovementRead, signal: AbortSignal): Promise<ProviderMovementReadResult>;
}
const record = (raw: unknown): raw is Record<string, unknown> => typeof raw === 'object' && raw !== null && !Array.isArray(raw);
const uuid = (raw: unknown): raw is string => typeof raw === 'string' && raw.length === 36 && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(raw);
const clockDefault: BridgeClock = { now: Date.now, setTimer: (fn, ms) => setTimeout(fn, ms), clearTimer: id => clearTimeout(id as ReturnType<typeof setTimeout>) };
class Failure extends Error { readonly status: number; readonly code: string; constructor(status: number, code: string) { super(code); this.status = status; this.code = code; } }
function fail(status = 503, code = 'unavailable'): never { throw new Failure(status, code); }
const response = (status: number, body: unknown) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', Pragma: 'no-cache', 'X-Content-Type-Options': 'nosniff' } });
export function createMovementReadHandler(ports: MovementHandlerPorts, options: ExecutionPolicy & { enabled?: boolean; clock?: BridgeClock } = {}) {
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
      if (url.pathname !== '/movements/read') fail(404, 'not_found');
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
        if (!record(raw) || !['subject','sessionId','expiresAt','isOwner'].every(key => Object.hasOwn(raw,key)) || !uuid(raw.subject) || !uuid(raw.sessionId) || typeof raw.expiresAt !== 'number' || !Number.isSafeInteger(raw.expiresAt) || raw.expiresAt <= now()) fail(401, 'unauthorized');
        if (raw.isOwner !== true) fail(403, 'forbidden');
        return Object.freeze({ subject: raw.subject, sessionId: raw.sessionId, expiresAt: raw.expiresAt });
      };
      const work = async () => {
        const first = principal(await ports.authenticate(token, controller.signal)); fresh(first.expiresAt);
        let body: unknown;
        try { body = await readJsonResponse(new Response(request.body, { headers: request.headers }), controller.signal, 16384); }
        catch { fresh(first.expiresAt); fail(400, 'invalid_request'); }
        fresh(first.expiresAt);
        const cursor = (raw: unknown): raw is string | null => raw === null || typeof raw === 'string' && raw.length <= 512 && /^v1\.[A-Za-z0-9_-]{40,509}$/.test(raw);
        if (!record(body) || Object.keys(body).sort().join(',') !== 'connectionId,cursor,leaseId,month,revision' || !uuid(body.connectionId) || !uuid(body.leaseId) || !Number.isSafeInteger(body.revision) || (body.revision as number) < 1 || typeof body.month !== 'string' || body.month.length !== 7 || !/^20[0-9]{2}-(0[1-9]|1[0-2])$/.test(body.month) || !cursor(body.cursor)) fail(400, 'invalid_request');
        const scope = Object.freeze({ ownerId: first.subject, sessionId: first.sessionId, connectionId: body.connectionId, revision: body.revision as number, leaseId: body.leaseId });
        const month = body.month, requestedCursor = body.cursor;
        const resolve = async () => {
          const resolved = await ports.resolve(scope, controller.signal); fresh(first.expiresAt);
          if (!record(resolved) || !['ownerId','sessionId','connectionId','revision','leaseId','leaseExpiresAt','projection'].every(key => Object.hasOwn(resolved,key)) || resolved.ownerId !== scope.ownerId || resolved.sessionId !== scope.sessionId || resolved.connectionId !== scope.connectionId || resolved.revision !== scope.revision || resolved.leaseId !== scope.leaseId || typeof resolved.leaseExpiresAt !== 'string' || !record(resolved.projection)) fail(404, 'not_found');
          const expiry = Date.parse(resolved.leaseExpiresAt);
          if (!Number.isSafeInteger(expiry) || expiry <= now() || expiry > now() + 120000) fail(409,'read_not_available');
          const raw = resolved.projection as unknown as AccountProjectionContext;
          const decode = createExactJsonDecoder(), empty = decode('{"page":1,"total":0,"totalPages":0,"results":[]}');
          projectPluggyAccounts(empty, raw, { enabled: true, mode: executionMode, privateDataApproved: true });
          if (raw.connectionId !== scope.connectionId || raw.bindings.length < 1 || raw.bindings.length > 100) fail(404,'not_found');
          const context = Object.freeze({ itemId: raw.itemId, connectionId: raw.connectionId, sourceUpdatedAt: raw.sourceUpdatedAt, coverageApproved: raw.coverageApproved,
            bindings: Object.freeze(raw.bindings.map(row => Object.freeze({ externalId: row.externalId, internalId: row.internalId, balanceAsOf: row.balanceAsOf, relation: row.relation }))) });
          projectPluggyAccounts(empty, context, { enabled: true, mode: executionMode, privateDataApproved: true });
          return Object.freeze({ context, expiry });
        };
        const initial = await resolve(); fresh(Math.min(first.expiresAt,initial.expiry));
        const digest = async (value: string | null) => {
          const bytes = await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value ?? 'orbe:movements:cursor:root:v1'));
          fresh(Math.min(first.expiresAt,initial.expiry));
          return Array.from(new Uint8Array(bytes),byte=>byte.toString(16).padStart(2,'0')).join('');
        };
        const cursorHash = await digest(requestedCursor), pageScope = Object.freeze({ ...scope, month, cursorHash });
        const claim = await ports.claim(pageScope,controller.signal); fresh(Math.min(first.expiresAt,initial.expiry));
        if (!claim || !uuid(claim.claimId) || !Number.isInteger(claim.pageNumber) || claim.pageNumber < 1 || claim.pageNumber > 100 || claim.leaseExpiresAt !== initial.expiry) fail(409,'read_not_available');
        const claimId = claim.claimId;
        const result = await ports.readMovements(initial.context,{ownerSubject:scope.ownerId,sessionId:scope.sessionId,revision:scope.revision,leaseId:scope.leaseId,leaseExpiresAt:initial.expiry,month,cursor:requestedCursor},controller.signal);
        fresh(Math.min(first.expiresAt,initial.expiry));
        if (result.status !== 'complete') fail(result.status === 'rate_limited' ? 429 : 503, result.status === 'rate_limited' ? 'rate_limited' : 'unavailable');
        const { envelope, receivedRows, accountIds, consentExpiresAt } = result, page = envelope.page;
        if (!Number.isSafeInteger(consentExpiresAt) || !Number.isInteger(receivedRows) || receivedRows < 0 || receivedRows > 500 || !Array.isArray(accountIds) || accountIds.length < 1 || accountIds.length > 100 || new Set(accountIds).size !== accountIds.length || !accountIds.every(id=>uuid(id)&&initial.context.bindings.some(row=>row.internalId===id)) || page.connectionId !== scope.connectionId || !accountIds.includes(page.accountId) || page.items.length > receivedRows || !cursor(envelope.nextCursor) || !cursor(envelope.accountCursor) || !cursor(page.nextCursor) || envelope.nextCursor !== null && envelope.nextCursor === requestedCursor || page.nextCursor !== null && page.nextCursor !== envelope.nextCursor || envelope.accountCursor !== null && envelope.accountCursor !== requestedCursor || page.windowComplete !== false || result.coverage.partial !== true) fail();
        const output = { connectionId:scope.connectionId,revision:scope.revision,leaseId:scope.leaseId,product:'transactions',month,
          accountIds:[...accountIds],envelope:{accountCursor:envelope.accountCursor,nextCursor:envelope.nextCursor,page:{connectionId:page.connectionId,accountId:page.accountId,nextCursor:page.nextCursor,windowComplete:page.windowComplete,sourceUpdatedAt:page.sourceUpdatedAt,
            items:page.items.map(row=>({movementId:row.movementId,accountId:row.accountId,amountCents:row.amountCents,currency:row.currency,direction:row.direction,type:row.type,status:row.status,occurredAt:row.occurredAt,description:row.description,categoryId:row.categoryId,reversalOf:row.reversalOf}))}},
          rowCount:page.items.length,nextCursor:envelope.nextCursor,complete:envelope.nextCursor===null,partial:true,
          coverage:{excludedCreditCount:result.coverage.excludedCreditCount,unsupportedCurrencyCount:result.coverage.unsupportedCurrencyCount} };
        const snapshotPage=output.envelope.page;
        if (snapshotPage.items.some(row=>!uuid(row.movementId)||row.accountId!==snapshotPage.accountId||row.amountCents!==null&&(!Number.isSafeInteger(row.amountCents)||row.amountCents<0)||!['BRL','USD','EUR'].includes(row.currency)||!['credit','debit'].includes(row.direction)||row.type!=='unknown'||!['posted','pending'].includes(row.status)||typeof row.occurredAt!=='string'||!Number.isFinite(Date.parse(row.occurredAt))||typeof row.description!=='string'||row.description.length>240||/[\u0000-\u001f\u007f]/.test(row.description)||row.categoryId!==null||row.reversalOf!==null)
          || ![output.coverage.excludedCreditCount,output.coverage.unsupportedCurrencyCount].every(value=>Number.isSafeInteger(value)&&value>=0)) fail();
        const serialized = JSON.stringify(output);
        if (new TextEncoder().encode(serialized).length > 1048576) fail();
        fresh(Math.min(first.expiresAt,initial.expiry,consentExpiresAt));
        const nextHash = envelope.nextCursor === null ? null : await digest(envelope.nextCursor);
        const final = principal(await ports.authenticate(token,controller.signal));
        const expiry = Math.min(first.expiresAt,final.expiresAt,initial.expiry,consentExpiresAt); fresh(expiry);
        if (final.subject !== first.subject || final.sessionId !== first.sessionId) fail(401,'unauthorized');
        const latest = await resolve(); fresh(expiry);
        if (latest.expiry !== initial.expiry || JSON.stringify(latest.context) !== JSON.stringify(initial.context)) fail(409,'read_not_available');
        if (await ports.commit({...pageScope,claimId,nextHash,rowCount:receivedRows},controller.signal) !== true) fail(409,'read_not_available');
        fresh(expiry);
        return new Response(serialized,{status:200,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store',Pragma:'no-cache','X-Content-Type-Options':'nosniff'}});
      };
      return await Promise.race([deadline, work()]);
    } catch (error) { return error instanceof Failure ? response(error.status, { error: error.code }) : response(503, { error: 'unavailable' }); }
    finally { controller.abort(); if (abort) request.signal.removeEventListener('abort', abort); if (scheduled) { try { clock.clearTimer(timer); } catch { /* No request content escapes. */ } } }
  };
}
