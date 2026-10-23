import {readPreparedAccountConfiguration,type AccountConfigurationReader} from './account-configuration.ts';
import {createSupabasePorts} from './supabase-rest.ts';
import {createAccountNetworkTransport} from './account-network.ts';
import {createActivationProvider} from './activation-provider.ts';
import {readJsonResponse} from './http-json.ts';
type Transport=(url:string,init:RequestInit)=>Promise<Response>;
const uuid=(v:unknown):v is string=>typeof v==='string'&&/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(v);
const object=(v:unknown):v is Record<string,unknown>=>v!==null&&typeof v==='object'&&!Array.isArray(v);
const reply=(status:number,body:unknown)=>new Response(JSON.stringify(body),{status,headers:{'Content-Type':'application/json','Cache-Control':'no-store',Pragma:'no-cache','X-Content-Type-Options':'nosniff'}});
/** Only metadata and short-lived Connect token operations. No product reads. */
export function createConnectRuntime(read:AccountConfigurationReader,network:Transport=fetch){
 const config=readPreparedAccountConfiguration(read,'ORBE_CONNECTION_ACTIVATION_ENABLED');
 if(!config)return {handler:async(_r:Request)=>reply(503,{error:'unavailable'}),close(){}};
 const auth=createSupabasePorts(config,createAccountNetworkTransport({enabled:true,privateDataApproved:true,network}));
 const verifier=createActivationProvider(()=>({clientId:config.clientId,clientSecret:config.clientSecret}),{enabled:true,mode:'live',privateDataApproved:true,transport:network});
 const active=new Set<AbortController>();let closed=false,apiKey:string|null=null,keyUntil=0;
 return {
  async handler(request:Request){
   if(closed)return reply(503,{error:'unavailable'});if(active.size>=2)return reply(429,{error:'rate_limited'});
   const controller=new AbortController(),abort=()=>controller.abort(),timer=setTimeout(abort,20000);active.add(controller);request.signal.addEventListener('abort',abort,{once:true});if(request.signal.aborted)abort();
   try{
    const url=new URL(request.url),operation=url.pathname==='/orbe-bridge/connections/connect-token'?'begin':url.pathname==='/orbe-bridge/connections/import'?'confirm':null;
    if(!operation||url.search||url.hash)return reply(400,{error:'invalid_request'});
    if(request.method!=='POST')return reply(405,{error:'method_not_allowed'});
    const bearer=/^Bearer ([A-Za-z0-9._~-]{1,8192})$/.exec(request.headers.get('authorization')??'');if(!bearer)return reply(401,{error:'unauthorized'});
    if(!/^application\/json(?:;\s*charset=utf-8)?$/i.test(request.headers.get('content-type')??''))return reply(415,{error:'unsupported_media_type'});
    const first=await auth.authenticate(bearer[1]!,controller.signal);
    if(!object(first)||first.isOwner!==true||!uuid(first.subject)||!uuid(first.sessionId)||typeof first.expiresAt!=='number'||first.expiresAt<=Date.now())return reply(401,{error:'unauthorized'});
    const body=await readJsonResponse(new Response(request.body,{headers:request.headers}),controller.signal,4096);
    if(!object(body)||Object.keys(body).sort().join(',')!==(operation==='begin'?'':'flowId,itemId')||operation==='confirm'&&(!uuid(body.flowId)||!uuid(body.itemId)))return reply(400,{error:'invalid_request'});
    const flowId=operation==='begin'?crypto.randomUUID():body.flowId as string;
    const call=async(target:string,payload?:unknown)=>{
     if(controller.signal.aborted||first.expiresAt as number<=Date.now())throw Error();
     const rpc=target==='/rest/v1/rpc/orbe_connect_flow';
     if(!rpc&&target!=='/auth'&&target!=='/connect_token'&&target!=='/items/'+body.itemId)throw Error();
     const origin=rpc?config.origin:'https://api.pluggy.ai',post=target!=='/items/'+body.itemId;
     const response=await network(origin+target,{method:post?'POST':'GET',headers:{Accept:'application/json','Content-Type':'application/json','Cache-Control':'no-store',...(rpc?{apikey:config.secretKey}:target==='/auth'?{}:{'X-API-KEY':apiKey!})},...(post?{body:JSON.stringify(payload)}:{}),signal:controller.signal,cache:'no-store',credentials:'omit',redirect:'error',referrerPolicy:'no-referrer'});
     if(response.status!==200||response.redirected||response.url&&response.url!==origin+target)throw Error();return readJsonResponse(response,controller.signal,target==='/auth'?4096:131072);
    };
    const scope={p_owner_id:first.subject,p_session_id:first.sessionId,p_flow_id:flowId};
    const gate=await call('/rest/v1/rpc/orbe_connect_flow',{...scope,p_operation:operation==='begin'?'begin':'inspect'});
    if(!object(gate)||gate.flowId!==flowId)return reply(409,{error:'connection_not_available'});
    if(!apiKey||keyUntil<=Date.now()){
     const authenticated=await call('/auth',{clientId:config.clientId,clientSecret:config.clientSecret});
     if(!object(authenticated)||typeof authenticated.apiKey!=='string'||!/^[A-Za-z0-9._~-]{16,4000}$/.test(authenticated.apiKey))throw Error();apiKey=authenticated.apiKey;keyUntil=Date.now()+119*60000;
    }
    if(operation==='begin'){
     const value=await call('/connect_token',{options:{clientUserId:flowId,avoidDuplicates:false}});
     if(!object(value)||typeof value.accessToken!=='string'||!/^[A-Za-z0-9._~-]{16,8192}$/.test(value.accessToken))throw Error();
     const final=await auth.authenticate(bearer[1]!,controller.signal);if(!object(final)||final.subject!==first.subject||final.sessionId!==first.sessionId||final.isOwner!==true||controller.signal.aborted)throw Error();
     return reply(200,{flowId,connectToken:value.accessToken});
    }
    const item=await call('/items/'+body.itemId);
    if(!object(item)||item.id!==body.itemId||item.clientUserId!==flowId)return reply(409,{error:'origin_unconfirmed'});
    const checked=await verifier.read(body.itemId as string,controller.signal);
    if(checked.status!=='complete')return reply(409,{error:'origin_unconfirmed'});
    const final=await auth.authenticate(bearer[1]!,controller.signal);if(!object(final)||final.subject!==first.subject||final.sessionId!==first.sessionId||final.isOwner!==true)throw Error();
    const result=await call('/rest/v1/rpc/orbe_connect_flow',{...scope,p_operation:'confirm',p_item_id:body.itemId,p_institution:checked.evidence.institution});
    if(!object(result)||!uuid(result.connectionId)||result.institution!==checked.evidence.institution||!Number.isSafeInteger(result.revision)||!['pending','active'].includes(result.state as string))return reply(409,{error:'connection_not_available'});
    return reply(200,{status:'registered',connectionId:result.connectionId,institution:result.institution});
   }catch{apiKey=null;keyUntil=0;return reply(controller.signal.aborted?504:503,{error:'unavailable'});}
   finally{clearTimeout(timer);controller.abort();request.signal.removeEventListener('abort',abort);active.delete(controller);}
  },
  close(){closed=true;apiKey=null;for(const c of active)c.abort();verifier.close();}
 };
}
