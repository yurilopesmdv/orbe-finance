import { privateRequestHeaders } from './private-http.ts';
import { AuthFailure, type AuthConfig } from '../features/auth/gateway.ts';
import type { SessionModel } from '../features/auth/session.ts';
import { readBoundedJson, readMovementJson, readInvestmentJson } from './bounded-json.ts';
export type HttpSession = Pick<SessionModel,'read'|'assertUnlocked'|'getPublicOrigin'>;
export type SessionTransport = (url: string, init: RequestInit) => Promise<Pick<Response,'ok'|'status'|'redirected'|'headers'|'body'>>;
function invalid(): never { throw new AuthFailure('unavailable'); }
const paths={connectToken:'/functions/v1/orbe-bridge/connections/connect-token',importConnection:'/functions/v1/orbe-bridge/connections/import',activate:'/functions/v1/orbe-bridge/connections/activate',investmentRead:'/functions/v1/orbe-bridge/investments/read',investmentFinalize:'/functions/v1/orbe-bridge/investments/finalize',positionRegistry:'/rest/v1/orbe_positions?select=id,connection_id,product&order=id.asc&limit=1001',movementRead:'/functions/v1/orbe-bridge/movements/read',movementFinalize:'/functions/v1/orbe-bridge/movements/finalize',discover:'/functions/v1/orbe-bridge/accounts/discover',acquire:'/functions/v1/orbe-bridge/reads/acquire',read:'/functions/v1/orbe-bridge/accounts/read',finalize:'/functions/v1/orbe-bridge/reads/finalize',registry:'/rest/v1/orbe_accounts?select=id,connection_id&order=id.asc&limit=1001'} as const;
/** Fixed operations only. Caller gates financial capabilities before creating this client. */
export function createSessionJsonClient(session:HttpSession,resolveConfig:()=>AuthConfig|null,transport:SessionTransport,timeoutMs=20000){
 return async function request(operation:keyof typeof paths,body:unknown,external:AbortSignal):Promise<unknown>{
  if (!Object.hasOwn(paths,operation)) return invalid();
  session.assertUnlocked(); if(external.aborted)throw new AuthFailure('cancelled');
  const expected=session.getPublicOrigin();
  return session.read(async(token,parent)=>{
   const config=resolveConfig();
   if(!config||!Object.hasOwn(config,'origin')||!Object.hasOwn(config,'publishableKey')||config.origin!==expected||!/^https:\/\/[a-z]{20}\.supabase\.co$/.test(config.origin)||!/^sb_publishable_[A-Za-z0-9_-]+$/.test(config.publishableKey)||typeof transport!=='function'||!Number.isSafeInteger(timeoutMs)||timeoutMs<1||timeoutMs>(operation==='discover'?120000:20000))return invalid();
   const origin=config.origin,key=config.publishableKey,controller=new AbortController();let timer:ReturnType<typeof setTimeout>|undefined,stop:(()=>void)|undefined,response:Awaited<ReturnType<SessionTransport>>|undefined;
   const active=()=>{if(controller.signal.aborted||parent.aborted||external.aborted)throw new AuthFailure('cancelled');};
   try{
    const interrupted=new Promise<never>((_,reject)=>{stop=()=>{controller.abort();reject(new AuthFailure('cancelled'));};parent.addEventListener('abort',stop,{once:true});external.addEventListener('abort',stop,{once:true});timer=setTimeout(()=>{controller.abort();reject(new AuthFailure('unavailable'));},timeoutMs);});
    const work=async()=>{
     active();response=await transport(origin+paths[operation],{method:(operation==='registry'||operation==='positionRegistry')?'GET':'POST',headers:{apikey:key,Authorization:'Bearer '+token,'Content-Type':'application/json',...privateRequestHeaders},body:(operation==='registry'||operation==='positionRegistry')?undefined:JSON.stringify(body),signal:controller.signal,credentials:'omit',redirect:'error',cache:'no-store',referrerPolicy:'no-referrer'});active();
     if(response.redirected)return invalid();if(response.status===401||response.status===403)throw new AuthFailure('invalid_credentials');if(response.status===429)throw new AuthFailure('rate_limited');if(operation==='activate'&&response.status===409){const error=await readBoundedJson(response,controller.signal,4096);active();if(!error||typeof error!=='object'||!Object.hasOwn(error,'error'))return invalid();const code=(error as {error:unknown}).error;if(code!=='origin_unconfirmed'&&code!=='activation_not_available')return invalid();return Object.freeze({status:code==='origin_unconfirmed'?'origin_unconfirmed':'unavailable'});}if(response.status!==200||!response.ok)return invalid();
     const result=await (operation==='investmentRead'?readInvestmentJson(response,controller.signal):operation==='movementRead'?readMovementJson(response,controller.signal):readBoundedJson(response,controller.signal,operation==='discover'?4096:131072));active();return result;
    };
    return await Promise.race([interrupted,work()]);
   }catch(error){if(error instanceof AuthFailure)throw error;return invalid();}
   finally{controller.abort();clearTimeout(timer);if(stop){parent.removeEventListener('abort',stop);external.removeEventListener('abort',stop);}try{void response?.body?.cancel().catch(()=>{});}catch{/* No payload in errors. */}}
  });
 };
}
