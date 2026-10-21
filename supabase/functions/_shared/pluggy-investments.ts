import { resolveExecutionMode, type ExecutionPolicy } from './execution-mode.ts';
import { exactInteger } from './exact-json.ts';
import { providerCents } from './pluggy-accounts.ts';
export interface InvestmentProjectionContext { itemId:string;connectionId:string;bindings:readonly Readonly<{externalId:string;internalId:string}>[];sourceUpdatedAt:string|null }
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
/** Pure bounded snapshot projection. Caller must authorize bindings, session, lease and source first. */
export function projectPluggyInvestmentSnapshot(raw:unknown,input:InvestmentProjectionContext,policy:ExecutionPolicy&{enabled?:boolean}={}){
 if(policy.enabled!==true||resolveExecutionMode(policy)===null)return Object.freeze({kind:'disabled' as const});
 try{
  const ctx=fields(input,['itemId','connectionId','bindings','sourceUpdatedAt']),itemId=ctx.itemId,connectionId=ctx.connectionId,sourceUpdatedAt=date(ctx.sourceUpdatedAt,true),bindings=ctx.bindings;
  if(!uuid(itemId)||!uuid(connectionId)||!Array.isArray(bindings)||bindings.length>1000)return unavailable;
  const known=new Map<string,string>(),internal=new Set<string>();
  for(const rawBinding of bindings){const binding=fields(rawBinding,['externalId','internalId']),externalId=binding.externalId,internalId=binding.internalId;if(!uuid(externalId)||!uuid(internalId)||known.has(externalId)||internal.has(internalId))return unavailable;known.set(externalId,internalId);internal.add(internalId);}
  const source=fields(raw,['page','total','totalPages','results']),results=source.results;
  if(!Array.isArray(results)||results.length>1000)return unavailable;
  const page=exactInteger(source.page,1,1),total=exactInteger(source.total,1000),pages=exactInteger(source.totalPages,1);
  if(page!==1||total!==results.length||total>0&&pages!==1)return unavailable;
  const rows=new Map<string,Readonly<{id:string;connectionId:string;product:'investment';currency:string;grossCents:number|null;netCents:number|null;valueBasis:'net';asOf:string|null;relation:'unknown';parent:null;assetClass:ReturnType<typeof assetClass>;kind:'asset'}>>();let unsupportedCurrencyCount=0;const currencies=new Map<string,unknown>();
  for(const value of results){
   const row=fields(value,['id','itemId','type','status']),externalId=row.id,type=row.type;
   if(!uuid(externalId)||row.itemId!==itemId||typeof type!=='string'||!/^[A-Z_]{1,64}$/.test(type)||row.status!=='ACTIVE')return unavailable;
   const internalId=known.get(externalId);if(!internalId)return unavailable;
   const currency=Object.hasOwn(row,'currencyCode')?row.currencyCode:null;
   if(currencies.has(externalId)&&currencies.get(externalId)!==currency)return unavailable;currencies.set(externalId,currency);
   if(typeof currency!=='string'||!['BRL','USD','EUR'].includes(currency)){unsupportedCurrencyCount++;continue;}
   const projected=Object.freeze({id:internalId,connectionId,product:'investment' as const,currency,grossCents:Object.hasOwn(row,'amount')?providerCents(row.amount):null,netCents:Object.hasOwn(row,'balance')?providerCents(row.balance):null,valueBasis:'net' as const,asOf:Object.hasOwn(row,'date')?date(row.date):null,relation:'unknown' as const,parent:null,assetClass:assetClass(type),kind:'asset' as const});
   const prior=rows.get(internalId);if(prior&&JSON.stringify(prior)!==JSON.stringify(projected))return unavailable;rows.set(internalId,projected);
  }
  return Object.freeze({kind:'page' as const,receivedRows:results.length,page:Object.freeze({connectionId,product:'investment' as const,items:Object.freeze([...rows.values()]),nextCursor:null,authoritative:false,sourceUpdatedAt}),coverage:Object.freeze({partial:true,unsupportedCurrencyCount})});
 }catch{return unavailable;}
}
