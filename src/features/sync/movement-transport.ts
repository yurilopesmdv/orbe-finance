import { AuthFailure, type AuthConfig } from '../auth/gateway.ts';
import { createSessionJsonClient, type HttpSession, type SessionTransport } from '../../lib/session-json.ts';
import { normalizeMovementPage } from './movements.ts';
import type { MovementStagerContext } from './movement-staging.ts';
import type { BatchScope, PageRequest } from './read-batch.ts';
import type { ProductTransport } from './product-batch.ts';
export type MovementTransportContext = Omit<MovementStagerContext,'accountIds'>;
const record=(raw:unknown):raw is Record<string,unknown>=>typeof raw==='object'&&raw!==null&&!Array.isArray(raw);
const uuid=(raw:unknown):raw is string=>typeof raw==='string'&&raw.length===36&&/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(raw);
const cursor=(raw:unknown):raw is string|null=>raw===null||typeof raw==='string'&&raw.length<=512&&/^v1\.[A-Za-z0-9_-]{40,509}$/.test(raw);
function invalid():never{throw new AuthFailure('unavailable');}
export function createMovementTransport(session:HttpSession,resolveConfig:()=>AuthConfig|null,network:SessionTransport,input:MovementTransportContext,policy:{enabled?:boolean;privateDataApproved?:boolean}={}):Readonly<ProductTransport>{
 if(policy.enabled!==true||policy.privateDataApproved!==true)return Object.freeze({acquire:async()=>({status:'disabled'}),readPage:async()=>({status:'disabled'}),finalize:async()=>false});
 let context:MovementTransportContext;
 try{
  if(!record(input)||!['ownerSubject','connectionId','institutionId','month','allowedAccountIds','categoryIds','confirmedOwnTransfers'].every(key=>Object.hasOwn(input,key))||!uuid(input.ownerSubject)||!uuid(input.connectionId)||typeof input.month!=='string'||!/^20[0-9]{2}-(0[1-9]|1[0-2])$/.test(input.month)||!Array.isArray(input.allowedAccountIds)||input.allowedAccountIds.length<1||input.allowedAccountIds.length>1000||!input.allowedAccountIds.every(uuid)||new Set(input.allowedAccountIds).size!==input.allowedAccountIds.length||!Array.isArray(input.categoryIds)||!Array.isArray(input.confirmedOwnTransfers)||input.confirmedOwnTransfers.length>10000)return invalid();
  const allowedAccountIds=Object.freeze([...input.allowedAccountIds]),categoryIds=Object.freeze([...input.categoryIds]),confirmedOwnTransfers=Object.freeze(input.confirmedOwnTransfers.map(ref=>{if(!ref||!Object.hasOwn(ref,'accountId')||!Object.hasOwn(ref,'movementId')||!uuid(ref.accountId)||!allowedAccountIds.includes(ref.accountId)||!uuid(ref.movementId))return invalid();return Object.freeze({accountId:ref.accountId,movementId:ref.movementId});}));
  context=Object.freeze({ownerSubject:input.ownerSubject,connectionId:input.connectionId,institutionId:input.institutionId,month:input.month,allowedAccountIds,categoryIds,confirmedOwnTransfers});
  normalizeMovementPage({connectionId:context.connectionId,accountId:allowedAccountIds[0],items:[],nextCursor:null,windowComplete:false,sourceUpdatedAt:null},{...context,accountId:allowedAccountIds[0],confirmedOwnTransferIds:[]},{enabled:true,privateDataApproved:true});
 }catch{return invalid();}
 const request=createSessionJsonClient(session,resolveConfig,network);
 let acquired=false,leaseId:string|null=null,revision:number|null=null,manifest:readonly string[]|null=null,expectedCursor:string|null=null,finished=false,pending=false,closed=false;
 const scope=(raw:BatchScope)=>{if(!record(raw)||!Object.hasOwn(raw,'connectionId')||!Object.hasOwn(raw,'revision')||raw.connectionId!==context.connectionId||!Number.isSafeInteger(raw.revision)||raw.revision<1||revision!==null&&raw.revision!==revision)return invalid();return Object.freeze({connectionId:raw.connectionId,revision:raw.revision});};
 const exclusive=async<T>(signal:AbortSignal,work:()=>Promise<T>):Promise<T>=>{
  if(closed||pending||signal.aborted)return invalid();pending=true;
  try{return await work();}catch(error){closed=true;throw error;}finally{pending=false;}
 };
 return Object.freeze<ProductTransport>({
  acquire(input,signal){return exclusive(signal,async()=>{if(acquired)return invalid();const captured=scope(input);acquired=true;revision=captured.revision;const raw=await request('acquire',captured,signal);if(record(raw)&&raw.status==='acquired'&&uuid(raw.leaseId)&&raw.revision===revision)leaseId=raw.leaseId;else closed=true;return raw;});},
  readPage(input:PageRequest,signal){return exclusive(signal,async()=>{
   const captured=scope(input);if(!['leaseId','product','cursor'].every(key=>Object.hasOwn(input,key))||!acquired||!leaseId||input.leaseId!==leaseId||input.product!=='transactions'||!cursor(input.cursor)||input.cursor!==expectedCursor||finished)return invalid();
   const incoming=input.cursor,raw=await request('movementRead',{...captured,leaseId,month:context.month,cursor:incoming},signal);
   if(!record(raw)||!['connectionId','revision','leaseId','product','month','accountIds','envelope','rowCount','nextCursor','complete','partial'].every(key=>Object.hasOwn(raw,key))||raw.connectionId!==captured.connectionId||raw.revision!==captured.revision||raw.leaseId!==leaseId||raw.product!=='transactions'||raw.month!==context.month||raw.partial!==true||!cursor(raw.nextCursor)||raw.complete!==(raw.nextCursor===null)||raw.nextCursor!==null&&raw.nextCursor===incoming||!Array.isArray(raw.accountIds)||raw.accountIds.length<1||raw.accountIds.length>100||!raw.accountIds.every((id,index,ids)=>uuid(id)&&context.allowedAccountIds.includes(id)&&(index===0||id>ids[index-1]))||!record(raw.envelope))return invalid();
   const accountIds=Object.freeze([...raw.accountIds]) as readonly string[];
   if(manifest&&JSON.stringify(manifest)!==JSON.stringify(accountIds))return invalid();
   const envelope=raw.envelope;if(!['accountCursor','nextCursor','page'].every(key=>Object.hasOwn(envelope,key))||!cursor(envelope.accountCursor)||envelope.accountCursor!==null&&envelope.accountCursor!==incoming||envelope.nextCursor!==raw.nextCursor||!record(envelope.page)||!uuid(envelope.page.accountId)||!accountIds.includes(envelope.page.accountId)||!Array.isArray(envelope.page.items)||envelope.page.items.length>500||raw.rowCount!==envelope.page.items.length||envelope.page.windowComplete!==false)return invalid();
   const accountId=envelope.page.accountId,normalized=normalizeMovementPage(envelope.page,{...context,accountId,confirmedOwnTransferIds:context.confirmedOwnTransfers.filter(ref=>ref.accountId===accountId).map(ref=>ref.movementId)},{enabled:true,privateDataApproved:true});
   if(normalized.kind!=='page'||normalized.nextCursor!==null&&normalized.nextCursor!==raw.nextCursor)return invalid();
   const result=Object.freeze({accountIds,accountCursor:envelope.accountCursor,nextCursor:raw.nextCursor,page:Object.freeze({connectionId:captured.connectionId,accountId,items:Object.freeze(normalized.items.map(row=>Object.freeze({movementId:row.externalId,accountId:row.accountId,amountCents:row.amountCents,currency:row.currency,direction:row.direction,type:row.type,status:row.status,occurredAt:row.occurredAt,description:row.description,categoryId:row.categoryId,reversalOf:row.reversalOf?Object.freeze({accountId:row.reversalOf.accountId,movementId:row.reversalOf.externalId}):null}))),nextCursor:normalized.nextCursor,windowComplete:false,sourceUpdatedAt:normalized.sourceUpdatedAt})});
   manifest=accountIds;expectedCursor=raw.nextCursor;finished=raw.complete;return result;
  });},
  finalize(input,signal){return exclusive(signal,async()=>{const captured=scope(input);if(!Object.hasOwn(input,'leaseId')||!finished||!leaseId||input.leaseId!==leaseId)return invalid();const raw=await request('movementFinalize',{...captured,leaseId},signal);if(!record(raw)||Object.keys(raw).join(',')!=='status'||raw.status!=='complete')return invalid();closed=true;return true;});},
 });
}
