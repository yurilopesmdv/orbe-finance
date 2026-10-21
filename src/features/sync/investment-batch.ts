import { normalizeConnection } from '../../domain/connections.ts';
import type { MemoryAssets } from '../../data/local/assets.ts';
import { runReadBatch,type BatchClock,type BatchResult } from './read-batch.ts';
import type { ProductTransport } from './product-batch.ts';
import type { InvestmentTransportContext } from './investment-transport.ts';
import { createPositionStager,type PositionStager } from './position-staging.ts';
const uuid=(v:unknown):v is string=>typeof v==='string'&&/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(v);
function invalid():never{throw Error('invalid_investment_batch');}
export async function runInvestmentBatch(metadata:unknown,input:InvestmentTransportContext,store:MemoryAssets,transport:ProductTransport,options:{enabled?:boolean;privateDataApproved?:boolean;expectedOwnerSubject?:string;assertCurrent?:()=>void;signal?:AbortSignal;clock?:BatchClock}={}):Promise<BatchResult>{
 if(options.enabled!==true||options.privateDataApproved!==true)return {status:'disabled'};
 let stager:PositionStager|undefined;
 try{
  const assertCurrent=options.assertCurrent,signal=options.signal;if(typeof assertCurrent!=='function'||!signal||signal.aborted)return {status:'cancelled'};assertCurrent();
  const connection=normalizeConnection(metadata,{integrationEnabled:true,privateDataApproved:true,now:options.clock?options.clock.now():Date.now()});
  if(connection.kind!=='connection'||!connection.readableProducts.includes('investments'))return {status:'unavailable'};
  const context=Object.freeze({ownerSubject:input.ownerSubject,connectionId:input.connectionId,institutionId:input.institutionId});
  if(!uuid(context.ownerSubject)||context.ownerSubject!==options.expectedOwnerSubject||context.connectionId!==connection.id||context.institutionId!==connection.institution)return invalid();
  return await runReadBatch(metadata,{
   acquire:(scope,child)=>transport.acquire(scope,child),
   async readPage(request,child){
    const raw=await transport.readPage(request,child);assertCurrent();if(child.aborted||stager||!raw||typeof raw!=='object'||!Object.hasOwn(raw,'positionIds')||!Object.hasOwn(raw,'page'))return invalid();
    const {positionIds,page}=raw as {positionIds:unknown;page:unknown};if(!Array.isArray(positionIds)||positionIds.length>1000||!positionIds.every((id,i,ids)=>uuid(id)&&(i===0||id>ids[i-1])))return invalid();
    const created=createPositionStager(store,{...context,product:'investment',allowedPositionIds:positionIds,allowedParents:[]},{enabled:true,privateDataApproved:true});if(created.kind!=='ready')return invalid();stager=created;return stager.prepare(page,request);
   },
   finalize:(scope,child)=>transport.finalize(scope,child),
   promote(fresh,child){fresh();if(!stager||child.aborted)return invalid();return stager.promote(fresh,child);},
   clearStaging(){stager?.clear();return undefined;},
  },{enabled:true,privateDataApproved:true,assertCurrent,signal,clock:options.clock,products:['investments']});
 }catch{return {status:'failed'};}finally{stager?.clear();}
}
