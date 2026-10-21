import {resolveExecutionMode,type ExecutionPolicy} from './execution-mode.ts';
export interface ActivationEvidence {readonly itemId:string;readonly originalItemId:string;readonly institution:'bradesco'|'mercado-pago';readonly observedAt:string;readonly proxyConsentExpiresAt:string;readonly bankConsentExpiresAt:string|null;readonly bankConsentIndefinite:boolean;readonly sourceUpdatedAt:string|null;readonly capabilities:Readonly<{accounts:boolean;transactions:boolean;investments:boolean;reserves:false}>}
const record=(v:unknown):v is Record<string,unknown>=>typeof v==='object'&&v!==null&&!Array.isArray(v);
const uuid=(v:unknown):v is string=>typeof v==='string'&&/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(v);
function instant(v:unknown):number{
 if(typeof v!=='string'||!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,6})?(?:Z|[+-]\d{2}:\d{2})$/.test(v))throw Error();
 const time=/T(\d{2}):(\d{2}):(\d{2})/.exec(v);if(!time||Number(time[1])>23||Number(time[2])>59||Number(time[3])>59)throw Error();
 const value=Date.parse(v);if(!Number.isSafeInteger(value))throw Error();
 // Normalize only after checking the civil date; Date.parse may roll invalid days.
 const civil=v.slice(0,10);if(new Date(civil+'T00:00:00Z').toISOString().slice(0,10)!==civil)throw Error();return value;
}
const strings=(v:unknown,max:number):v is string[]=>Array.isArray(v)&&v.length<=max&&v.every(s=>typeof s==='string'&&/^[A-Z_]{1,64}$/.test(s))&&new Set(v).size===v.length;
/** Pure internal verifier. Declared origin or a different item's consent cannot produce evidence. */
export function verifyActivationEvidence(item:unknown,consents:unknown,itemId:string,now:number,policy:ExecutionPolicy&{enabled?:boolean}={},originalItem?:unknown){
 if(policy.enabled!==true||resolveExecutionMode(policy)===null)return Object.freeze({kind:'disabled' as const});
 const denied=Object.freeze({kind:'unavailable' as const});
 try{
  if(!uuid(itemId)||!Number.isSafeInteger(now)||now<0||!record(item)||item.id!==itemId||!record(item.connector)||item.connector.name!=='MeuPluggy'||item.connector.isSandbox!==false||item.status!=='UPDATED'||item.executionStatus!=='SUCCESS'||item.error!==null||!strings(item.products,32))return denied;
  for(const name of ['parameter','userAction','statusDetail'])if(Object.hasOwn(item,name)&&item[name]!==null)return denied;
  const proxyExpiry=instant(item.consentExpiresAt);if(proxyExpiry<=now)return denied;
  if(!record(originalItem)||!uuid(originalItem.id)||!record(originalItem.connector)||originalItem.connector.isOpenFinance!==true||originalItem.connector.isSandbox!==false||originalItem.status!=='UPDATED'||originalItem.executionStatus!=='SUCCESS'||originalItem.error!==null||!strings(originalItem.products,32))return denied;
  const originalItemId=originalItem.id,institution=originalItem.connector.id===603?'bradesco':originalItem.connector.id===606?'mercado-pago':null;if(institution===null)return denied;
  if(!record(consents)||consents.page!==1||!Number.isSafeInteger(consents.total)||!Number.isSafeInteger(consents.totalPages)||!Array.isArray(consents.results)||consents.total!==consents.results.length||consents.results.length>100||consents.totalPages!==(consents.results.length?1:0)&&!(consents.results.length===0&&consents.totalPages===1))return denied;
  const active:Record<string,unknown>[]=[];
  for(const row of consents.results){
   if(!record(row)||!['itemId','createdAt','expiresAt','revokedAt','products','openFinancePermissionsGranted'].every(k=>Object.hasOwn(row,k))||row.itemId!==originalItemId||!strings(row.products,32)||!strings(row.openFinancePermissionsGranted,64))return denied;
   const created=instant(row.createdAt),expiry=row.expiresAt===null?null:instant(row.expiresAt);
   if(created>now||expiry!==null&&expiry<=created)return denied;
   if(row.revokedAt!==null){if(instant(row.revokedAt)<created)return denied;continue;}
   if(expiry===null||expiry>now)active.push(row);
  }
  if(active.length!==1)return denied;
  const consent=active[0]!,permissions=consent.openFinancePermissionsGranted as string[],products=consent.products as string[];
  const enabled=(product:string)=>item.products instanceof Array&&item.products.includes(product)&&originalItem.products instanceof Array&&originalItem.products.includes(product)&&products.includes(product);
  const all=permissions.includes('ACCOUNTS_ALL'),accounts=enabled('ACCOUNTS')&&(all||permissions.includes('ACCOUNTS_LIST')&&permissions.includes('ACCOUNTS_BALANCES'));
  const transactions=accounts&&enabled('TRANSACTIONS')&&(all||permissions.includes('ACCOUNTS_TRANSACTIONS'));
  const investments=enabled('INVESTMENTS')&&permissions.includes('INVESTMENTS_ALL');
  if(!accounts&&!investments)return denied;
  const updated=item.lastUpdatedAt===null||!Object.hasOwn(item,'lastUpdatedAt')?null:instant(item.lastUpdatedAt);if(updated!==null&&updated>now)return denied;
  const evidence:ActivationEvidence=Object.freeze({itemId,originalItemId,institution,observedAt:new Date(now).toISOString(),proxyConsentExpiresAt:new Date(proxyExpiry).toISOString(),bankConsentExpiresAt:consent.expiresAt===null?null:new Date(instant(consent.expiresAt)).toISOString(),bankConsentIndefinite:consent.expiresAt===null,sourceUpdatedAt:updated===null?null:new Date(updated).toISOString(),capabilities:Object.freeze({accounts,transactions,investments,reserves:false})});
  return Object.freeze({kind:'evidence' as const,evidence});
 }catch{return denied;}
}
