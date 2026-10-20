const record=(raw:unknown):raw is Record<string,unknown>=>!!raw&&typeof raw==='object'&&!Array.isArray(raw);
function invalid():never{throw Error('provider_item_invalid');}
function instant(raw:unknown):number{
 if(typeof raw!=='string'||!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,6})?(?:Z|[+-]\d{2}:\d{2})$/.test(raw))return invalid();
 const value=Date.parse(raw),day=new Date(raw.slice(0,10)+'T00:00:00Z');
 if(!Number.isFinite(value)||!Number.isFinite(day.getTime())||day.toISOString().slice(0,10)!==raw.slice(0,10)||Number(raw.slice(0,4))<1||Number(raw.slice(11,13))>23||Number(raw.slice(14,16))>59||Number(raw.slice(17,19))>59)return invalid();
 if(!raw.endsWith('Z')){const offset=raw.slice(-5),hours=Number(offset.slice(0,2)),minutes=Number(offset.slice(3));if(hours>14||minutes>59||hours===14&&minutes!==0)return invalid();}
 return value;
}
/** Technical proxy checks only; ownership and original-bank OF proof are separate. */
export function verifyPluggyItem(raw:unknown,itemId:string,now:number){
 try{
  if(!Number.isSafeInteger(now)||now<0||!record(raw)||!['id','connector','status','executionStatus','error','consentExpiresAt','products'].every(key=>Object.hasOwn(raw,key))||raw.id!==itemId||!record(raw.connector)||!Object.hasOwn(raw.connector,'name')||!Object.hasOwn(raw.connector,'isSandbox')||raw.connector.name!=='MeuPluggy'||raw.connector.isSandbox!==false||raw.status!=='UPDATED'||raw.executionStatus!=='SUCCESS'||raw.error!==null)return invalid();
  for(const key of ['parameter','userAction','statusDetail'])if(Object.hasOwn(raw,key)&&raw[key]!==null)return invalid();
  if(!Array.isArray(raw.products)||raw.products.length>32||!raw.products.every(value=>typeof value==='string'&&/^[A-Z_]{1,64}$/.test(value))||!raw.products.includes('ACCOUNTS'))return invalid();
  const expiresAt=instant(raw.consentExpiresAt);if(expiresAt<=now)return invalid();
  const updated=Object.hasOwn(raw,'lastUpdatedAt')&&raw.lastUpdatedAt!==null?instant(raw.lastUpdatedAt):null;
  if(updated!==null&&updated>now+60000)return invalid();
  return Object.freeze({expiresAt,sourceUpdatedAt:updated===null?null:new Date(updated).toISOString()});
 }catch{return invalid();}
}
