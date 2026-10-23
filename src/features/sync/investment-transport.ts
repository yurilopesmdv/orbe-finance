import { AuthFailure,type AuthConfig } from '../auth/gateway.ts';
import { createSessionJsonClient,type HttpSession,type SessionTransport } from '../../lib/session-json.ts';
import { createPositionRegistryReader } from '../connections/position-registry.ts';
import { normalizePositionPage } from './positions.ts';
import type { ProductTransport } from './product-batch.ts';
export interface InvestmentTransportContext {ownerSubject:string;connectionId:string;institutionId:string}
const record=(v:unknown):v is Record<string,unknown>=>typeof v==='object'&&v!==null&&!Array.isArray(v);
const uuid=(v:unknown):v is string=>typeof v==='string'&&/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(v);
function invalid():never{throw new AuthFailure('unavailable');}
const fields=['id','connectionId','product','currency','grossCents','netCents','valueBasis','asOf','relation','parent','assetClass','kind'] as const;
export function createInvestmentTransport(session:HttpSession,config:()=>AuthConfig|null,network:SessionTransport,input:InvestmentTransportContext,policy:{enabled?:boolean;privateDataApproved?:boolean}={}):Readonly<ProductTransport>{
 if(policy.enabled!==true||policy.privateDataApproved!==true)return Object.freeze({acquire:async()=>({status:'disabled'}),readPage:async()=>({status:'disabled'}),finalize:async()=>false});
 const context=Object.freeze({ownerSubject:input.ownerSubject,connectionId:input.connectionId,institutionId:input.institutionId});
 normalizePositionPage({connectionId:context.connectionId,product:'investment',items:[],nextCursor:null,authoritative:false,sourceUpdatedAt:null},{...context,product:'investment',allowedPositionIds:[],allowedParents:[]},{enabled:true,privateDataApproved:true});
 const request=createSessionJsonClient(session,config,network),registry=createPositionRegistryReader(session,config,network,{enabled:true});
 let acquired=false,leaseId:string|null=null,revision:number|null=null,finished=false,pending=false,closed=false,read=false;
 const scope=(raw:{connectionId:string;revision:number})=>{if(!raw||raw.connectionId!==context.connectionId||!Number.isSafeInteger(raw.revision)||raw.revision<1||revision!==null&&raw.revision!==revision)return invalid();return Object.freeze({connectionId:raw.connectionId,revision:raw.revision});};
 const exclusive=async<T>(signal:AbortSignal,work:()=>Promise<T>):Promise<T>=>{if(closed||pending||signal.aborted)return invalid();pending=true;try{return await work();}catch(e){closed=true;throw e;}finally{pending=false;}};
 return Object.freeze<ProductTransport>({
  acquire(input,signal){return exclusive(signal,async()=>{if(acquired)return invalid();const captured=scope(input);acquired=true;revision=captured.revision;const raw=await request('acquire',{...captured,product:'investments'},signal);if(record(raw)&&raw.status==='acquired'&&uuid(raw.leaseId)&&raw.revision===revision)leaseId=raw.leaseId;else closed=true;return raw;});},
  readPage(input,signal){return exclusive(signal,async()=>{
   const captured=scope(input);if(!acquired||!leaseId||input.leaseId!==leaseId||input.product!=='investments'||input.cursor!==null||read)return invalid();read=true;
   const raw=await request('investmentRead',{...captured,leaseId},signal);
   if(!record(raw)||raw.connectionId!==captured.connectionId||raw.revision!==captured.revision||raw.leaseId!==leaseId||raw.product!=='investments'||raw.partial!==true||raw.complete!==true||raw.nextCursor!==null||!record(raw.page)||!Array.isArray(raw.positionIds)||raw.positionIds.length>1000||!raw.positionIds.every((id,i,ids)=>uuid(id)&&(i===0||id>ids[i-1]))||!Array.isArray(raw.page.items)||raw.rowCount!==raw.page.items.length||raw.rowCount!==raw.positionIds.length||raw.page.authoritative!==false||raw.page.nextCursor!==null)return invalid();
   const positionIds=Object.freeze([...raw.positionIds]) as readonly string[];
   // Backend may have created opaque IDs during this read; verify them through RLS afterwards.
   const registered=await registry.read(context.connectionId,signal);if(registered.status!=='complete'||!positionIds.every(id=>registered.positionIds.includes(id)))return invalid();
   normalizePositionPage(raw.page,{...context,product:'investment',allowedPositionIds:positionIds,allowedParents:[]},{enabled:true,privateDataApproved:true});
   const page=Object.freeze({connectionId:context.connectionId,product:'investment',items:Object.freeze(raw.page.items.map(row=>{if(!record(row)||!positionIds.includes(row.id as string)||row.relation!=='unknown'||row.parent!==null||row.valueBasis!=='net')return invalid();return Object.freeze(Object.fromEntries(fields.map(name=>[name,row[name]])));})),nextCursor:null,authoritative:false,sourceUpdatedAt:raw.page.sourceUpdatedAt});
   if(new Set(page.items.map(row=>row.id)).size!==positionIds.length)return invalid();
   finished=true;return Object.freeze({positionIds,page});
  });},
  finalize(input,signal){return exclusive(signal,async()=>{const captured=scope(input);if(!finished||!leaseId||input.leaseId!==leaseId)return invalid();const result=await request('investmentFinalize',{...captured,leaseId},signal);if(!record(result)||Object.keys(result).join(',')!=='status'||result.status!=='complete')return invalid();closed=true;return true;});},
 });
}
