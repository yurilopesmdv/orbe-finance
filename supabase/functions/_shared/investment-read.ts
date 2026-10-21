import { createExactJsonDecoder, exactInteger } from './exact-json.ts';
import { readInvestmentJsonResponse } from './http-json.ts';
import { createPluggyTargets } from './pluggy-targets.ts';
import { resolveExecutionMode, type ExecutionPolicy } from './execution-mode.ts';
import { preparePluggyInvestmentSnapshot, projectPreparedInvestmentSnapshot, projectPluggyInvestmentSnapshot, discardInvestmentSnapshot, type InvestmentProjectionContext } from './pluggy-investments.ts';

export interface AuthorizedInvestmentRead { ownerSubject:string;sessionId:string;revision:number;leaseId:string;leaseExpiresAt:number }
export type ResolveInvestmentBindings=(ids:readonly string[],signal:AbortSignal)=>Promise<InvestmentProjectionContext>;
type Projection=Extract<ReturnType<typeof projectPreparedInvestmentSnapshot>,{kind:'page'}>;
export type InvestmentReadResult=Readonly<{status:'disabled'|'unavailable'|'cancelled'|'busy'|'rate_limited'}>|Readonly<{status:'complete';receivedRows:number;positionIds:readonly string[];page:Projection['page'];coverage:Projection['coverage'];consentExpiresAt:number}>;
const uuid=(v:unknown):v is string=>typeof v==='string'&&/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(v);
const record=(v:unknown):v is Record<string,unknown>=>typeof v==='object'&&v!==null&&!Array.isArray(v);
const fields=['id','itemId','type','status','currencyCode','amount','balance','date'] as const;
/** Private one-shot collector. No authentication key crosses this boundary. */
export function prepareInvestmentRead(raw:InvestmentProjectionContext,request:AuthorizedInvestmentRead,policy:ExecutionPolicy&{enabled?:boolean;now:()=>number}) {
 if(policy.enabled!==true||resolveExecutionMode(policy)===null)return {kind:'disabled' as const};
 try{
  const decode=createExactJsonDecoder(JSON.parse,'investments');
  const context:InvestmentProjectionContext=Object.freeze({itemId:raw.itemId,connectionId:raw.connectionId,sourceUpdatedAt:raw.sourceUpdatedAt,bindings:Object.freeze(raw.bindings.map(b=>Object.freeze({externalId:b.externalId,internalId:b.internalId})))});
  if(projectPluggyInvestmentSnapshot(decode('{"page":1,"total":0,"totalPages":0,"results":[]}'),context,policy).kind!=='page')throw Error();
  const owner=request.ownerSubject,session=request.sessionId,revision=request.revision,lease=request.leaseId,expiry=request.leaseExpiresAt;
  let last=policy.now(),closed=false,used=false;
  if(!uuid(owner)||!uuid(session)||!uuid(lease)||!Number.isSafeInteger(revision)||revision<1||!Number.isSafeInteger(last)||last<0||!Number.isSafeInteger(expiry)||expiry<=last||expiry-last>120000)throw Error();
  const fresh=(signal:AbortSignal,consent:number)=>{const now=policy.now();if(closed||signal.aborted||!Number.isSafeInteger(now)||now<last||now>=expiry||now>=consent)throw Error();last=now;};
  const targets=createPluggyTargets({itemId:context.itemId,accountIds:[]});
  return Object.freeze({kind:'prepared' as const,close(){closed=true;},async read(evidence:{expiresAt:number;sourceUpdatedAt:string|null},fetchPage:(target:string,page:number)=>Promise<Response>,resolveBindings:ResolveInvestmentBindings,signal:AbortSignal):Promise<InvestmentReadResult>{
   if(used||closed)return {status:'unavailable'};used=true;
   const rows:Record<string,unknown>[]=[],seen=new Set<string>();let handle:unknown;
   try{
    const consent=evidence.expiresAt,sourceUpdatedAt=evidence.sourceUpdatedAt;
    if(!Number.isSafeInteger(consent))throw Error();
    let total=-1,pages=-1;
    for(let page=1;page===1||page<=pages;page++){
     fresh(signal,consent);
     const response=await fetchPage(targets.investments(page),page);
     try{
      fresh(signal,consent);
      if(response.redirected)throw Error();
      if(response.status===429)return {status:'rate_limited'};
      if(response.status!==200||!response.ok)throw Error();
      const source=await readInvestmentJsonResponse(response,signal,decode);fresh(signal,consent);
      if(!record(source)||!Array.isArray(source.results))throw Error();
      const count=exactInteger(source.total,1000),pageCount=exactInteger(source.totalPages,10);
      if(exactInteger(source.page,10,1)!==page||count>0&&pageCount!==Math.ceil(count/100)||count===0&&pageCount>1)throw Error();
      if(page===1){total=count;pages=pageCount;}else if(total!==count||pages!==pageCount)throw Error();
      if(source.results.length!==Math.min(100,total-(page-1)*100))throw Error();
      for(const value of source.results){
       if(!record(value))throw Error();
       const row:Record<string,unknown>={};for(const name of fields)if(Object.hasOwn(value,name))row[name]=value[name];
       if(!uuid(row.id)||seen.has(row.id))throw Error();seen.add(row.id);rows.push(row);
      }
     }finally{try{void response.body?.cancel().catch(()=>{});}catch{/* No source data in errors. */}}
    }
    if(rows.length!==total)throw Error();
    const snapshot=decode(JSON.stringify({page:1,total:rows.length,totalPages:rows.length?1:0})) as Record<string,unknown>;
    snapshot.results=rows;handle=preparePluggyInvestmentSnapshot(snapshot,context.itemId,policy);
    if(!record(handle)||handle.kind!=='snapshot'||!Array.isArray(handle.externalIds))throw Error();
    fresh(signal,consent);
    const resolved=await resolveBindings(handle.externalIds as string[],signal);fresh(signal,consent);
    if(resolved.itemId!==context.itemId||resolved.connectionId!==context.connectionId)throw Error();
    const projected=projectPreparedInvestmentSnapshot(handle,{...resolved,sourceUpdatedAt},policy);
    if(projected.kind!=='page')throw Error();
    fresh(signal,consent);
    return Object.freeze({status:'complete',receivedRows:projected.receivedRows,positionIds:Object.freeze(projected.page.items.map(row=>row.id).sort()),page:projected.page,coverage:projected.coverage,consentExpiresAt:consent});
   }catch{return {status:signal.aborted?'cancelled':'unavailable'};}
   finally{closed=true;discardInvestmentSnapshot(handle);rows.length=0;seen.clear();}
  }});
 }catch{return {kind:'unavailable' as const};}
}
