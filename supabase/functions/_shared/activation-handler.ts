import { resolveExecutionMode, type ExecutionPolicy } from './execution-mode.ts';
import type { BridgeClock } from './bridge.ts';
import type { PendingItem,PendingScope } from './pending-inventory-rest.ts';
import type { ActivationProviderResult } from './activation-provider.ts';
import type { ActivationEvidence } from './activation-evidence.ts';
interface Ports {authenticate(token:string,signal:AbortSignal):Promise<unknown>;resolve(scope:PendingScope,signal:AbortSignal):Promise<Readonly<PendingItem>|null>;verify(itemId:string,signal:AbortSignal):Promise<ActivationProviderResult>;activate(scope:PendingItem&{sessionId:string},evidence:ActivationEvidence,signal:AbortSignal):Promise<boolean>}

const record = (raw: unknown): raw is Record<string, unknown> => typeof raw === 'object' && raw !== null && !Array.isArray(raw);
const uuid = (raw: unknown): raw is string => typeof raw === 'string' && raw.length === 36 && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(raw);
import { readJsonResponse } from './http-json.ts';
const clockDefault: BridgeClock = { now: Date.now, setTimer: (fn, ms) => setTimeout(fn, ms), clearTimer: id => clearTimeout(id as ReturnType<typeof setTimeout>) };
class Failure extends Error { readonly status: number; readonly code: string; constructor(status: number, code: string) { super(code); this.status=status; this.code=code; } }
function fail(status=503, code='unavailable'): never { throw new Failure(status,code); }
const response=(status:number,body:unknown)=>new Response(JSON.stringify(body),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store',Pragma:'no-cache','X-Content-Type-Options':'nosniff'}});
export function createConnectionActivationHandler(ports: Ports, options:ExecutionPolicy & {enabled?:boolean;clock?:BridgeClock}={}){
 if(options.enabled!==true||resolveExecutionMode(options)===null)return async(_request:Request)=>response(503,{error:'unavailable'});
 const clock=options.clock??clockDefault;
 return async(request:Request):Promise<Response>=>{
  const controller=new AbortController();let timer:unknown,set=false,abort:(()=>void)|undefined,start=0,last=-1;
  const now=()=>{const value=clock.now();if(!Number.isSafeInteger(value)||value<0||value<last)fail();last=value;return value;};
  const fresh=(expiry=Infinity)=>{if(controller.signal.aborted||request.signal.aborted)fail(499,'request_aborted');const value=now();if(value-start>=20000)fail(504,'deadline_exceeded');if(value>=expiry)fail(401,'unauthorized');};
  try{
   const url=new URL(request.url);if(url.search||url.hash)fail(400,'invalid_request');
   if(url.pathname!=='/connections/activate')fail(404,'not_found');
   if(request.method!=='POST')fail(405,'method_not_allowed');
   if(!/^application\/json(?:\s*;\s*charset=utf-8)?$/i.test(request.headers.get('content-type')??''))fail(415,'unsupported_media_type');
   const match=/^Bearer ([A-Za-z0-9._~-]{1,8192})$/i.exec(request.headers.get('authorization')??'');if(!match)fail(401,'unauthorized');
   start=now();fresh();const token=match[1]!;
   const deadline=new Promise<never>((_,reject)=>{abort=()=>{controller.abort();reject(new Failure(499,'request_aborted'));};request.signal.addEventListener('abort',abort,{once:true});timer=clock.setTimer(()=>{controller.abort();reject(new Failure(504,'deadline_exceeded'));},20000);set=true;});
   const principal=(raw:unknown)=>{if(!record(raw)||!['subject','sessionId','isOwner','expiresAt'].every(key=>Object.hasOwn(raw,key))||!uuid(raw.subject)||!uuid(raw.sessionId)||typeof raw.expiresAt!=='number'||!Number.isSafeInteger(raw.expiresAt)||raw.expiresAt<=now())fail(401,'unauthorized');if(raw.isOwner!==true)fail(403,'forbidden');return{subject:raw.subject,sessionId:raw.sessionId,expiresAt:raw.expiresAt};};
   const work=async()=>{
    const first=principal(await ports.authenticate(token,controller.signal));fresh(first.expiresAt);
    let body:unknown;try{body=await readJsonResponse(new Response(request.body,{headers:request.headers}),controller.signal,16384);}catch{fresh(first.expiresAt);fail(400,'invalid_request');}fresh(first.expiresAt);
    if(!record(body)||Object.keys(body).sort().join(',')!=='connectionId,revision'||!uuid(body.connectionId)||!Number.isSafeInteger(body.revision)||(body.revision as number)<1)fail(400,'invalid_request');
    const scope=Object.freeze({ownerId:first.subject,connectionId:body.connectionId,revision:body.revision as number});
    const initial=await ports.resolve(scope,controller.signal);fresh(first.expiresAt);
    if(!initial||initial.ownerId!==scope.ownerId||initial.connectionId!==scope.connectionId||initial.revision!==scope.revision||!uuid(initial.itemId))fail(404,'not_found');
    const captured=Object.freeze({...scope,itemId:initial.itemId});
    const result=await ports.verify(captured.itemId,controller.signal);fresh(first.expiresAt);
    if(result.status!=='complete')fail(result.status==='origin_unconfirmed'?409:result.status==='rate_limited'?429:503,result.status==='origin_unconfirmed'?'origin_unconfirmed':result.status==='rate_limited'?'rate_limited':'unavailable');
    const evidence=result.evidence;
    const observed=Date.parse(evidence.observedAt),proxy=Date.parse(evidence.proxyConsentExpiresAt),bank=evidence.bankConsentExpiresAt===null?Infinity:Date.parse(evidence.bankConsentExpiresAt);
    if(evidence.itemId!==captured.itemId||!Number.isFinite(observed)||observed>now()||observed<now()-120000||!Number.isFinite(proxy)||bank!==Infinity&&!Number.isFinite(bank))fail(409,'origin_unconfirmed');
    fresh(Math.min(first.expiresAt,proxy,bank));
    const final=principal(await ports.authenticate(token,controller.signal));fresh(Math.min(first.expiresAt,final.expiresAt));
    if(final.subject!==first.subject||final.sessionId!==first.sessionId)fail(401,'unauthorized');
    const latest=await ports.resolve(scope,controller.signal);fresh(Math.min(first.expiresAt,final.expiresAt,proxy,bank));
    if(!latest||latest.ownerId!==captured.ownerId||latest.connectionId!==captured.connectionId||latest.revision!==captured.revision||latest.itemId!==captured.itemId)fail(409,'activation_not_available');
    if(await ports.activate({...captured,sessionId:first.sessionId},evidence,controller.signal)!==true)fail(409,'activation_not_available');fresh(Math.min(first.expiresAt,final.expiresAt,proxy,bank));
    const output={status:'activated'};
    return response(200,output);
   };
   return await Promise.race([deadline,work()]);
  }catch(error){return error instanceof Failure?response(error.status,{error:error.code}):response(503,{error:'unavailable'});}
  finally{controller.abort();if(abort)request.signal.removeEventListener('abort',abort);if(set){try{clock.clearTimer(timer);}catch{/* No content in errors. */}}}
 };
}
