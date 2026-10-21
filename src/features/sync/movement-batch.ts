import { normalizeConnection } from '../../domain/connections.ts';
import type { MemoryLedger } from '../../data/local/ledger.ts';
import { runReadBatch, type BatchClock, type BatchResult } from './read-batch.ts';
import type { ProductTransport } from './product-batch.ts';
import type { MovementTransportContext } from './movement-transport.ts';
import { createMovementStager, type MovementStager } from './movement-staging.ts';
import { normalizeMovementPage } from './movements.ts';
const record=(raw:unknown):raw is Record<string,unknown>=>typeof raw==='object'&&raw!==null&&!Array.isArray(raw);
const uuid=(raw:unknown):raw is string=>typeof raw==='string'&&raw.length===36&&/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(raw);
function invalid():never{throw Error('invalid_movement_batch');}
export async function runMovementBatch(rawMetadata:unknown,input:MovementTransportContext,store:MemoryLedger,transport:ProductTransport,options:{enabled?:boolean;privateDataApproved?:boolean;expectedOwnerSubject?:string;assertCurrent?:()=>void;signal?:AbortSignal;clock?:BatchClock}={}):Promise<BatchResult>{
 if(options.enabled!==true||options.privateDataApproved!==true)return Object.freeze({status:'disabled'});
 let stager:MovementStager|undefined,manifest:readonly string[]|undefined;
 const clear=():undefined=>{try{stager?.clear();}catch{/* Per-run staging cleanup only. */}};
 try{
  const assertCurrent=options.assertCurrent,signal=options.signal;
  if(typeof assertCurrent!=='function'||!signal||signal.aborted)return Object.freeze({status:'cancelled'});
  try{assertCurrent();}catch{return Object.freeze({status:'cancelled'});}
  const metadata=normalizeConnection(rawMetadata,{integrationEnabled:true,privateDataApproved:true,now:options.clock?options.clock.now():Date.now()});
  if(metadata.kind!=='connection'||!metadata.readableProducts.includes('transactions'))return Object.freeze({status:'unavailable'});
  if(!record(input)||!['ownerSubject','connectionId','institutionId','month','allowedAccountIds','categoryIds','confirmedOwnTransfers'].every(key=>Object.hasOwn(input,key))||!uuid(input.ownerSubject)||input.ownerSubject!==options.expectedOwnerSubject||input.connectionId!==metadata.id||input.institutionId!==metadata.institution||typeof input.month!=='string'||!/^20[0-9]{2}-(0[1-9]|1[0-2])$/.test(input.month)||!Array.isArray(input.allowedAccountIds)||input.allowedAccountIds.length<1||input.allowedAccountIds.length>1000||!input.allowedAccountIds.every(uuid)||new Set(input.allowedAccountIds).size!==input.allowedAccountIds.length||!Array.isArray(input.categoryIds)||!Array.isArray(input.confirmedOwnTransfers)||input.confirmedOwnTransfers.length>10000)return invalid();
  const allowedAccountIds=Object.freeze([...input.allowedAccountIds]);
  const context=Object.freeze({ownerSubject:input.ownerSubject,connectionId:input.connectionId,institutionId:input.institutionId,month:input.month,allowedAccountIds,categoryIds:Object.freeze([...input.categoryIds]),confirmedOwnTransfers:Object.freeze(input.confirmedOwnTransfers.map(ref=>{if(!ref||!Object.hasOwn(ref,'accountId')||!Object.hasOwn(ref,'movementId')||!uuid(ref.accountId)||!allowedAccountIds.includes(ref.accountId)||!uuid(ref.movementId))return invalid();return Object.freeze({accountId:ref.accountId,movementId:ref.movementId});}))});
  normalizeMovementPage({connectionId:context.connectionId,accountId:allowedAccountIds[0],items:[],nextCursor:null,windowComplete:false,sourceUpdatedAt:null},{...context,accountId:allowedAccountIds[0],confirmedOwnTransferIds:[]},{enabled:true,privateDataApproved:true});
  const canonical=Object.freeze({id:metadata.id,institution:metadata.institution,revision:metadata.revision,state:'active',capabilities:metadata.capabilities,openFinanceVerifiedAt:metadata.openFinanceVerifiedAt,proxyConsentExpiresAt:metadata.proxyConsentExpiresAt,bankConsentExpiresAt:metadata.bankConsentExpiresAt,sourceUpdatedAt:metadata.sourceUpdatedAt,lastReadAt:metadata.lastReadAt});
  const acquire=transport.acquire,readPage=transport.readPage,finalize=transport.finalize;
  if(typeof acquire!=='function'||typeof readPage!=='function'||typeof finalize!=='function')return invalid();
  return await runReadBatch(canonical,{
   acquire:(scope,child)=>acquire.call(transport,scope,child),
   async readPage(request,child){
    const raw=await readPage.call(transport,request,child);if(child.aborted)return invalid();assertCurrent();
    if(!record(raw)||!Object.hasOwn(raw,'accountIds')||!Array.isArray(raw.accountIds)||raw.accountIds.length<1||raw.accountIds.length>100||!raw.accountIds.every((id,index,ids)=>uuid(id)&&allowedAccountIds.includes(id)&&(index===0||id>ids[index-1])))return invalid();
    const accountIds=Object.freeze([...raw.accountIds]) as readonly string[];
    if(manifest&&JSON.stringify(manifest)!==JSON.stringify(accountIds))return invalid();
    if(!stager){const created=createMovementStager(store,{...context,accountIds},{enabled:true,privateDataApproved:true});if(created.kind!=='ready')return invalid();stager=created;manifest=accountIds;}
    return stager.prepare(raw,request);
   },
   finalize:(scope,child)=>finalize.call(transport,scope,child),
   promote(fresh,child){fresh();if(!stager||child.aborted)return invalid();return stager.promote(fresh,child);},
   clearStaging:clear,
  },{enabled:true,privateDataApproved:true,assertCurrent,signal,clock:options.clock,products:['transactions']});
 }catch{return Object.freeze({status:'failed'});}
 finally{clear();}
}
