import {resolveExecutionMode,type ExecutionPolicy} from './execution-mode.ts';
import {readJsonResponse} from './http-json.ts';
import {verifyActivationEvidence,type ActivationEvidence} from './activation-evidence.ts';
import type {BridgeClock} from './bridge.ts';
type Transport=(url:string,init:RequestInit)=>Promise<Response>;
export type ActivationProviderResult=Readonly<{status:'complete';evidence:ActivationEvidence}>|Readonly<{status:'disabled'|'unavailable'|'origin_unconfirmed'|'cancelled'|'busy'|'rate_limited'}>;
const system:BridgeClock={now:Date.now,setTimer:(fn,ms)=>setTimeout(fn,ms),clearTimer:id=>clearTimeout(id as ReturnType<typeof setTimeout>)};
const uuid=(v:unknown):v is string=>typeof v==='string'&&/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(v);
/** Technical endpoints only; no product endpoint or caller-supplied URL is accepted. */
export function createActivationProvider(resolve:()=>{clientId:string;clientSecret:string},options:ExecutionPolicy&{enabled?:boolean;transport?:Transport;clock?:BridgeClock}={}){
 const mode=options.enabled===true?resolveExecutionMode(options):null;
 if(mode===null)return Object.freeze({read:async(_itemId:string,_signal:AbortSignal):Promise<ActivationProviderResult>=>({status:'disabled'}),close(){}});
 let id:string,secret:string,transport:Transport;
 try{const config=resolve();id=config.clientId;secret=config.clientSecret;if(typeof id!=='string'||!/^[A-Za-z0-9_-]{1,256}$/.test(id)||typeof secret!=='string'||!/^[A-Za-z0-9._~/-]{16,512}$/.test(secret)||typeof options.transport!=='function')throw Error();transport=options.transport;}catch{return Object.freeze({read:async(_id:string,_signal:AbortSignal):Promise<ActivationProviderResult>=>({status:'unavailable'}),close(){}});}
 const clock=options.clock??system;let closed=false,cancelActive:(()=>void)|null=null;
 return Object.freeze({
  async read(itemId:string,signal:AbortSignal):Promise<ActivationProviderResult>{
   if(closed||!uuid(itemId))return {status:'unavailable'};if(signal.aborted)return {status:'cancelled'};if(cancelActive)return {status:'busy'};
   const controller=new AbortController();let timer:unknown,scheduled=false,last=-1,key:string|null=null,start=0;
   const now=()=>{const value=clock.now();if(!Number.isSafeInteger(value)||value<0||value<last)throw Error();last=value;return value;};
   const fresh=()=>{if(closed||controller.signal.aborted||signal.aborted||now()-start>=20000)throw Error();};
   let stop:(result:ActivationProviderResult)=>void=()=>{};
   const interrupted=new Promise<ActivationProviderResult>(r=>{stop=r;});
   const cancel=()=>{controller.abort();stop({status:'cancelled'});};cancelActive=cancel;signal.addEventListener('abort',cancel,{once:true});
   try{
    start=now();timer=clock.setTimer(()=>{controller.abort();stop({status:'unavailable'});},20000);scheduled=true;
    const work=async():Promise<ActivationProviderResult>=>{
     let response:Response|undefined,originalItemId:string|null=null;
     try{
      const call=async(path:string,body?:unknown)=>{
       fresh();const url='https://api.pluggy.ai'+path;
       if(path!=='/auth'&&path!=='/items/'+itemId&&path!=='/consents?itemId='+itemId&&path!=='/items/'+originalItemId)throw Error();
       const auth=path==='/auth';if(auth?(body===undefined||key!==null):(body!==undefined||!key))throw Error();
       response=await transport(url,{method:auth?'POST':'GET',headers:{Accept:'application/json','Content-Type':'application/json','Cache-Control':'no-store',...(auth?{}:{'X-API-KEY':key!})},...(auth?{body:JSON.stringify(body)}:{}),signal:controller.signal,redirect:'error',credentials:'omit',cache:'no-store',referrerPolicy:'no-referrer'});
       fresh();if(response.redirected||response.url&&response.url!==url||response.status!==200||!response.ok){if(response.status===429)throw 'rate_limited';throw Error();}
       const raw=await readJsonResponse(response,controller.signal,auth?4096:131072);fresh();return raw;
      };
      const auth=await call('/auth',{clientId:id,clientSecret:secret});
      if(!auth||typeof auth!=='object'||Object.keys(auth).join(',')!=='apiKey'||typeof (auth as {apiKey?:unknown}).apiKey!=='string'||!/^[A-Za-z0-9._~-]{16,4000}$/.test((auth as {apiKey:string}).apiKey))throw Error();
      key=(auth as {apiKey:string}).apiKey;
      const item=await call('/items/'+itemId),consents=await call('/consents?itemId='+itemId);fresh();
      if(!consents||typeof consents!=='object'||!Array.isArray((consents as {results?:unknown}).results)||(consents as {results:unknown[]}).results.length>100)return {status:'origin_unconfirmed'};
      const origins=new Set((consents as {results:unknown[]}).results.map(row=>row&&typeof row==='object'&&Object.hasOwn(row,'itemId')?(row as {itemId:unknown}).itemId:null));
      if(origins.size!==1)return {status:'origin_unconfirmed'};const candidate=[...origins][0];if(!uuid(candidate))return {status:'origin_unconfirmed'};originalItemId=candidate;
      const original=originalItemId===itemId?item:await call('/items/'+originalItemId);fresh();
      const result=verifyActivationEvidence(item,consents,itemId,now(),{enabled:true,mode,privateDataApproved:true},original);
      if(result.kind!=='evidence')return {status:'origin_unconfirmed'};
      fresh();return Object.freeze({status:'complete',evidence:result.evidence});
     }catch(error){return {status:controller.signal.aborted?'cancelled':error==='rate_limited'?'rate_limited':'unavailable'};}
     finally{key=null;try{void response?.body?.cancel().catch(()=>{});}catch{}}
    };
    return await Promise.race([interrupted,work()]);
   }catch{return {status:'unavailable'};}
   finally{key=null;controller.abort();signal.removeEventListener('abort',cancel);if(cancelActive===cancel)cancelActive=null;if(scheduled){try{clock.clearTimer(timer);}catch{}}}
  },
  close(){if(closed)return;closed=true;cancelActive?.();id='';secret='';},
 });
}
