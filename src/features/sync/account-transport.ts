import { AuthFailure, type AuthConfig } from '../auth/gateway.ts';
import type { SessionModel } from '../auth/session.ts';
import { readBoundedJson } from '../../lib/bounded-json.ts';
import { normalizeAccountPage, type AccountPageContext } from './accounts.ts';
import type { ProductTransport } from './product-batch.ts';
import type { BatchScope, PageRequest } from './read-batch.ts';
type Session = Pick<SessionModel,'read'|'assertUnlocked'|'getPublicOrigin'>;
type Transport = (url: string, init: RequestInit) => Promise<Pick<Response,'ok'|'status'|'redirected'|'headers'|'body'>>;
const record = (raw: unknown): raw is Record<string,unknown> => !!raw && typeof raw==='object' && !Array.isArray(raw);
const uuid = (raw: unknown): raw is string => typeof raw==='string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(raw);
function invalid(): never { throw new AuthFailure('unavailable'); }
const paths = { acquire:'/reads/acquire', read:'/accounts/read', finalize:'/reads/finalize' } as const;
export function createAccountTransport(session: Session, resolveConfig: () => AuthConfig | null, transport: Transport, rawContext: AccountPageContext, policy: {enabled?:boolean;privateDataApproved?:boolean;timeoutMs?:number}={}): Readonly<ProductTransport> {
 if(policy.enabled!==true||policy.privateDataApproved!==true)return Object.freeze({acquire:async()=>({status:'disabled'}),readPage:async()=>({status:'disabled'}),finalize:async()=>false});
 let context: AccountPageContext;
 try {
  if(!record(rawContext)||!['ownerSubject','connectionId','institutionId','allowedAccountIds'].every(key=>Object.hasOwn(rawContext,key))||!Array.isArray(rawContext.allowedAccountIds))return invalid();
  context=Object.freeze({ownerSubject:rawContext.ownerSubject,connectionId:rawContext.connectionId,institutionId:rawContext.institutionId,allowedAccountIds:Object.freeze([...rawContext.allowedAccountIds])});
  normalizeAccountPage({connectionId:context.connectionId,items:[],nextCursor:null,authoritative:false,sourceUpdatedAt:null},context,{enabled:true,privateDataApproved:true});
 }catch{return invalid();}
 const timeoutMs=policy.timeoutMs??20000;
 async function request(operation:keyof typeof paths,body:unknown,external:AbortSignal):Promise<unknown>{
  session.assertUnlocked(); if(external.aborted)throw new AuthFailure('cancelled');
  const expected=session.getPublicOrigin();
  return session.read(async(token,parent)=>{
   const config=resolveConfig();
   if(!config||!Object.hasOwn(config,'origin')||!Object.hasOwn(config,'publishableKey')||config.origin!==expected||!/^https:\/\/[a-z]{20}\.supabase\.co$/.test(config.origin)||!/^sb_publishable_[A-Za-z0-9_-]+$/.test(config.publishableKey)||typeof transport!=='function'||!Number.isSafeInteger(timeoutMs)||timeoutMs<1||timeoutMs>20000)return invalid();
   const origin=config.origin,key=config.publishableKey,controller=new AbortController();let timer:ReturnType<typeof setTimeout>|undefined,stop:(()=>void)|undefined,response:Awaited<ReturnType<Transport>>|undefined;
   const active=()=>{if(controller.signal.aborted||parent.aborted||external.aborted)throw new AuthFailure('cancelled');};
   try{
    const interrupted=new Promise<never>((_,reject)=>{stop=()=>{controller.abort();reject(new AuthFailure('cancelled'));};parent.addEventListener('abort',stop,{once:true});external.addEventListener('abort',stop,{once:true});timer=setTimeout(()=>{controller.abort();reject(new AuthFailure('unavailable'));},timeoutMs);});
    const work=async()=>{
     active();response=await transport(origin+'/functions/v1/orbe-bridge'+paths[operation],{method:'POST',headers:{apikey:key,Authorization:'Bearer '+token,'Content-Type':'application/json','Cache-Control':'no-store'},body:JSON.stringify(body),signal:controller.signal,credentials:'omit',redirect:'error',cache:'no-store',referrerPolicy:'no-referrer'});active();
     if(response.redirected)return invalid();if(response.status===401||response.status===403)throw new AuthFailure('invalid_credentials');if(response.status===429)throw new AuthFailure('rate_limited');if(response.status!==200||!response.ok)return invalid();
     const result=await readBoundedJson(response,controller.signal,131072);active();return result;
    };
    return await Promise.race([interrupted,work()]);
   }catch(error){if(error instanceof AuthFailure)throw error;return invalid();}
   finally{controller.abort();clearTimeout(timer);if(stop){parent.removeEventListener('abort',stop);external.removeEventListener('abort',stop);}try{void response?.body?.cancel().catch(()=>{});}catch{/* No payload in errors. */}}
  });
 }
 function scope(input:BatchScope){if(!record(input)||!Object.hasOwn(input,'connectionId')||!Object.hasOwn(input,'revision')||input.connectionId!==context.connectionId||!Number.isSafeInteger(input.revision)||input.revision<1)return invalid();return{connectionId:input.connectionId,revision:input.revision};}
 return Object.freeze<ProductTransport>({
  async acquire(input,signal){return request('acquire',scope(input),signal);},
  async readPage(input:PageRequest,signal){const value=scope(input);if(input.product!=='accounts'||input.cursor!==null||!uuid(input.leaseId))return invalid();const leaseId=input.leaseId;
   const raw=await request('read',{...value,leaseId,cursor:null},signal);
   if(!record(raw)||!['connectionId','revision','leaseId','product','rowCount','complete','partial','items'].every(key=>Object.hasOwn(raw,key))||raw.connectionId!==value.connectionId||raw.revision!==value.revision||raw.leaseId!==leaseId||raw.product!=='accounts'||raw.complete!==true||raw.nextCursor!==null||typeof raw.partial!=='boolean'||!Array.isArray(raw.items)||raw.rowCount!==raw.items.length)return invalid();
   const normalized=normalizeAccountPage(raw,context,{enabled:true,privateDataApproved:true});if(normalized.kind!=='page')return invalid();
   return Object.freeze({connectionId:value.connectionId,items:Object.freeze(normalized.items.map(row=>Object.freeze({id:row.id.slice(('account:'+value.connectionId+':').length),connectionId:value.connectionId,currency:row.currency,balanceCents:row.amountCents,balanceAsOf:row.asOf,relation:row.relation}))),nextCursor:null,authoritative:normalized.authoritative&&!raw.partial,sourceUpdatedAt:normalized.sourceUpdatedAt});
  },
  async finalize(input,signal){const value=scope(input);if(!uuid(input.leaseId))return invalid();const raw=await request('finalize',{...value,leaseId:input.leaseId,outcome:'success'},signal);if(!record(raw)||!Object.hasOwn(raw,'status')||raw.status!=='complete')return invalid();return true;},
 });
}
