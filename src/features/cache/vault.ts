export interface CachePorts {read():Promise<Uint8Array|null>;write(bytes:Uint8Array):Promise<void>;remove():Promise<void>;encrypt(bytes:Uint8Array,context:string):Promise<Uint8Array>;decrypt(bytes:Uint8Array,context:string):Promise<Uint8Array>}
export const CACHE_MAX=4*1024*1024,CACHE_AGE=30*86400000;
const uuid=(v:string)=>/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(v);
/** Serialized encrypted persistence, not a source of authorization. No plaintext fallback. */
export function createCacheVault(project:string,ports:CachePorts,now=Date.now){
 if(!/^https:\/\/[a-z]{20}\.supabase\.co$/.test(project))throw Error('cache_configuration');
 let epoch=0,queue=Promise.resolve();
 const serial=<T>(work:()=>Promise<T>)=>{const next=queue.then(work,work);queue=next.then(()=>{},()=>{});return next;};
 const context=(owner:string)=>{if(!uuid(owner))throw Error('cache_owner');return 'orbe.wallet.v1|'+project+'|'+owner;};
 return Object.freeze({
  load(owner:string){const ticket=epoch;return serial(async()=>{try{const aad=context(owner),raw=await ports.read();if(!raw||raw.byteLength>CACHE_MAX+128||ticket!==epoch)return null;const plain=await ports.decrypt(raw,aad);if(plain.byteLength>CACHE_MAX)return null;const value=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(plain));if(ticket!==epoch||value.version!==1||value.owner!==owner||value.project!==project||!Number.isSafeInteger(value.savedAt)||value.savedAt>now()||now()-value.savedAt>CACHE_AGE)return null;return {savedAt:value.savedAt,data:value.data};}catch{return null;}});},
  save(owner:string,data:unknown){const ticket=epoch;return serial(async()=>{try{const aad=context(owner);if(ticket!==epoch)return false;const plain=new TextEncoder().encode(JSON.stringify({version:1,owner,project,savedAt:now(),data}));if(plain.byteLength>CACHE_MAX)return false;const encrypted=await ports.encrypt(plain,aad);if(ticket!==epoch)return false;await ports.write(encrypted);if(ticket!==epoch){await ports.remove();return false;}return true;}catch{return false;}});},
  clear(){epoch++;return serial(async()=>{await ports.remove();});}
 });
}
export type CacheVault=ReturnType<typeof createCacheVault>;
