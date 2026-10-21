import {resolveExecutionMode,type ExecutionPolicy} from './execution-mode.ts';
import {readJsonResponse} from './http-json.ts';
import type {PendingItem} from './pending-inventory-rest.ts';
import type {ActivationEvidence} from './activation-evidence.ts';
const uuid=(v:unknown):v is string=>typeof v==='string'&&/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(v);
function unavailable():never{throw Error('activation_unavailable');}
export function createActivationCommit(resolve:()=>{origin:string;secretKey:string},options:ExecutionPolicy&{enabled?:boolean;transport?:(url:string,init:RequestInit)=>Promise<Response>}={}){
 if(options.enabled!==true||resolveExecutionMode(options)===null)return async(_scope:PendingItem&{sessionId:string},_evidence:ActivationEvidence,_signal:AbortSignal)=>false;
 const config=resolve(),origin=config.origin,key=config.secretKey,transport=options.transport;
 if(origin!=='https://vvaufaoahotmaocrcyij.supabase.co'||typeof key!=='string'||!/^sb_secret_[A-Za-z0-9_-]{1,512}$/.test(key)||typeof transport!=='function')return unavailable();
 return async(scope:PendingItem&{sessionId:string},evidence:ActivationEvidence,signal:AbortSignal):Promise<boolean>=>{
  if(signal.aborted||!uuid(scope.ownerId)||!uuid(scope.sessionId)||!uuid(scope.connectionId)||!uuid(scope.itemId)||!Number.isSafeInteger(scope.revision)||scope.revision<1||evidence.itemId!==scope.itemId)return unavailable();
  const caps=evidence.capabilities,p_evidence={itemId:evidence.itemId,originalItemId:evidence.originalItemId,institution:evidence.institution,observedAt:evidence.observedAt,proxyConsentExpiresAt:evidence.proxyConsentExpiresAt,bankConsentExpiresAt:evidence.bankConsentExpiresAt,bankConsentIndefinite:evidence.bankConsentIndefinite,sourceUpdatedAt:evidence.sourceUpdatedAt,capabilities:{accounts:caps.accounts,transactions:caps.transactions,investments:caps.investments,reserves:caps.reserves}};
  const controller=new AbortController(),abort=()=>controller.abort();let timer:ReturnType<typeof setTimeout>|undefined,response:Response|undefined;
  try{
   const interrupted=new Promise<never>((_,reject)=>{const stop=()=>{controller.abort();reject(Error('activation_unavailable'));};signal.addEventListener('abort',stop,{once:true});controller.signal.addEventListener('abort',()=>{signal.removeEventListener('abort',stop);reject(Error('activation_unavailable'));},{once:true});timer=setTimeout(stop,20000);});
   signal.addEventListener('abort',abort,{once:true});if(signal.aborted)abort();
   const work=async()=>{
    if(controller.signal.aborted)return unavailable();
    response=await transport(origin+'/rest/v1/rpc/orbe_activate_connection',{method:'POST',headers:{apikey:key,Accept:'application/json','Content-Type':'application/json','Cache-Control':'no-store'},body:JSON.stringify({p_connection_id:scope.connectionId,p_owner_id:scope.ownerId,p_revision:scope.revision,p_session_id:scope.sessionId,p_evidence}),signal:controller.signal,redirect:'error',credentials:'omit',cache:'no-store',referrerPolicy:'no-referrer'});
    if(controller.signal.aborted||response.redirected||response.status!==200)return unavailable();const raw=await readJsonResponse(response,controller.signal,32);if(controller.signal.aborted||typeof raw!=='boolean')return unavailable();return raw;
   };
   return await Promise.race([interrupted,work()]);
  }catch{return unavailable();}finally{controller.abort();clearTimeout(timer);signal.removeEventListener('abort',abort);try{void response?.body?.cancel().catch(()=>{});}catch{}}
 };
}
