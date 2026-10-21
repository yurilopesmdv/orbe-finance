import { AuthFailure, type AuthConfig } from '../auth/gateway.ts';
import { createSessionJsonClient, type HttpSession, type SessionTransport } from '../../lib/session-json.ts';
const record=(raw:unknown):raw is Record<string,unknown>=>!!raw&&typeof raw==='object'&&!Array.isArray(raw);
const uuid=(raw:unknown):raw is string=>typeof raw==='string'&&/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(raw);
export type PositionRegistryResult=Readonly<{status:'complete';positionIds:readonly string[]}>|Readonly<{status:'disabled'|'locked'|'cancelled'|'rate_limited'|'unavailable'}>;
export function createPositionRegistryReader(session:HttpSession,resolveConfig:()=>AuthConfig|null,transport:SessionTransport,policy:{enabled?:boolean;timeoutMs?:number}={}){
 const enabled=policy.enabled===true;
 // Disabled gate returns before touching session/config/transport or input.
 if(!enabled)return Object.freeze({read:async(_connectionId:string,_signal:AbortSignal):Promise<PositionRegistryResult>=>Object.freeze({status:'disabled'})});
 const request=createSessionJsonClient(session,resolveConfig,transport,policy.timeoutMs??20000);
 return Object.freeze({async read(connectionId:string,signal:AbortSignal):Promise<PositionRegistryResult>{
  try{
   if(!uuid(connectionId))throw Error();
   const rows=await request('positionRegistry',undefined,signal);
   if(!Array.isArray(rows)||rows.length>1000)throw Error();
   const seen=new Set<string>(),ids:string[]=[];
   for(const row of rows){if(!record(row)||!Object.hasOwn(row,'id')||!Object.hasOwn(row,'connection_id')||!Object.hasOwn(row,'product')||row.product!=='investment'||!uuid(row.id)||!uuid(row.connection_id)||seen.has(row.id))throw Error();seen.add(row.id);if(row.connection_id===connectionId)ids.push(row.id);}
   return Object.freeze({status:'complete',positionIds:Object.freeze(ids)});
  }catch(error){return Object.freeze({status:error instanceof AuthFailure?error.code==='invalid_credentials'?'locked':error.code==='cancelled'?'cancelled':error.code==='rate_limited'?'rate_limited':'unavailable':'unavailable'});}
 }});
}
