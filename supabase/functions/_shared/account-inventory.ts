import { resolveExecutionMode, type ExecutionPolicy } from './execution-mode.ts';
import { exactInteger } from './exact-json.ts';
const object = (value: unknown): value is Record<string, unknown> => value !== null && typeof value === 'object' && !Array.isArray(value);
const fail = (): never => { throw Error('account_inventory_invalid'); };
const uuid = (value: unknown): string => {
  if (typeof value !== 'string' || value.length !== 36 || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(value)) return fail();
  return value;
};
/** Shared private parser: never reads financial values or identity fields. */
function parseInventory(raw: unknown, expectedItemId: string) {
  const itemId = uuid(expectedItemId);
  if (!object(raw) || !['page','total','totalPages','results'].every(key=>Object.hasOwn(raw,key)) || !Array.isArray(raw.results) || raw.results.length>1000) return fail();
  const page=exactInteger(raw.page,1,1),total=exactInteger(raw.total,1000),pages=exactInteger(raw.totalPages,1);
  if(page!==1||total!==raw.results.length||total>0&&pages!==1) return fail();
  const ids=new Set<string>(),accounts:Readonly<{externalId:string;type:'BANK'|'CREDIT';currency:string|null}>[]=[];
  for(const row of raw.results){
    if(!object(row)||!['id','itemId','type'].every(key=>Object.hasOwn(row,key)))return fail();
    const externalId=uuid(row.id),sourceItem=row.itemId,type=row.type;
    if(sourceItem!==itemId||ids.has(externalId)||type!=='BANK'&&type!=='CREDIT')return fail();
    ids.add(externalId);let currency:string|null=null;
    if(type==='BANK'){
      if(!Object.hasOwn(row,'currencyCode'))return fail();
      const rawCurrency=row.currencyCode;
      if(typeof rawCurrency!=='string'||rawCurrency.length!==3||!/^[A-Z]{3}$/.test(rawCurrency))return fail();
      currency=rawCurrency;
    }
    accounts.push(Object.freeze({externalId,type,currency}));
  }
  return Object.freeze(accounts);
}
/** Private metadata projection only; does not authorize collection or create bindings. */
export function projectAccountInventory(raw: unknown, expectedItemId: string, policy: ExecutionPolicy & { enabled?: boolean } = {}) {
  if(policy.enabled!==true||resolveExecutionMode(policy)===null)return Object.freeze({kind:'disabled' as const});
  try{
    const parsed=parseInventory(raw,expectedItemId);
    return Object.freeze({kind:'inventory' as const,accounts:Object.freeze(parsed.map(row=>Object.freeze({externalId:row.externalId,kind:'unknown' as const,currency:row.currency}))),creditAccounts:parsed.filter(row=>row.type==='CREDIT').length});
  }catch{return fail();}
}
export interface MovementManifestContext { itemId: string; bindings: readonly { externalId: string; internalId: string }[] }
/** Server-only manifest. Ownership/consent/lease must already be established by the caller. */
export function projectMovementBankManifest(raw: unknown, context: MovementManifestContext, policy: ExecutionPolicy & { enabled?: boolean } = {}) {
  if(policy.enabled!==true||resolveExecutionMode(policy)===null)return Object.freeze({kind:'disabled' as const});
  try{
    if(!object(context)||!Object.hasOwn(context,'itemId')||!Object.hasOwn(context,'bindings'))return fail();
    const itemId=uuid(context.itemId),rows=context.bindings;
    if(!Array.isArray(rows)||rows.length>1000)return fail();
    const bindings=new Map<string,string>(),internal=new Set<string>();
    for(const row of rows){
      if(!object(row)||!Object.hasOwn(row,'externalId')||!Object.hasOwn(row,'internalId'))return fail();
      const externalId=uuid(row.externalId),internalId=uuid(row.internalId);
      if(bindings.has(externalId)||internal.has(internalId))return fail();
      bindings.set(externalId,internalId);internal.add(internalId);
    }
    const parsed=parseInventory(raw,itemId);
    if(parsed.length!==bindings.size)return fail();
    let excludedCreditCount=0,unsupportedCurrencyCount=0;
    const accounts:Readonly<{accountId:string;externalAccountId:string;currency:string}>[]=[];
    for(const row of parsed){
      const accountId=bindings.get(row.externalId);if(!accountId)return fail();
      if(row.type==='CREDIT'){excludedCreditCount++;continue;}
      if(row.currency===null||!['BRL','USD','EUR'].includes(row.currency)){unsupportedCurrencyCount++;continue;}
      accounts.push(Object.freeze({accountId,externalAccountId:row.externalId,currency:row.currency}));
    }
    if(accounts.length>100)return fail();
    accounts.sort((a,b)=>a.accountId<b.accountId?-1:a.accountId>b.accountId?1:0);
    return Object.freeze({kind:'manifest' as const,accounts:Object.freeze(accounts),excludedCreditCount,unsupportedCurrencyCount,partial:excludedCreditCount>0||unsupportedCurrencyCount>0});
  }catch{throw Error('movement_manifest_invalid');}
}
