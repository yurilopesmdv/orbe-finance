import { createAccountsController } from './controller.ts';
import { createConnectionStatusReader } from '../connections/status.ts';
import { createAccountRegistryReader } from '../connections/account-registry.ts';
import { createAccountTransport } from '../sync/account-transport.ts';
import type { HttpSession, SessionTransport } from '../../lib/session-json.ts';
import type { SessionAccess } from '../sync/session-cache.ts';
import type { AuthConfig } from '../auth/gateway.ts';
import type { ScreenProtectionModel } from '../privacy/screen-protection.ts';
export function createAccountsRuntime(session:HttpSession&SessionAccess,protection:Pick<ScreenProtectionModel,'getSnapshot'|'subscribe'>,config:()=>AuthConfig|null,transport:SessionTransport,scopeFactory:()=>string,policy:{accountReadsEnabled?:boolean;liveIntegrationEnabled?:boolean;privateFinancialDataApproved?:boolean}={}){
 if(policy.accountReadsEnabled!==true||policy.liveIntegrationEnabled!==true||policy.privateFinancialDataApproved!==true)return Object.freeze({kind:'disabled' as const});
 try{
  const reader=createConnectionStatusReader(session,config,transport,{enabled:true}),registry=createAccountRegistryReader(session,config,transport,{enabled:true});
  const controller=createAccountsController(session,protection,{scopeFactory,status:signal=>reader.read(signal),registry:registry.read,transport:context=>createAccountTransport(session,config,transport,context,{enabled:true,privateDataApproved:true})},{enabled:true,privateDataApproved:true});
  if(controller.kind!=='ready')throw Error();
  return Object.freeze({kind:'ready' as const,controller,async connections(signal:AbortSignal){const screen=protection.getSnapshot();if(controller.getSnapshot().phase==='closed'||screen.phase!=='ready'||!screen.active)throw Error('account_access_unavailable');return reader.read(signal);},close:controller.close});
 }catch{return Object.freeze({kind:'unavailable' as const});}
}
