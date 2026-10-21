import { resolveExecutionMode, type ExecutionPolicy } from './execution-mode.ts';
import type { BridgeClock } from './bridge.ts';
import { projectPluggyInvestmentSnapshot, type InvestmentProjectionContext } from './pluggy-investments.ts';
import type { InvestmentReadResult, AuthorizedInvestmentRead, ResolveInvestmentBindings } from './investment-read.ts';
import type { InvestmentReadScope, InvestmentCommit } from './investment-progress-rest.ts';
import { createExactJsonDecoder } from './exact-json.ts';
import { readJsonResponse } from './http-json.ts';
export interface InvestmentHandlerPorts {
  authenticate(token: string, signal: AbortSignal): Promise<unknown>;
  resolve(scope: InvestmentReadScope, signal: AbortSignal): Promise<unknown>;
  claim(scope: InvestmentReadScope, signal: AbortSignal): Promise<Readonly<{claimId:string;leaseExpiresAt:number}> | null>;
  commit(scope: InvestmentCommit, signal: AbortSignal): Promise<boolean>;
  stage(scope: InvestmentReadScope,itemId:string,ids:readonly string[],signal:AbortSignal):Promise<boolean>;
  readInvestments(context:InvestmentProjectionContext,request:AuthorizedInvestmentRead,resolve:ResolveInvestmentBindings,signal:AbortSignal):Promise<InvestmentReadResult>;
}
const record = (raw: unknown): raw is Record<string, unknown> => typeof raw === 'object' && raw !== null && !Array.isArray(raw);
const uuid = (raw: unknown): raw is string => typeof raw === 'string' && raw.length === 36 && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(raw);
const clockDefault: BridgeClock = { now: Date.now, setTimer: (fn, ms) => setTimeout(fn, ms), clearTimer: id => clearTimeout(id as ReturnType<typeof setTimeout>) };
class Failure extends Error { readonly status: number; readonly code: string; constructor(status: number, code: string) { super(code); this.status = status; this.code = code; } }
function fail(status = 503, code = 'unavailable'): never { throw new Failure(status, code); }
const response = (status: number, body: unknown) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', Pragma: 'no-cache', 'X-Content-Type-Options': 'nosniff' } });
export function createInvestmentReadHandler(ports: InvestmentHandlerPorts, options: ExecutionPolicy & { enabled?: boolean; clock?: BridgeClock } = {}) {
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
      if (url.pathname !== '/investments/read') fail(404, 'not_found');
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
        if(!record(body)||Object.keys(body).sort().join(',')!=='connectionId,leaseId,revision'||!uuid(body.connectionId)||!uuid(body.leaseId)||!Number.isSafeInteger(body.revision)||(body.revision as number)<1)fail(400,'invalid_request');
        const scope=Object.freeze({ownerId:first.subject,sessionId:first.sessionId,connectionId:body.connectionId,revision:body.revision as number,leaseId:body.leaseId});
        const resolve = async () => {
          const resolved = await ports.resolve(scope, controller.signal); fresh(first.expiresAt);
          if (!record(resolved) || !['ownerId','sessionId','connectionId','revision','leaseId','leaseExpiresAt','projection'].every(key => Object.hasOwn(resolved,key)) || resolved.ownerId !== scope.ownerId || resolved.sessionId !== scope.sessionId || resolved.connectionId !== scope.connectionId || resolved.revision !== scope.revision || resolved.leaseId !== scope.leaseId || typeof resolved.leaseExpiresAt !== 'string' || !record(resolved.projection)) fail(404, 'not_found');
          const expiry = Date.parse(resolved.leaseExpiresAt);
          if (!Number.isSafeInteger(expiry) || expiry <= now() || expiry > now() + 120000) fail(409,'read_not_available');
          const raw = resolved.projection as unknown as InvestmentProjectionContext;
          const decode = createExactJsonDecoder(), empty = decode('{"page":1,"total":0,"totalPages":0,"results":[]}');
          if(projectPluggyInvestmentSnapshot(empty,raw,{enabled:true,mode:executionMode,privateDataApproved:true}).kind!=='page')fail();
          if (raw.connectionId !== scope.connectionId || raw.bindings.length > 1000) fail(404,'not_found');
          const context = Object.freeze({ itemId: raw.itemId, connectionId: raw.connectionId, sourceUpdatedAt: raw.sourceUpdatedAt,
            bindings: Object.freeze(raw.bindings.map(row => Object.freeze({ externalId: row.externalId, internalId: row.internalId }))) });
          if(projectPluggyInvestmentSnapshot(empty,context,{enabled:true,mode:executionMode,privateDataApproved:true}).kind!=='page')fail();
          return Object.freeze({ context, expiry });
        };
        const initial = await resolve(); fresh(Math.min(first.expiresAt,initial.expiry));
        const claim=await ports.claim(scope,controller.signal);fresh(Math.min(first.expiresAt,initial.expiry));
        if(!claim||!uuid(claim.claimId)||claim.leaseExpiresAt!==initial.expiry)fail(409,'read_not_available');
        const claimId=claim.claimId;
        let staged:Awaited<ReturnType<typeof resolve>>|null=null;
        const bindings:ResolveInvestmentBindings=async(ids,signal)=>{
          fresh(Math.min(first.expiresAt,initial.expiry));
          if(staged!==null||await ports.stage(scope,initial.context.itemId,ids,signal)!==true)fail(409,'read_not_available');
          const latest=await resolve();fresh(Math.min(first.expiresAt,initial.expiry));
          if(latest.expiry!==initial.expiry||latest.context.itemId!==initial.context.itemId||latest.context.sourceUpdatedAt!==initial.context.sourceUpdatedAt||initial.context.bindings.some(prior=>!latest.context.bindings.some(row=>row.externalId===prior.externalId&&row.internalId===prior.internalId)))fail(409,'read_not_available');
          staged=latest;return latest.context;
        };
        const result=await ports.readInvestments(initial.context,{ownerSubject:scope.ownerId,sessionId:scope.sessionId,revision:scope.revision,leaseId:scope.leaseId,leaseExpiresAt:initial.expiry},bindings,controller.signal);
        fresh(Math.min(first.expiresAt,initial.expiry));
        if(result.status!=='complete')fail(result.status==='rate_limited'?429:503,result.status==='rate_limited'?'rate_limited':'unavailable');
        if(staged===null)fail();
        const prepared=staged as Awaited<ReturnType<typeof resolve>>;
        const {page,receivedRows,positionIds,consentExpiresAt}=result;
        if(!Number.isSafeInteger(consentExpiresAt)||!Number.isInteger(receivedRows)||receivedRows<0||receivedRows>1000||!Array.isArray(positionIds)||new Set(positionIds).size!==positionIds.length||!positionIds.every(id=>uuid(id)&&prepared.context.bindings.some(row=>row.internalId===id))||page.connectionId!==scope.connectionId||page.product!=='investment'||page.nextCursor!==null||page.authoritative!==false||page.items.length>receivedRows||page.items.length!==positionIds.length||result.coverage.partial!==true)fail();
        const output={connectionId:scope.connectionId,revision:scope.revision,leaseId:scope.leaseId,product:'investments',positionIds:[...positionIds],page:{connectionId:page.connectionId,product:page.product,items:page.items.map(row=>({id:row.id,connectionId:row.connectionId,product:row.product,currency:row.currency,grossCents:row.grossCents,netCents:row.netCents,valueBasis:row.valueBasis,asOf:row.asOf,relation:row.relation,parent:row.parent,assetClass:row.assetClass,kind:row.kind})),nextCursor:null,authoritative:false,sourceUpdatedAt:page.sourceUpdatedAt},rowCount:page.items.length,nextCursor:null,complete:true,partial:true,coverage:{unsupportedCurrencyCount:result.coverage.unsupportedCurrencyCount}};
        if(!Number.isSafeInteger(output.coverage.unsupportedCurrencyCount)||output.coverage.unsupportedCurrencyCount<0||new Set(output.page.items.map(row=>row.id)).size!==positionIds.length||output.page.items.some(row=>!positionIds.includes(row.id)||row.connectionId!==scope.connectionId||row.product!=='investment'||row.kind!=='asset'||!['BRL','USD','EUR'].includes(row.currency)||![row.grossCents,row.netCents].every(v=>v===null||Number.isSafeInteger(v)&&v>=0)||row.valueBasis!=='net'||row.relation!=='unknown'||row.parent!==null||!['fixed_income','fund','equity','other','unknown'].includes(row.assetClass)||row.asOf!==null&&(typeof row.asOf!=='string'||!Number.isFinite(Date.parse(row.asOf)))))fail();
        const serialized = JSON.stringify(output);
        if (new TextEncoder().encode(serialized).length > 1048576) fail();
        fresh(Math.min(first.expiresAt,initial.expiry,consentExpiresAt));
        const final = principal(await ports.authenticate(token,controller.signal));
        const expiry = Math.min(first.expiresAt,final.expiresAt,initial.expiry,consentExpiresAt); fresh(expiry);
        if (final.subject !== first.subject || final.sessionId !== first.sessionId) fail(401,'unauthorized');
        const latest = await resolve(); fresh(expiry);
        if (latest.expiry !== initial.expiry || JSON.stringify(latest.context) !== JSON.stringify(prepared.context)) fail(409,'read_not_available');
        if (await ports.commit({...scope,claimId,rowCount:receivedRows},controller.signal) !== true) fail(409,'read_not_available');
        fresh(expiry);
        return new Response(serialized,{status:200,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store',Pragma:'no-cache','X-Content-Type-Options':'nosniff'}});
      };
      return await Promise.race([deadline, work()]);
    } catch (error) { return error instanceof Failure ? response(error.status, { error: error.code }) : response(503, { error: 'unavailable' }); }
    finally { controller.abort(); if (abort) request.signal.removeEventListener('abort', abort); if (scheduled) { try { clock.clearTimer(timer); } catch { /* No request content escapes. */ } } }
  };
}
