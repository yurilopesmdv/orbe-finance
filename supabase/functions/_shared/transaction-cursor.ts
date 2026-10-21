import { resolveExecutionMode, type ExecutionPolicy } from './execution-mode.ts';
import { planTransactionMonth } from './transaction-month.ts';
import { createPluggyTargets } from './pluggy-targets.ts';

export interface TransactionCursorScope {
  ownerSubject: string; sessionId: string; connectionId: string; revision: number; leaseId: string;
  expiresAt: number; month: string; itemId: string;
  accounts: readonly { accountId: string; externalAccountId: string }[];
}
type Failure = Readonly<{ kind: 'disabled' | 'unavailable' }>;
type Sealed = Failure | Readonly<{ kind: 'cursor'; cursor: string }>;
/** Private server position; never serialize this as an HTTP DTO. */
type Opened = Failure | Readonly<{ kind: 'position'; accountId: string; windowIndex: number; next: string | null }>;
interface Port { seal(accountId: unknown, windowIndex: unknown, next: unknown): Promise<Sealed>; open(cursor: unknown): Promise<Opened>; close(): void }
const unavailable: Failure = Object.freeze({ kind: 'unavailable' });
const disabled: Failure = Object.freeze({ kind: 'disabled' });
const inert = (failure: Failure): Readonly<Port> => Object.freeze({ seal: async () => failure, open: async () => failure, close() {} });
const uuid = (value: unknown): value is string => typeof value === 'string' && value.length === 36 && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(value);
function record(value: unknown, keys: readonly string[]): Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value) || !keys.every(key => Object.hasOwn(value,key))) throw Error('transaction_cursor_invalid');
  return value as Record<string, unknown>;
}
const encode = (bytes: Uint8Array) => btoa(String.fromCharCode(...bytes)).replaceAll('+','-').replaceAll('/','_').replace(/=+$/,'');
function decode(value: string): Uint8Array<ArrayBuffer> {
  const binary = atob(value.replaceAll('-','+').replaceAll('_','/'));
  const bytes = new Uint8Array(binary.length); for (let i=0;i<binary.length;i++) bytes[i]=binary.charCodeAt(i);
  if (encode(bytes) !== value) throw Error('transaction_cursor_invalid'); return bytes;
}

