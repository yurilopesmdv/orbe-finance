import { normalizeConnection } from '../../domain/connections.ts';
import { createSyncSession, type SessionAccess } from '../sync/session-cache.ts';
import type { MovementTransportContext } from '../sync/movement-transport.ts';
import type { MovementFilters } from '../../data/local/query.ts';
import type { ProductTransport } from '../sync/product-batch.ts';
import type { StatusResult } from '../connections/status.ts';
import type { AccountRegistryResult } from '../connections/account-registry.ts';
import type { ScreenSnapshot } from '../privacy/screen-protection.ts';
interface Protection { getSnapshot(): ScreenSnapshot; subscribe(listener: () => void): () => void }
interface Ports {
  status(signal: AbortSignal): Promise<StatusResult>;
  registry(connectionId: string, signal: AbortSignal): Promise<AccountRegistryResult>;
  transport(context: MovementTransportContext): ProductTransport;
  scopeFactory(): string;
}
interface Clock { now(): number; set(fn: () => void, ms: number): unknown; clear(handle: unknown): void }
const defaultClock: Clock = { now: Date.now, set: (fn, ms) => setTimeout(fn, ms), clear: id => clearTimeout(id as ReturnType<typeof setTimeout>) };
export interface MovementsSnapshot { readonly phase: 'idle'|'loading'|'ready'|'error'|'closed'; readonly notice: 'none'|'updated'|'partial'|'unavailable'|'cooldown'|'busy'|'cancelled' }
const uuid=(raw:unknown):raw is string=>typeof raw==='string'&&raw.length===36&&/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(raw);
function unavailable():never{throw Error('movement_access_unavailable');}
export function createMovementsController(session:SessionAccess,protection:Protection,ports:Ports,policy:{enabled?:boolean;privateDataApproved?:boolean;clock?:Clock}={}){
 if(policy.enabled!==true||policy.privateDataApproved!==true)return Object.freeze({kind:'disabled' as const});
 const clock=policy.clock??defaultClock,listeners=new Set<()=>void>();
 let closed=false,snapshot:Readonly<MovementsSnapshot>=Object.freeze({phase:'idle',notice:'none'}),stopSession:(()=>void)|undefined,stopProtection:(()=>void)|undefined;
 let pending:{controller:AbortController;cancel:()=>void}|null=null,cache:Extract<ReturnType<typeof createSyncSession>,{kind:'ready'}>|undefined;
 const emit=(phase:MovementsSnapshot['phase'],notice:MovementsSnapshot['notice'])=>{snapshot=Object.freeze({phase,notice});for(const listener of listeners){try{listener();}catch{/* No raw callbacks/errors. */}}};
 const close=()=>{if(closed)return;closed=true;pending?.cancel();cache?.close();const first=stopSession,second=stopProtection;stopSession=undefined;stopProtection=undefined;try{first?.();}catch{}try{second?.();}catch{}emit('closed','cancelled');listeners.clear();};
 const assertCurrent=()=>{try{const screen=protection.getSnapshot();if(closed||session.assertUnlocked()!==undefined||session.getSnapshot().state!=='unlocked'||screen.phase!=='ready'||screen.active!==true)throw Error();}catch{close();return unavailable();}};
 try{
  assertCurrent();
  const created=createSyncSession(session,()=>{assertCurrent();return ports.scopeFactory();},{enabled:true,privateDataApproved:true});if(created.kind!=='ready')return unavailable();cache=created;
  const watch=()=>{try{assertCurrent();}catch{/* close already purged memory. */}};
  const first=session.subscribe(watch);if(closed){first();return unavailable();}stopSession=first;
  const second=protection.subscribe(watch);if(closed){second();return unavailable();}stopProtection=second;assertCurrent();
  const currentCache=cache;
  return Object.freeze({
   kind:'ready' as const,getSnapshot:()=>snapshot,subscribe:(listener:()=>void)=>{if(closed)return()=>{};listeners.add(listener);return()=>{listeners.delete(listener);};},
   query(filters:MovementFilters){assertCurrent();return currentCache.queryMovements(filters,false);},
   exportCache(){assertCurrent();return currentCache.exportCache();},
   restoreCache(data:Parameters<typeof currentCache.restoreCache>[0],connections:Parameters<typeof currentCache.restoreCache>[1]){assertCurrent();currentCache.restoreCache(data,connections);emit('ready','partial');},
   async refresh(connectionId:string,month:string):Promise<boolean>{
    try{assertCurrent();}catch{return false;}if(!uuid(connectionId)||typeof month!=='string'||!/^20[0-9]{2}-(0[1-9]|1[0-2])$/.test(month)){emit('error','unavailable');return false;}if(pending)return false;
    const controller=new AbortController();let timer:unknown,set=false,resolveStop:(value:boolean)=>void=()=>{};
    const stopped=new Promise<boolean>(resolve=>{resolveStop=resolve;}),cancel=()=>{controller.abort();currentCache.cancel();resolveStop(false);};
    pending={controller,cancel};emit('loading','none');
    const fresh=()=>{assertCurrent();if(controller.signal.aborted)return unavailable();};
    try{
     timer=clock.set(()=>{cancel();if(!closed)emit('error','unavailable');},120000);set=true;
     const work=async()=>{
      const metadata=await ports.status(controller.signal);fresh();if(metadata.status!=='complete')return unavailable();
      const selected=metadata.connections.find(row=>row.id===connectionId);if(!selected)return unavailable();
      const normalized=normalizeConnection(selected,{integrationEnabled:true,privateDataApproved:true,now:clock.now()});if(normalized.kind!=='connection'||!normalized.readableProducts.includes('transactions'))return unavailable();
      const institution=selected.institution;
      const captured=Object.freeze({id:normalized.id,institution,revision:normalized.revision,state:'active',capabilities:normalized.capabilities,openFinanceVerifiedAt:normalized.openFinanceVerifiedAt,proxyConsentExpiresAt:normalized.proxyConsentExpiresAt,bankConsentExpiresAt:normalized.bankConsentExpiresAt,sourceUpdatedAt:normalized.sourceUpdatedAt,lastReadAt:normalized.lastReadAt});
      const registry=await ports.registry(connectionId,controller.signal);fresh();if(registry.status!=='complete')return unavailable();
      const context:MovementTransportContext=Object.freeze({ownerSubject:currentCache.scopeId,connectionId,institutionId:institution,month,allowedAccountIds:Object.freeze([...registry.accountIds]),categoryIds:Object.freeze([]),confirmedOwnTransfers:Object.freeze([])});
      const transport=ports.transport(context);fresh();
      const result=await currentCache.runMovements(captured,context,transport,{clock:{now:()=>clock.now(),setTimer:(fn,ms)=>clock.set(fn,ms),clearTimer:id=>clock.clear(id)}});fresh();
      if(result.status==='complete'){emit('ready',result.partial?'partial':'updated');return true;}
      emit('error',result.status==='cooldown'?'cooldown':result.status==='busy'?'busy':result.status==='cancelled'?'cancelled':'unavailable');return false;
     };
     return await Promise.race([stopped,work()]);
    }catch{if(!closed&&!controller.signal.aborted)emit('error','unavailable');return false;}
    finally{controller.abort();if(set){try{clock.clear(timer);}catch{}}if(pending?.controller===controller)pending=null;}
   },
   close,
  });
 }catch{close();return unavailable();}
}
