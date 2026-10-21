import { resolveExecutionMode, type ExecutionPolicy } from './execution-mode.ts';
import { exactInteger } from './exact-json.ts';
import { providerCents } from './pluggy-accounts.ts';
export interface InvestmentProjectionContext { itemId:string;connectionId:string;bindings:readonly Readonly<{externalId:string;internalId:string}>[];sourceUpdatedAt:string|null }
type Policy=ExecutionPolicy&{enabled?:boolean};
const unavailable=Object.freeze({kind:'unavailable' as const});
const record=(raw:unknown):raw is Record<string,unknown>=>typeof raw==='object'&&raw!==null&&!Array.isArray(raw);
const uuid=(raw:unknown):raw is string=>typeof raw==='string'&&raw.length===36&&/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(raw);
function fields(raw:unknown,names:readonly string[]){if(!record(raw)||!names.every(name=>Object.hasOwn(raw,name)))throw Error('investment_projection_invalid');return raw;}
function date(raw:unknown,instantOnly=false):string|null{
 if(raw===null)return null;
 if(typeof raw!=='string'||!(instantOnly?/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?Z$/:/^\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?Z)?$/).test(raw))throw Error();
 const value=new Date(raw.length===10?raw+'T00:00:00Z':raw);
 if(!Number.isFinite(value.getTime())||value.toISOString().slice(0,raw.length===10?10:19)!==raw.slice(0,raw.length===10?10:19))throw Error();
 return raw.length===10?raw:value.toISOString();
}
function assetClass(type:string){return type==='FIXED_INCOME'?'fixed_income' as const:type==='MUTUAL_FUND'||type==='ETF'?'fund' as const:type==='EQUITY'?'equity' as const:type==='COE'||type==='SECURITY'||type==='OTHER'?'other' as const:'unknown' as const;}
type CapturedRow=Readonly<{externalId:string;kind:'unsupported'}>|Readonly<{externalId:string;kind:'supported';currency:string;grossCents:number|null;netCents:number|null;asOf:string|null;assetClass:ReturnType<typeof assetClass>}>;
interface CapturedSnapshot {itemId:string;rows:readonly CapturedRow[];unsupportedCurrencyCount:number}
export interface PreparedInvestmentSnapshot {readonly kind:'snapshot';readonly externalIds:readonly string[];readonly receivedRows:number}
const snapshots=new WeakMap<object,CapturedSnapshot>();
/** Backend-only preparation. The returned IDs are for internal staging, never an HTTP DTO. */
export function preparePluggyInvestmentSnapshot(raw:unknown,itemId:string,policy:Policy={}){
 if(policy.enabled!==true||resolveExecutionMode(policy)===null)return Object.freeze({kind:'disabled' as const});
 try{
  if(!uuid(itemId))return unavailable;
  const source=fields(raw,['page','total','totalPages','results']),results=source.results;
  if(!Array.isArray(results)||results.length>1000)return unavailable;
  const page=exactInteger(source.page,1,1),total=exactInteger(source.total,1000),pages=exactInteger(source.totalPages,1);
  if(page!==1||total!==results.length||total>0&&pages!==1)return unavailable;
  const rows=new Map<string,CapturedRow>();let unsupportedCurrencyCount=0;
  for(const value of results){
   const row=fields(value,['id','itemId','type','status']),externalId=row.id,type=row.type;
   if(!uuid(externalId)||row.itemId!==itemId||typeof type!=='string'||!/^[A-Z_]{1,64}$/.test(type)||row.status!=='ACTIVE')return unavailable;
   const currency=Object.hasOwn(row,'currencyCode')?row.currencyCode:null;
   let captured:CapturedRow;
   if(typeof currency!=='string'||!['BRL','USD','EUR'].includes(currency)){
    unsupportedCurrencyCount++;captured=Object.freeze({externalId,kind:'unsupported'});
   }else captured=Object.freeze({externalId,kind:'supported',currency,grossCents:Object.hasOwn(row,'amount')?providerCents(row.amount):null,netCents:Object.hasOwn(row,'balance')?providerCents(row.balance):null,asOf:Object.hasOwn(row,'date')?date(row.date):null,assetClass:assetClass(type)});
   const prior=rows.get(externalId);if(prior&&JSON.stringify(prior)!==JSON.stringify(captured))return unavailable;rows.set(externalId,captured);
  }
  const handle:Readonly<PreparedInvestmentSnapshot>=Object.freeze({kind:'snapshot',externalIds:Object.freeze([...rows.keys()]),receivedRows:results.length});
  snapshots.set(handle,Object.freeze({itemId,rows:Object.freeze([...rows.values()]),unsupportedCurrencyCount}));return handle;
 }catch{return unavailable;}
}
/** Discard private captured values; this is not a heap-wiping guarantee. */
export function discardInvestmentSnapshot(handle:unknown):void{if(typeof handle==='object'&&handle!==null)snapshots.delete(handle);}
/** Only a genuine prepared snapshot and separately authorized real bindings can produce the DTO. */
export function projectPreparedInvestmentSnapshot(handle:unknown,input:InvestmentProjectionContext,policy:Policy={}){
 if(policy.enabled!==true||resolveExecutionMode(policy)===null)return Object.freeze({kind:'disabled' as const});
 try{
  const captured=typeof handle==='object'&&handle!==null?snapshots.get(handle):undefined;if(!captured)return unavailable;
  const ctx=fields(input,['itemId','connectionId','bindings','sourceUpdatedAt']),itemId=ctx.itemId,connectionId=ctx.connectionId,sourceUpdatedAt=date(ctx.sourceUpdatedAt,true),bindings=ctx.bindings;
  if(!uuid(itemId)||itemId!==captured.itemId||!uuid(connectionId)||!Array.isArray(bindings)||bindings.length>1000)return unavailable;
  const known=new Map<string,string>(),internal=new Set<string>();
  for(const rawBinding of bindings){const binding=fields(rawBinding,['externalId','internalId']),externalId=binding.externalId,internalId=binding.internalId;if(!uuid(externalId)||!uuid(internalId)||known.has(externalId)||internal.has(internalId))return unavailable;known.set(externalId,internalId);internal.add(internalId);}
  const items=[];
  for(const row of captured.rows){
   const internalId=known.get(row.externalId);if(!internalId)return unavailable;if(row.kind==='unsupported')continue;
   items.push(Object.freeze({id:internalId,connectionId,product:'investment' as const,currency:row.currency,grossCents:row.grossCents,netCents:row.netCents,valueBasis:'net' as const,asOf:row.asOf,relation:'unknown' as const,parent:null,assetClass:row.assetClass,kind:'asset' as const}));
  }
  return Object.freeze({kind:'page' as const,receivedRows:(handle as PreparedInvestmentSnapshot).receivedRows,page:Object.freeze({connectionId,product:'investment' as const,items:Object.freeze(items),nextCursor:null,authoritative:false,sourceUpdatedAt}),coverage:Object.freeze({partial:true,unsupportedCurrencyCount:captured.unsupportedCurrencyCount})});
 }catch{return unavailable;}
}
/** Pure bounded snapshot projection. Caller separately authorizes ownership and read scope. */
export function projectPluggyInvestmentSnapshot(raw:unknown,input:InvestmentProjectionContext,policy:Policy={}){
 if(policy.enabled!==true||resolveExecutionMode(policy)===null)return Object.freeze({kind:'disabled' as const});
 let handle:unknown;
 try{
  const ctx=fields(input,['itemId','connectionId','bindings','sourceUpdatedAt']);if(!uuid(ctx.itemId))return unavailable;
  handle=preparePluggyInvestmentSnapshot(raw,ctx.itemId,policy);
  return projectPreparedInvestmentSnapshot(handle,input,policy);
 }catch{return unavailable;}
 finally{discardInvestmentSnapshot(handle);}
}
