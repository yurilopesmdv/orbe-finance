import { resolveExecutionMode, type ExecutionPolicy } from './execution-mode.ts';
import { createExactJsonDecoder } from './exact-json.ts';
import { createTransactionCursor } from './transaction-cursor.ts';
import { projectMovementBankManifest } from './account-inventory.ts';
import { projectPluggyMovementPage } from './pluggy-movements.ts';
import { createPluggyTargets } from './pluggy-targets.ts';
import { planTransactionMonth } from './transaction-month.ts';
import { readTransactionJsonResponse } from './http-json.ts';
import type { AccountProjectionContext } from './pluggy-accounts.ts';

export interface AuthorizedMovementRead {
  ownerSubject: string; sessionId: string; revision: number; leaseId: string;
  leaseExpiresAt: number; month: string; cursor: string | null;
}
export interface MovementKeyConfiguration { identityKey: Uint8Array; cursorKey: Uint8Array }
const unavailable = Object.freeze({ status:'unavailable' as const });
const uuid=(value:unknown):value is string=>typeof value==='string'&&value.length===36&&/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(value);
type ItemEvidence={expiresAt:number;sourceUpdatedAt:string|null};
/** No API key crosses this boundary. fetchPage is supplied by the protected provider closure. */
export async function prepareMovementRead(rawContext: AccountProjectionContext, input: AuthorizedMovementRead, resolveKeys: () => MovementKeyConfiguration, policy: ExecutionPolicy & { enabled?:boolean; now:()=>number }) {
  const mode=policy.enabled===true?resolveExecutionMode(policy):null;
  if(mode===null)return Object.freeze({kind:'disabled' as const});
  let identityKey:Uint8Array<ArrayBuffer>|null=null,cursorKey:Uint8Array<ArrayBuffer>|null=null;
  try{
    if(!rawContext||!['itemId','connectionId','bindings'].every(key=>Object.hasOwn(rawContext,key)))return unavailable;
    const itemId=rawContext.itemId,connectionId=rawContext.connectionId,rawBindings=rawContext.bindings;
    if(!uuid(itemId)||!uuid(connectionId)||!Array.isArray(rawBindings)||rawBindings.length>1000)return unavailable;
    const internal=new Set<string>(),external=new Set<string>();
    const bindings=Array.from(rawBindings,row=>{
      if(!row||!Object.hasOwn(row,'internalId')||!Object.hasOwn(row,'externalId'))throw Error();
      const internalId=row.internalId,externalId=row.externalId;
      if(!uuid(internalId)||!uuid(externalId)||internal.has(internalId)||external.has(externalId))throw Error();
      internal.add(internalId);external.add(externalId);return Object.freeze({internalId,externalId});
    });
    const context=Object.freeze({itemId,connectionId,bindings:Object.freeze(bindings)});
    if(!input||!['ownerSubject','sessionId','revision','leaseId','leaseExpiresAt','month','cursor'].every(key=>Object.hasOwn(input,key)))return unavailable;
    const {ownerSubject,sessionId,revision,leaseId,leaseExpiresAt,month,cursor}=input;
    if(!uuid(ownerSubject)||!uuid(sessionId)||!uuid(leaseId)||!Number.isSafeInteger(revision)||revision<1||!Number.isSafeInteger(leaseExpiresAt)||!(cursor===null||typeof cursor==='string'&&cursor.length<=512&&/^v1\.[A-Za-z0-9_-]{40,509}$/.test(cursor)))return unavailable;
    const plan=planTransactionMonth(month,{enabled:true,mode,privateDataApproved:true});if(plan.kind!=='plan')return unavailable;
    const windows=plan.windows;
    const now=policy.now,start=now();if(!Number.isSafeInteger(start)||start<0||leaseExpiresAt<=start||leaseExpiresAt-start>120000)return unavailable;
    const decode=createExactJsonDecoder(undefined,'transactions'),keys=resolveKeys();
    if(!keys)return unavailable;
    const identitySource=keys.identityKey,cursorSource=keys.cursorKey;
    if(![identitySource,cursorSource].every(key=>key instanceof Uint8Array&&key.byteLength===32&&key.some(byte=>byte!==0)))return unavailable;
    if(identitySource.every((byte,index)=>byte===cursorSource[index]))return unavailable;
    identityKey=new Uint8Array(32);identityKey.set(identitySource);cursorKey=new Uint8Array(32);cursorKey.set(cursorSource);
    await Promise.all([crypto.subtle.importKey('raw',identityKey,{name:'HMAC',hash:'SHA-256'},false,['sign']),crypto.subtle.importKey('raw',cursorKey,'AES-GCM',false,['encrypt','decrypt'])]);
    let closed=false,used=false,last=start,activeCursor:ReturnType<typeof createTransactionCursor>|null=null;
    const fresh=(signal:AbortSignal,evidence?:ItemEvidence)=>{
      const value=now();if(closed||signal.aborted||!Number.isSafeInteger(value)||value<last||value>=leaseExpiresAt||evidence&&value>=evidence.expiresAt)throw Error('movement_read_unavailable');last=value;
    };
    const close=()=>{closed=true;activeCursor?.close();activeCursor=null;identityKey?.fill(0);cursorKey?.fill(0);};
    return Object.freeze({
      kind:'prepared' as const,
      async read(rawAccounts:unknown,evidence:ItemEvidence,fetchPage:(target:string)=>Promise<Response>,signal:AbortSignal){
        let response:Response|undefined;
        if(closed||used)return unavailable;used=true;
        try{
          fresh(signal,evidence);
          const manifest=projectMovementBankManifest(rawAccounts,context,{enabled:true,mode,privateDataApproved:true});
          if(manifest.kind!=='manifest'||manifest.accounts.length===0)return unavailable;
          activeCursor=createTransactionCursor(()=>cursorKey!,{ownerSubject,sessionId,connectionId:context.connectionId,revision,leaseId,expiresAt:leaseExpiresAt,month,itemId:context.itemId,accounts:manifest.accounts},{enabled:true,mode,privateDataApproved:true,now});
          const position=cursor===null?{kind:'position' as const,accountId:manifest.accounts[0]!.accountId,windowIndex:0,next:null}:await activeCursor.open(cursor);
          fresh(signal,evidence);if(position.kind!=='position')return unavailable;
          const accountIndex=manifest.accounts.findIndex(row=>row.accountId===position.accountId),account=manifest.accounts[accountIndex],window=windows[position.windowIndex];
          if(!account||!window)return unavailable;
          const targets=createPluggyTargets({itemId:context.itemId,accountIds:manifest.accounts.map(row=>row.externalAccountId)});
          const target=position.next===null?targets.firstTransactions(account.externalAccountId,window):targets.nextTransactions(account.externalAccountId,window,position.next);
          if(!target)return unavailable;
          response=await fetchPage(target);fresh(signal,evidence);
          if(response.redirected||response.status!==200||!response.ok)return response.status===429?Object.freeze({status:'rate_limited' as const}):unavailable;
          const raw=await readTransactionJsonResponse(response,signal,decode);fresh(signal,evidence);
          if(typeof raw!=='object'||raw===null||!Object.hasOwn(raw,'next'))return unavailable;
          const next=(raw as Record<string,unknown>).next;targets.nextTransactions(account.externalAccountId,window,next);
          const continueMonth=next===null&&position.windowIndex+1<windows.length;
          let following:{accountId:string;windowIndex:number;next:string|null}|null=null;
          if(next!==null)following={accountId:account.accountId,windowIndex:position.windowIndex,next:next as string};
          else if(continueMonth)following={accountId:account.accountId,windowIndex:position.windowIndex+1,next:null};
          else if(accountIndex+1<manifest.accounts.length)following={accountId:manifest.accounts[accountIndex+1]!.accountId,windowIndex:0,next:null};
          let nextCursor:string|null=null;
          if(following){const sealed=await activeCursor.seal(following.accountId,following.windowIndex,following.next);fresh(signal,evidence);if(sealed.kind!=='cursor')return unavailable;nextCursor=sealed.cursor;}
          const pageCursor=following?.accountId===account.accountId?nextCursor:null;
          const projected=await projectPluggyMovementPage(raw,{ownerSubject,connectionId:context.connectionId,accountId:account.accountId,externalAccountId:account.externalAccountId,itemId:context.itemId,accountKind:'BANK',month,window,nextCursor:pageCursor,continueMonth,windowComplete:false,sourceUpdatedAt:evidence.sourceUpdatedAt},()=>identityKey!,{enabled:true,mode,privateDataApproved:true,signal});
          fresh(signal,evidence);if(projected.kind!=='page')return unavailable;
          const accountCursor=cursor===null||position.windowIndex===0&&position.next===null?null:cursor;
          return Object.freeze({status:'complete' as const,accountIds:Object.freeze(manifest.accounts.map(row=>row.accountId)),envelope:Object.freeze({accountCursor,nextCursor,page:projected.page}),coverage:Object.freeze({partial:true,excludedCreditCount:manifest.excludedCreditCount,unsupportedCurrencyCount:manifest.unsupportedCurrencyCount}),consentExpiresAt:evidence.expiresAt});
        }catch{return signal.aborted?Object.freeze({status:'cancelled' as const}):unavailable;}
        finally{close();try{void response?.body?.cancel().catch(()=>{});}catch{/* No provider details escape. */}}
      },
      close,
    });
  }catch{identityKey?.fill(0);cursorKey?.fill(0);return unavailable;}
}
export type MovementReadResult=Awaited<ReturnType<Extract<Awaited<ReturnType<typeof prepareMovementRead>>,{kind:'prepared'}>['read']>>;
