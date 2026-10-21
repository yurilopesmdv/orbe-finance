import { resolveBackendExecutionMode, type BackendExecutionPolicy } from './execution-mode.ts';
import { createAccountNetworkTransport } from './account-network.ts';
import { readPreparedAccountConfiguration, type AccountConfigurationReader } from './account-configuration.ts';
import { createExactJsonDecoder } from './exact-json.ts';
import { createSupabasePorts } from './supabase-rest.ts';
import { createLeasePorts } from './lease-rest.ts';
import { createReadLeaseHandler } from './read-lease-handler.ts';
import { createMovementProgressPorts } from './movement-progress-rest.ts';
import { createMovementReadHandler } from './movement-handler.ts';
import { createMovementFinalizeHandler } from './movement-finalize-handler.ts';
import { createPluggyMovementsPort } from './pluggy-auth.ts';
type Transport=(url:string,init:RequestInit)=>Promise<Response>;
const response=(status:number,error:string)=>new Response(JSON.stringify({error}),{status,headers:{'Content-Type':'application/json','Cache-Control':'no-store',Pragma:'no-cache','X-Content-Type-Options':'nosniff'}});
function key(raw:unknown){if(typeof raw!=='string'||raw.length!==64||!/^[0-9a-f]{64}$/.test(raw)||/^0+$/.test(raw))throw Error('movement_runtime_unavailable');return Uint8Array.from(raw.match(/../g)!,byte=>parseInt(byte,16));}
/** Prepared composition only. Published entrypoint keeps the independent code gate off. */
export function createMovementBackendRuntime(read:AccountConfigurationReader,options:BackendExecutionPolicy&{transport?:Transport}={}){
 const disabled=Object.freeze({handler:async(_request:Request)=>response(503,'unavailable'),close(){}}),mode=resolveBackendExecutionMode(options);
 if(mode===null)return disabled;
 let identityKey:Uint8Array|undefined,cursorKey:Uint8Array|undefined;
 try{
  const configuration=readPreparedAccountConfiguration(read,'ORBE_MOVEMENT_READS_ENABLED');if(!configuration)return disabled;
  createExactJsonDecoder(undefined,'transactions');
  identityKey=key(read('ORBE_MOVEMENT_IDENTITY_KEY'));cursorKey=key(read('ORBE_MOVEMENT_CURSOR_KEY'));
  if(identityKey.every((value,index)=>value===cursorKey![index]))throw Error();
  const network=options.transport??(mode==='live'?((url:string,init:RequestInit)=>globalThis.fetch(url,init)):undefined);if(typeof network!=='function')throw Error();
  const transport=createAccountNetworkTransport({enabled:true,privateDataApproved:true,network});
  const {origin,publishableKey,secretKey,clientId,clientSecret}=configuration,auth=createSupabasePorts({origin,publishableKey},transport),policy={enabled:true,mode,privateDataApproved:true} as const;
  const progress=createMovementProgressPorts(()=>({origin,secretKey}),{...policy,transport}),lease=createLeasePorts(()=>({origin,secretKey}),{enabled:true,privateDataApproved:true,transport});
  const active=new Set<AbortController>(),providers=new Set<ReturnType<typeof createPluggyMovementsPort>>();let closed=false;
  const authenticate=async(token:string,signal:AbortSignal)=>{const raw=await auth.authenticate(token,signal);return typeof raw==='object'&&raw!==null&&Object.hasOwn(raw,'sessionId')?raw:null;};
  const readHandler=createMovementReadHandler({...progress,authenticate,async readMovements(context,request,signal){
   if(closed||signal.aborted)return{status:'cancelled' as const};
   const scoped=createAccountNetworkTransport({...policy,transactionReadsEnabled:true,transactionScope:{binding:{itemId:context.itemId,accountIds:context.bindings.map(row=>row.externalId)},month:request.month},network});
   const provider=createPluggyMovementsPort(()=>({clientId,clientSecret}),()=>({identityKey:identityKey!,cursorKey:cursorKey!}),{...policy,movementsEnabled:true,transport:scoped});providers.add(provider);
   try{return await provider.readMovements(context,request,signal);}finally{provider.close();providers.delete(provider);}
  }},policy);
  const finalize=createMovementFinalizeHandler({authenticate,finish:progress.finish},policy),acquire=createReadLeaseHandler({authenticate,acquire:lease.acquire,finish:async()=>false},policy);
  return Object.freeze({
   async handler(request:Request):Promise<Response>{
    if(closed)return response(503,'unavailable');if(active.size>=4)return response(429,'rate_limited');
    const controller=new AbortController(),abort=()=>controller.abort();active.add(controller);
    try{
     const url=new URL(request.url),path=url.pathname;
     if(!['/orbe-bridge/movements/read','/orbe-bridge/movements/finalize','/orbe-bridge/reads/acquire'].includes(path))return response(404,'not_found');
     request.signal.addEventListener('abort',abort,{once:true});if(request.signal.aborted)controller.abort();
     url.pathname=path.slice('/orbe-bridge'.length);const internal=new Request(url,new Request(request,{signal:controller.signal}));
     return await (path.endsWith('/movements/read')?readHandler:path.endsWith('/movements/finalize')?finalize:acquire)(internal);
    }catch{return response(503,'unavailable');}
    finally{controller.abort();request.signal.removeEventListener('abort',abort);active.delete(controller);}
   },
   close(){if(closed)return;closed=true;for(const controller of active)controller.abort();active.clear();for(const provider of providers)provider.close();providers.clear();identityKey?.fill(0);cursorKey?.fill(0);},
  });
 }catch{identityKey?.fill(0);cursorKey?.fill(0);return disabled;}
}
