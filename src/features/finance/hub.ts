import {normalizeConnection} from '../../domain/connections.ts';
import type {CacheVault} from '../cache/vault.ts';
import type { ConnectionMetadata, StatusResult } from '../connections/status.ts';
import type { createAccountsRuntime } from '../accounts/runtime.ts';
import type { createMovementsRuntime } from '../movements/runtime.ts';
import type { createInvestmentsRuntime } from '../investments/runtime.ts';
import type { SessionAccess } from '../sync/session-cache.ts';
import type { ScreenSnapshot } from '../privacy/screen-protection.ts';
import { occurrenceMonth } from '../../domain/money.ts';
type Ready<T>=Extract<T,{kind:'ready'}>;
export interface FinanceClients { accounts:Ready<ReturnType<typeof createAccountsRuntime>>; movements:Ready<ReturnType<typeof createMovementsRuntime>>; investments:Ready<ReturnType<typeof createInvestmentsRuntime>> }
export type FinanceProduct='accounts'|'transactions'|'investments';
export interface ProductReadState {readonly connectionId:string;readonly revision:number;readonly product:FinanceProduct;readonly month:string|null;readonly status:'loading'|'complete'|'unavailable'|'cooldown';readonly cachedItems:number|null;readonly lastSuccessAt:number|null}
export interface FinanceSnapshot {readonly cacheState?:'empty'|'restored'|'saved'|'unavailable';readonly cacheSavedAt?:number|null;readonly reads:readonly Readonly<ProductReadState>[];readonly phase:'idle'|'syncing'|'ready'|'partial'|'closed';readonly connections:readonly Readonly<ConnectionMetadata>[];readonly progress:string;readonly completedAt:number|null;readonly nextAt:number|null;readonly revision:number}
interface Protection { getSnapshot():ScreenSnapshot;subscribe(fn:()=>void):()=>void }
interface Ports {activate?:(id:string)=>Promise<boolean>;cache?:{vault:CacheVault;owner:string};clients:FinanceClients;status(signal:AbortSignal):Promise<StatusResult>;now?:()=>number;set?:(fn:()=>void,ms:number)=>unknown;clear?:(id:unknown)=>void}
/** Owns foreground financial state independently of navigation. Optional encrypted device cache; no logging or telemetry. */
export function createFinanceHub(session:SessionAccess,protection:Protection,ports:Ports){
 const now=ports.now??Date.now,set=ports.set??((fn,ms)=>setTimeout(fn,ms)),clear=ports.clear??(id=>clearTimeout(id as ReturnType<typeof setTimeout>));
 const clients=ports.clients,listeners=new Set<()=>void>(),stops:(()=>void)[]=[],success=new Map<string,number>();let queued=false,restored=false,closed=false,busy=false,timer:unknown,controller:AbortController|null=null;
 let snapshot:Readonly<FinanceSnapshot>=Object.freeze({phase:'idle',reads:[],connections:[],progress:'',completedAt:null,nextAt:null,revision:0});
 const emit=(patch:Partial<FinanceSnapshot>={})=>{snapshot=Object.freeze({...snapshot,...patch,revision:snapshot.revision+1});for(const fn of listeners){try{fn();}catch{}}};
 const close=()=>{if(closed)return;closed=true;controller?.abort();clear(timer);for(const stop of stops){try{stop();}catch{}}for(const client of Object.values(clients))client.close();success.clear();emit({phase:'closed',reads:[],connections:[],progress:'',completedAt:null,nextAt:null});listeners.clear();};
 const current=()=>{const screen=protection.getSnapshot();if(closed||session.getSnapshot().state!=='unlocked'||screen.phase!=='ready'||!screen.active){close();throw Error('finance_locked');}session.assertUnlocked();};
 const watch=()=>{try{current();}catch{}};
 try{current();stops.push(session.subscribe(watch),protection.subscribe(watch));for(const client of Object.values(clients))stops.push(client.controller.subscribe(()=>{if(!closed)emit();}));}catch{close();}
 const runProduct=async(connection:Readonly<ConnectionMetadata>,product:FinanceProduct,month:string)=>{
  current();
  const selectedMonth=product==='transactions'?month:null;
  const previous=snapshot.reads.find(row=>row.connectionId===connection.id&&row.revision===connection.revision&&row.product===product&&row.month===selectedMonth);
  const updateRead=(patch:Partial<ProductReadState>)=>emit({reads:Object.freeze([...snapshot.reads.filter(row=>!(row.connectionId===connection.id&&row.product===product&&row.month===selectedMonth)),Object.freeze({connectionId:connection.id,revision:connection.revision,product,month:selectedMonth,status:'loading' as const,cachedItems:previous?.cachedItems??null,lastSuccessAt:previous?.lastSuccessAt??null,...patch})])});
  updateRead({status:'loading'});emit({progress:connection.institution+' · '+product});
  const ok=product==='accounts'?await clients.accounts.controller.refresh(connection.id):product==='transactions'?await clients.movements.controller.refresh(connection.id,month):await clients.investments.controller.refresh(connection.id);current();
  const client=product==='accounts'?clients.accounts:product==='transactions'?clients.movements:clients.investments;
  let cachedItems=previous?.cachedItems??null;
  if(ok){
   cachedItems=product==='accounts'?clients.accounts.controller.query().items.filter(row=>row.connectionId===connection.id).length:product==='investments'?clients.investments.controller.query({connectionId:connection.id}).items.length:clients.movements.controller.query({month,institutionId:connection.institution,limit:1,offset:0}).totalCount;
  }
  updateRead({status:ok?'complete':client.controller.getSnapshot().notice==='cooldown'?'cooldown':'unavailable',cachedItems,lastSuccessAt:ok?now():previous?.lastSuccessAt??null});
  if(ok)success.set([connection.id,connection.revision,product,product==='transactions'?month:''].join(':'),now());
  return {ok,cooldown:client.controller.getSnapshot().notice==='cooldown'};
 };
 const saveCache=async()=>{
  if(!ports.cache||closed)return;
  try{current();const data={connections:snapshot.connections,reads:snapshot.reads,accounts:clients.accounts.controller.exportCache(),movements:clients.movements.controller.exportCache(),investments:clients.investments.controller.exportCache()};const ok=await ports.cache.vault.save(ports.cache.owner,data);if(!closed)emit({cacheState:ok?'saved':'unavailable',cacheSavedAt:ok?now():snapshot.cacheSavedAt});}catch{if(!closed)emit({cacheState:'unavailable'});}
 };
 const restoreCache=async()=>{
  if(restored||!ports.cache)return;restored=true;
  const cached=await ports.cache.vault.load(ports.cache.owner);current();if(!cached)return;
  try{
   const data=cached.data;
   if(!data||!Array.isArray(data.connections)||!Array.isArray(data.reads)||data.connections.length>100||data.reads.length>1000)throw Error();
   const eligible=snapshot.connections.filter(connection=>normalizeConnection(connection,{integrationEnabled:true,privateDataApproved:true,now:now()}).readableProducts.length>0&&data.connections.some((old:ConnectionMetadata)=>old.id===connection.id&&old.revision===connection.revision&&old.institution===connection.institution));
   for(const [name,client] of Object.entries(clients)){const stored=name==='accounts'?data.accounts:name==='movements'?data.movements:data.investments;const product=name==='accounts'?'accounts':name==='movements'?'transactions':'investments';client.controller.restoreCache(stored,eligible.filter(connection=>connection.capabilities[product]===true));}
   const reads=data.reads.filter((read:ProductReadState)=>eligible.some(connection=>connection.id===read.connectionId&&connection.revision===read.revision&&connection.sourceUpdatedAt===data.connections.find((old:ConnectionMetadata)=>old.id===connection.id)?.sourceUpdatedAt)&&['accounts','transactions','investments'].includes(read.product)&&Number.isSafeInteger(read.lastSuccessAt)&&read.lastSuccessAt!>0&&read.lastSuccessAt!<=now()&&(read.month===null||/^\d{4}-\d{2}$/.test(read.month)));
   for(const read of reads)if(read.status==='complete')success.set([read.connectionId,read.revision,read.product,read.month??''].join(':'),read.lastSuccessAt!);
   emit({reads:Object.freeze(reads),cacheState:'restored',cacheSavedAt:cached.savedAt});
  }catch{await ports.cache.vault.clear();if(!closed)emit({cacheState:'unavailable'});}
 };
 async function synchronize(force=false,only?:{connectionId:string;product:FinanceProduct;month?:string}){
  try{current();}catch{return false;}if(busy){if(!only)queued=true;return false;}busy=true;clear(timer);controller=new AbortController();emit({phase:'syncing',progress:'conexões',nextAt:null});let failed=false,cooldown=false,finished=false;
  try{
   const result=await ports.status(controller.signal);current();if(result.status!=='complete')throw Error();for(const connection of result.connections){const old=snapshot.connections.find(row=>row.id===connection.id);if(old&&old.sourceUpdatedAt!==connection.sourceUpdatedAt)for(const key of success.keys())if(key.startsWith(connection.id+':'))success.delete(key);}
   emit({connections:Object.freeze([...result.connections]),reads:Object.freeze(snapshot.reads.filter(read=>result.connections.some(connection=>connection.id===read.connectionId&&connection.revision===read.revision&&connection.state==='active')))});
   await restoreCache();current();
   if(ports.activate){for(const connection of snapshot.connections){if(connection.state!=='pending')continue;emit({progress:'Preparando '+connection.institution});if(!await ports.activate(connection.id))failed=true;current();}const refreshed=await ports.status(controller.signal);current();if(refreshed.status==='complete')emit({connections:refreshed.connections});}
   const month=only?.month??occurrenceMonth(new Date(now()).toISOString());
   for(const connection of snapshot.connections){if(connection.state!=='active'||only&&connection.id!==only.connectionId)continue;
    for(const product of ['accounts','transactions','investments'] as const){if(only&&only.product!==product||connection.capabilities[product]!==true)continue;
     const previous=new Date(month+'-15T12:00:00Z');previous.setUTCMonth(previous.getUTCMonth()-1);
     const months=product==='transactions'&&!only?[month,previous.toISOString().slice(0,7)]:[month];
     for(const selectedMonth of months){
      const key=[connection.id,connection.revision,product,product==='transactions'?selectedMonth:''].join(':'),last=success.get(key);
      if(!force&&last!==undefined&&now()-last<900000)continue;
      const outcome=await runProduct(connection,product,selectedMonth);if(outcome.ok)await saveCache();failed ||= !outcome.ok;cooldown ||= outcome.cooldown;
     }
    }
   }
   finished=true;emit({phase:failed?'partial':'ready',completedAt:now(),progress:cooldown?'intervalo':''});return !failed;
  }catch{if(!closed)emit({phase:'partial',progress:''});return false;}
  finally{controller?.abort();controller=null;busy=false;if(!closed){const delay=queued?0:cooldown?30000:failed||!finished?60000:900000;queued=false;emit({nextAt:now()+delay});timer=set(()=>{void synchronize(false);},delay);}}
 }
 return Object.freeze({clients,getSnapshot:()=>snapshot,subscribe(fn:()=>void){if(closed)return()=>{};listeners.add(fn);return()=>{listeners.delete(fn);};},synchronize,close});
}
export type FinanceHub=ReturnType<typeof createFinanceHub>;
