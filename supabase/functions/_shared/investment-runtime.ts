import { resolveBackendExecutionMode, type BackendExecutionPolicy } from './execution-mode.ts';
import { createAccountNetworkTransport } from './account-network.ts';
import { readPreparedAccountConfiguration, type AccountConfigurationReader } from './account-configuration.ts';
import { createExactJsonDecoder } from './exact-json.ts';
import { createSupabasePorts } from './supabase-rest.ts';
import { createLeasePorts } from './lease-rest.ts';
import { createReadLeaseHandler } from './read-lease-handler.ts';
import { createInvestmentProgressPorts } from './investment-progress-rest.ts';
import { createInvestmentReadHandler } from './investment-handler.ts';
import { createInvestmentFinalizeHandler } from './investment-finalize-handler.ts';
import { createPluggyInvestmentsPort } from './pluggy-auth.ts';
type Transport=(url:string,init:RequestInit)=>Promise<Response>;
const response=(status:number,error:string)=>new Response(JSON.stringify({error}),{status,headers:{'Content-Type':'application/json','Cache-Control':'no-store',Pragma:'no-cache','X-Content-Type-Options':'nosniff'}});
/** Prepared composition only. Published entrypoint keeps the independent code gate off. */
export function createInvestmentBackendRuntime(read:AccountConfigurationReader,options:BackendExecutionPolicy&{transport?:Transport}={}){
 const disabled=Object.freeze({handler:async(_request:Request)=>response(503,'unavailable'),close(){}}),mode=resolveBackendExecutionMode(options);
 if(mode===null)return disabled;
 try{
  const configuration=readPreparedAccountConfiguration(read,'ORBE_INVESTMENT_READS_ENABLED');if(!configuration)return disabled;
  createExactJsonDecoder(undefined,'investments');
  const network=options.transport??(mode==='live'?((url:string,init:RequestInit)=>globalThis.fetch(url,init)):undefined);if(typeof network!=='function')throw Error();
  const transport=createAccountNetworkTransport({enabled:true,privateDataApproved:true,network});
  const {origin,publishableKey,secretKey,clientId,clientSecret}=configuration,auth=createSupabasePorts({origin,publishableKey},transport),policy={enabled:true,mode,privateDataApproved:true} as const;
  const progress=createInvestmentProgressPorts(()=>({origin,secretKey}),{...policy,transport}),lease=createLeasePorts(()=>({origin,secretKey}),{enabled:true,privateDataApproved:true,transport});
  const active=new Set<AbortController>(),providers=new Set<ReturnType<typeof createPluggyInvestmentsPort>>();let closed=false;
  const authenticate=async(token:string,signal:AbortSignal)=>{const raw=await auth.authenticate(token,signal);return typeof raw==='object'&&raw!==null&&Object.hasOwn(raw,'sessionId')?raw:null;};
  const readHandler=createInvestmentReadHandler({...progress,authenticate,async readInvestments(context,request,resolveBindings,signal){
   if(closed||signal.aborted)return{status:'cancelled' as const};
   const scoped:Transport=(url,init)=>{
    const parsed=new URL(url),page=parsed.pathname==='/investments'?Number(parsed.searchParams.get('page')):1;
    return createAccountNetworkTransport({...policy,investmentReadsEnabled:true,investmentScope:{itemId:context.itemId,page},network})(url,init);
   };
   const provider=createPluggyInvestmentsPort(()=>({clientId,clientSecret}),{...policy,investmentsEnabled:true,transport:scoped});providers.add(provider);
   try{return await provider.readInvestments(context,request,resolveBindings,signal);}finally{provider.close();providers.delete(provider);}
  }},policy);
  const finalize=createInvestmentFinalizeHandler({authenticate,finish:progress.finish},policy),acquire=createReadLeaseHandler({authenticate,acquire:lease.acquire,finish:async()=>false},{...policy,allowedProducts:[...(read('ORBE_ACCOUNT_READS_ENABLED')==='true'?['accounts']:[]),...(read('ORBE_MOVEMENT_READS_ENABLED')==='true'?['transactions']:[]),...(read('ORBE_INVESTMENT_READS_ENABLED')==='true'?['investments']:[])]});
  return Object.freeze({
   async handler(request:Request):Promise<Response>{
    if(closed)return response(503,'unavailable');if(active.size>=4)return response(429,'rate_limited');
    const controller=new AbortController(),abort=()=>controller.abort();active.add(controller);
    try{
     const url=new URL(request.url),path=url.pathname;
     if(!['/orbe-bridge/investments/read','/orbe-bridge/investments/finalize','/orbe-bridge/reads/acquire'].includes(path))return response(404,'not_found');
     request.signal.addEventListener('abort',abort,{once:true});if(request.signal.aborted)controller.abort();
     url.pathname=path.slice('/orbe-bridge'.length);const internal=new Request(url,new Request(request,{signal:controller.signal}));
     return await (path.endsWith('/investments/read')?readHandler:path.endsWith('/investments/finalize')?finalize:acquire)(internal);
    }catch{return response(503,'unavailable');}
    finally{controller.abort();request.signal.removeEventListener('abort',abort);active.delete(controller);}
   },
   close(){if(closed)return;closed=true;for(const controller of active)controller.abort();active.clear();for(const provider of providers)provider.close();providers.clear();},
  });
 }catch{return disabled;}
}
