import { readPreparedAccountConfiguration, type AccountConfigurationReader } from './account-configuration.ts';
import { createSupabasePorts } from './supabase-rest.ts';
import { createLeasePorts } from './lease-rest.ts';
import { createAccountBindingResolver } from './account-binding-rest.ts';
import { createPluggyAccountsPort } from './pluggy-auth.ts';
import { createAccountRouter } from './account-router.ts';
type Transport=(url:string,init:RequestInit)=>Promise<Response>;
const result=(status:number,error:string)=>new Response(JSON.stringify({error}),{status,headers:{'Content-Type':'application/json','Cache-Control':'no-store',Pragma:'no-cache','X-Content-Type-Options':'nosniff'}});
/** Fixture boot only. Published entrypoint remains literal false and imports none of this. */
export function createAccountBackendRuntime(read:AccountConfigurationReader,options:{fixtureOnly?:boolean;transport?:Transport}={}){
 const disabled=Object.freeze({handler:async(_request:Request)=>result(503,'unavailable'),close(){}});
 if(options.fixtureOnly!==true)return disabled;
 let provider:ReturnType<typeof createPluggyAccountsPort>|undefined;
 try{
  const configuration=readPreparedAccountConfiguration(read,'ORBE_ACCOUNT_READS_ENABLED');
  if(!configuration)return disabled;
  const transport=options.transport;if(typeof transport!=='function')return disabled;
  const {origin,publishableKey,secretKey,clientId,clientSecret}=configuration;
  const auth=createSupabasePorts({origin,publishableKey},transport),lease=createLeasePorts(()=>({origin,secretKey}),{enabled:true,privateDataApproved:true,transport}),resolve=createAccountBindingResolver(()=>({origin,secretKey}),{enabled:true,fixtureOnly:true,transport});
  provider=createPluggyAccountsPort(()=>({clientId,clientSecret}),{enabled:true,fixtureOnly:true,transport});
  const router=createAccountRouter({authenticate:auth.authenticate,resolve,check:lease.check,acquire:lease.acquire,finish:lease.finish,readAccounts:provider.readAccounts},{enabled:true,fixtureOnly:true});
  const active=new Set<AbortController>();let closed=false;
  return Object.freeze({
   async handler(request:Request):Promise<Response>{
    if(closed)return result(503,'unavailable');if(active.size>=4)return result(429,'rate_limited');
    const controller=new AbortController();active.add(controller);const abort=()=>controller.abort();
    try{
     const url=new URL(request.url),paths=['/orbe-bridge/reads/acquire','/orbe-bridge/accounts/read','/orbe-bridge/reads/finalize'];
     if(!paths.includes(url.pathname))return result(404,'not_found');
     request.signal.addEventListener('abort',abort,{once:true});if(request.signal.aborted)controller.abort();
     url.pathname=url.pathname.slice('/orbe-bridge'.length);
     return await router(new Request(url,new Request(request,{signal:controller.signal})));
    }catch{return result(503,'unavailable');}
    finally{controller.abort();request.signal.removeEventListener('abort',abort);active.delete(controller);}
   },
   close(){if(closed)return;closed=true;for(const controller of active)controller.abort();active.clear();provider?.close();},
  });
 }catch{provider?.close();return disabled;}
}
