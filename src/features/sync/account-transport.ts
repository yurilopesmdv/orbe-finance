import { AuthFailure, type AuthConfig } from '../auth/gateway.ts';
import type { SessionModel } from '../auth/session.ts';
import { createSessionJsonClient } from '../../lib/session-json.ts';
import { normalizeAccountPage, type AccountPageContext } from './accounts.ts';
import type { ProductTransport } from './product-batch.ts';
import type { BatchScope, PageRequest } from './read-batch.ts';
type Session = Pick<SessionModel,'read'|'assertUnlocked'|'getPublicOrigin'>;
type Transport = (url: string, init: RequestInit) => Promise<Pick<Response,'ok'|'status'|'redirected'|'headers'|'body'>>;
const record = (raw: unknown): raw is Record<string,unknown> => !!raw && typeof raw==='object' && !Array.isArray(raw);
const uuid = (raw: unknown): raw is string => typeof raw==='string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(raw);
function invalid(): never { throw new AuthFailure('unavailable'); }
export function createAccountTransport(session: Session, resolveConfig: () => AuthConfig | null, transport: Transport, rawContext: AccountPageContext, policy: {enabled?:boolean;privateDataApproved?:boolean;timeoutMs?:number}={}): Readonly<ProductTransport> {
 if(policy.enabled!==true||policy.privateDataApproved!==true)return Object.freeze({acquire:async()=>({status:'disabled'}),readPage:async()=>({status:'disabled'}),finalize:async()=>false});
 let context: AccountPageContext;
 try {
  if(!record(rawContext)||!['ownerSubject','connectionId','institutionId','allowedAccountIds'].every(key=>Object.hasOwn(rawContext,key))||!Array.isArray(rawContext.allowedAccountIds))return invalid();
  context=Object.freeze({ownerSubject:rawContext.ownerSubject,connectionId:rawContext.connectionId,institutionId:rawContext.institutionId,allowedAccountIds:Object.freeze([...rawContext.allowedAccountIds])});
  normalizeAccountPage({connectionId:context.connectionId,items:[],nextCursor:null,authoritative:false,sourceUpdatedAt:null},context,{enabled:true,privateDataApproved:true});
 }catch{return invalid();}
 const timeoutMs=policy.timeoutMs??20000;
 const request=createSessionJsonClient(session,resolveConfig,transport,timeoutMs);
 function scope(input:BatchScope){if(!record(input)||!Object.hasOwn(input,'connectionId')||!Object.hasOwn(input,'revision')||input.connectionId!==context.connectionId||!Number.isSafeInteger(input.revision)||input.revision<1)return invalid();return{connectionId:input.connectionId,revision:input.revision};}
 return Object.freeze<ProductTransport>({
  async acquire(input,signal){return request('acquire',{...scope(input),product:'accounts'},signal);},
  async readPage(input:PageRequest,signal){const value=scope(input);if(input.product!=='accounts'||input.cursor!==null||!uuid(input.leaseId))return invalid();const leaseId=input.leaseId;
   const raw=await request('read',{...value,leaseId,cursor:null},signal);
   if(!record(raw)||!['connectionId','revision','leaseId','product','rowCount','complete','partial','items'].every(key=>Object.hasOwn(raw,key))||raw.connectionId!==value.connectionId||raw.revision!==value.revision||raw.leaseId!==leaseId||raw.product!=='accounts'||raw.complete!==true||raw.nextCursor!==null||typeof raw.partial!=='boolean'||!Array.isArray(raw.items)||raw.rowCount!==raw.items.length)return invalid();
   const normalized=normalizeAccountPage(raw,context,{enabled:true,privateDataApproved:true});if(normalized.kind!=='page')return invalid();
   return Object.freeze({connectionId:value.connectionId,items:Object.freeze(normalized.items.map(row=>Object.freeze({id:row.id.slice(('account:'+value.connectionId+':').length),connectionId:value.connectionId,currency:row.currency,balanceCents:row.amountCents,balanceAsOf:row.asOf,relation:row.relation}))),nextCursor:null,authoritative:normalized.authoritative&&!raw.partial,sourceUpdatedAt:normalized.sourceUpdatedAt});
  },
  async finalize(input,signal){const value=scope(input);if(!uuid(input.leaseId))return invalid();const raw=await request('finalize',{...value,leaseId:input.leaseId,outcome:'success'},signal);if(!record(raw)||!Object.hasOwn(raw,'status')||raw.status!=='complete')return invalid();return true;},
 });
}
