import {resolveBackendExecutionMode,type BackendExecutionPolicy} from './execution-mode.ts';
import {createAccountNetworkTransport} from './account-network.ts';
import {readPreparedAccountConfiguration,type AccountConfigurationReader} from './account-configuration.ts';
import {createExactJsonDecoder} from './exact-json.ts';
import {createSupabasePorts} from './supabase-rest.ts';
import {createPendingInventoryPorts} from './pending-inventory-rest.ts';
import {createActivationCommit} from './activation-rest.ts';
import {createConnectionActivationHandler} from './activation-handler.ts';
import {createActivationProvider} from './activation-provider.ts';
type Transport=(url:string,init:RequestInit)=>Promise<Response>;
const response=(status:number,error:string)=>new Response(JSON.stringify({error}),{status,headers:{'Content-Type':'application/json','Cache-Control':'no-store',Pragma:'no-cache','X-Content-Type-Options':'nosniff'}});
/** Prepared composition only. Entrypoint requires the independent owner release switch. */
export function createActivationBackendRuntime(read:AccountConfigurationReader,options:BackendExecutionPolicy&{transport?:Transport}={}){
 const disabled=Object.freeze({handler:async(_request:Request)=>response(503,'unavailable'),close(){}}),mode=resolveBackendExecutionMode(options);
 if(mode===null)return disabled;
 try{
  const configuration=readPreparedAccountConfiguration(read,'ORBE_CONNECTION_ACTIVATION_ENABLED');if(!configuration)return disabled;
  createExactJsonDecoder();
  const network=options.transport??(mode==='live'?((url:string,init:RequestInit)=>globalThis.fetch(url,init)):undefined);if(typeof network!=='function')throw Error();
  const transport=createAccountNetworkTransport({enabled:true,privateDataApproved:true,network});
  const {origin,publishableKey,secretKey,clientId,clientSecret}=configuration,auth=createSupabasePorts({origin,publishableKey},transport),policy={enabled:true,mode,privateDataApproved:true} as const;
  const pending=createPendingInventoryPorts(()=>({origin,secretKey}),{...policy,transport}),commit=createActivationCommit(()=>({origin,secretKey}),{...policy,transport});
  const active=new Set<AbortController>(),provider=createActivationProvider(()=>({clientId,clientSecret}),{...policy,transport:network});let closed=false;
  const handler=createConnectionActivationHandler({authenticate:auth.authenticate,resolve:pending.resolve,verify:provider.read,activate:commit},policy);
  return Object.freeze({
   async handler(request:Request):Promise<Response>{
    if(closed)return response(503,'unavailable');if(active.size>=4)return response(429,'rate_limited');
    const controller=new AbortController(),abort=()=>controller.abort();active.add(controller);
    try{
     const url=new URL(request.url),path=url.pathname;
     if(path!=='/orbe-bridge/connections/activate')return response(404,'not_found');
     request.signal.addEventListener('abort',abort,{once:true});if(request.signal.aborted)controller.abort();
     url.pathname=path.slice('/orbe-bridge'.length);const internal=new Request(url,new Request(request,{signal:controller.signal}));
     return await handler(internal);
    }catch{return response(503,'unavailable');}
    finally{controller.abort();request.signal.removeEventListener('abort',abort);active.delete(controller);}
   },
   close(){if(closed)return;closed=true;for(const controller of active)controller.abort();active.clear();provider.close();},
  });
 }catch{return disabled;}
}