export function createTransactionCursor(readKey: () => Uint8Array | Promise<Uint8Array>, rawScope: TransactionCursorScope, policy: ExecutionPolicy & { enabled?: boolean; now?: () => number; crypto?: Pick<Crypto,'subtle'|'getRandomValues'> } = {}): Readonly<Port> {
  if (policy.enabled !== true || resolveExecutionMode(policy) === null) return inert(disabled);
  try {
    const scope = record(rawScope,['ownerSubject','sessionId','connectionId','revision','leaseId','expiresAt','month','itemId','accounts']);
    const { ownerSubject,sessionId,connectionId,revision,leaseId,expiresAt,month,itemId }=scope;
    const rawAccounts=scope.accounts;
    if (![ownerSubject,sessionId,connectionId,leaseId,itemId].every(uuid) || !Number.isSafeInteger(revision) || (revision as number)<0 || !Number.isSafeInteger(expiresAt) || typeof readKey !== 'function' || !Array.isArray(rawAccounts) || rawAccounts.length<1 || rawAccounts.length>100) return inert(unavailable);
    const internal=new Set<string>(),external=new Set<string>();
    const accounts=rawAccounts.map(raw=>{
      const row=record(raw,['accountId','externalAccountId']),{accountId,externalAccountId}=row;
      if (!uuid(accountId)||!uuid(externalAccountId)||internal.has(accountId)||external.has(externalAccountId)) throw Error('transaction_cursor_invalid');
      internal.add(accountId);external.add(externalAccountId);return Object.freeze({accountId,externalAccountId});
    });
    if(internal.size!==accounts.length||external.size!==accounts.length)return inert(unavailable);
    const plan=planTransactionMonth(month,policy);if(plan.kind!=='plan') return inert(unavailable);
    const windows=plan.windows;
    const now=policy.now??Date.now,crypto=policy.crypto??globalThis.crypto;
    let last=now(),closed=false,keyPromise:Promise<CryptoKey|null>|null=null;
    if(!Number.isSafeInteger(last)||last<0||(expiresAt as number)<=last||(expiresAt as number)-last>120000) return inert(unavailable);
    const aad=new TextEncoder().encode(JSON.stringify(['orbe:movements:cursor:v1',ownerSubject,sessionId,connectionId,revision,leaseId,expiresAt,month,itemId,accounts.map(row=>[row.accountId,row.externalAccountId])]));
    const targets=createPluggyTargets({itemId:itemId as string,accountIds:accounts.map(row=>row.externalAccountId)});
    function fresh(){
      try{const value=now();if(closed||!Number.isSafeInteger(value)||value<last||value>=(expiresAt as number))throw Error();last=value;return true;}
      catch{closed=true;keyPromise=null;return false;}
    }
    function valid(a:unknown,w:unknown,n:unknown){
      if(!Number.isSafeInteger(a)||!Number.isSafeInteger(w)||(a as number)<0||(a as number)>=accounts.length||(w as number)<0||(w as number)>=windows.length)throw Error('transaction_cursor_invalid');
      if(n===null&&a===0&&w===0)throw Error('transaction_cursor_invalid');
      const account=accounts[a as number]!,window=windows[w as number]!;
      targets.nextTransactions(account.externalAccountId,window,n);
      return {a:a as number,w:w as number,n:n as string|null};
    }
    const key=()=>{
      if(!keyPromise)keyPromise=(async()=>{
        let copy:Uint8Array<ArrayBuffer>|null=null;
        try{
          const source=await readKey();if(closed||!(source instanceof Uint8Array)||source.byteLength!==32||!source.some(byte=>byte!==0))return null;
          copy=new Uint8Array(32);copy.set(source);
          const imported=await crypto.subtle.importKey('raw',copy,'AES-GCM',false,['encrypt','decrypt']);return closed?null:imported;
        }catch{return null;}finally{copy?.fill(0);}
      })();return keyPromise;
    };
    return Object.freeze({
      async seal(accountId:unknown,windowIndex:unknown,next:unknown):Promise<Sealed>{
        try{
          if(!fresh())return unavailable;
          const position=valid(accounts.findIndex(row=>row.accountId===accountId),windowIndex,next);
          const plain=new TextEncoder().encode(JSON.stringify(position));
          if(3+Math.ceil((plain.byteLength+28)*4/3)>512)return unavailable;
          const imported=await key();if(!imported||!fresh())return unavailable;
          const iv=new Uint8Array(12);crypto.getRandomValues(iv);
          const encrypted=new Uint8Array(await crypto.subtle.encrypt({name:'AES-GCM',iv,additionalData:aad,tagLength:128},imported,plain));
          if(!fresh())return unavailable;
          const bytes=new Uint8Array(iv.byteLength+encrypted.byteLength);bytes.set(iv);bytes.set(encrypted,iv.byteLength);
          const cursor='v1.'+encode(bytes);return cursor.length<=512?Object.freeze({kind:'cursor' as const,cursor}):unavailable;
        }catch{return unavailable;}
      },
      async open(cursor:unknown):Promise<Opened>{
        try{
          if(!fresh()||typeof cursor!=='string'||cursor.length>512||!/^v1\.[A-Za-z0-9_-]{40,509}$/.test(cursor))return unavailable;
          const bytes=decode(cursor.slice(3));if(bytes.byteLength<29)return unavailable;
          const imported=await key();if(!imported||!fresh())return unavailable;
          const plaintext=await crypto.subtle.decrypt({name:'AES-GCM',iv:bytes.slice(0,12),additionalData:aad,tagLength:128},imported,bytes.slice(12));
          if(!fresh())return unavailable;
          const raw=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(plaintext)),parsed=record(raw,['a','w','n']);
          if(Object.keys(parsed).length!==3)return unavailable;
          const position=valid(parsed.a,parsed.w,parsed.n);
          return Object.freeze({kind:'position' as const,accountId:accounts[position.a]!.accountId,windowIndex:position.w,next:position.n});
        }catch{return unavailable;}
      },
      close(){closed=true;keyPromise=null;},
    });
  }catch{return inert(unavailable);}
}
