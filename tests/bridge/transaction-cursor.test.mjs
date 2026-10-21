import test from 'node:test';
import assert from 'node:assert/strict';
import { webcrypto } from 'node:crypto';
import { createTransactionCursor } from '../../supabase/functions/_shared/transaction-cursor.ts';
const uid=n=>`00000000-0000-4000-8000-${String(n).padStart(12,'0')}`;
const scope={ownerSubject:uid(1),sessionId:uid(2),connectionId:uid(3),revision:1,leaseId:uid(4),expiresAt:121000,month:'2026-10',itemId:uid(5),accounts:[{accountId:uid(6),externalAccountId:uid(7)},{accountId:uid(8),externalAccountId:uid(9)}]};
const key=()=>new Uint8Array(32).fill(7),policy={enabled:true,mode:'fixture',now:()=>1000};
const query=(account=uid(7),from='2026-10-01',to='2026-10-31',after='invented_cursor')=>'?accountId='+account+'&dateFrom='+from+'&dateTo='+to+'&after='+after;
const fixture=(ctx=scope,read=key,extra={})=>createTransactionCursor(read,ctx,{...policy,...extra});
async function sealed(port=fixture()){const result=await port.seal(uid(6),0,query());assert.equal(result.kind,'cursor');return result.cursor;}

test('disabled gates do not touch scope key crypto clock or inputs',async()=>{
  const poison=new Proxy({}, {get(){throw Error('private');},getOwnPropertyDescriptor(){throw Error('private');}});
  for(const options of [{},{enabled:true},{enabled:true,mode:'live'}]){
    const port=createTransactionCursor(()=>{throw Error('private');},poison,{...options,get now(){throw Error();},get crypto(){throw Error();}});
    assert.deepEqual(await port.seal(poison,poison,poison),{kind:'disabled'});assert.deepEqual(await port.open(poison),{kind:'disabled'});port.close();
  }
});

test('roundtrip yields bounded opaque cursor with fresh random IV on every sealing',async()=>{
  const port=fixture(),a=await sealed(port),b=await sealed(port);assert.notEqual(a,b);assert.match(a,/^v1\.[A-Za-z0-9_-]+$/);assert.ok(a.length<=512);
  assert.deepEqual(await port.open(a),{kind:'position',accountId:uid(6),windowIndex:0,next:query()});
  assert.deepEqual(Object.keys(port),['seal','open','close']);
  for(const privateText of [scope.ownerSubject,scope.sessionId,scope.itemId,uid(7),query(),'invented_cursor'])assert.ok(!a.includes(privateText));port.close();
});

test('AAD rejects another owner session connection revision lease expiry month item or manifest',async()=>{
  const token=await sealed();
  const changes=[{ownerSubject:uid(90)},{sessionId:uid(90)},{connectionId:uid(90)},{revision:2},{leaseId:uid(90)},{expiresAt:120999},{month:'2026-11'},{itemId:uid(90)},{accounts:[...scope.accounts].reverse()},{accounts:[{...scope.accounts[0],externalAccountId:uid(90)},scope.accounts[1]]}];
  for(const change of changes){const port=fixture({...scope,...change});assert.deepEqual(await port.open(token),{kind:'unavailable'});port.close();}
});

test('key separation and ciphertext tag nonce or format tampering fail generically',async()=>{
  const token=await sealed(),other=fixture(scope,()=>new Uint8Array(32).fill(9));assert.deepEqual(await other.open(token),{kind:'unavailable'});
  const flip=(text,i)=>text.slice(0,i)+(text[i]==='A'?'B':'A')+text.slice(i+1);
  for(const value of [flip(token,5),flip(token,token.length-2),token.slice(0,-10),token+'=',token+'\n','v2.'+token.slice(3),'v1.'+'x'.repeat(510),null,{}])assert.deepEqual(await fixture().open(value),{kind:'unavailable'});
});

test('subsequent window and account transitions carry no invented end-of-product claim',async()=>{
  const port=fixture();
  const window=await port.seal(uid(6),1,null);assert.equal(window.kind,'cursor');assert.deepEqual(await port.open(window.cursor),{kind:'position',accountId:uid(6),windowIndex:1,next:null});
  const account=await port.seal(uid(8),0,null);assert.equal(account.kind,'cursor');assert.deepEqual(await port.open(account.cursor),{kind:'position',accountId:uid(8),windowIndex:0,next:null});
  assert.deepEqual(await port.seal(uid(6),0,null),{kind:'unavailable'});port.close();
});

test('invalid scope and manifest are rejected before key access',async()=>{
  let reads=0;const read=()=>{reads++;return key();};
  for(const change of [{accounts:[]},{accounts:Array(1)},{accounts:[scope.accounts[0],scope.accounts[0]]},{accounts:[{accountId:uid(6),externalAccountId:'invalid'}]},{accounts:Array.from({length:101},(_,i)=>({accountId:uid(i+100),externalAccountId:uid(i+300)}))},{expiresAt:1000},{expiresAt:121001},{revision:NaN},{sessionId:'invalid'}])assert.deepEqual(await fixture({...scope,...change},read).open('v1.'+'x'.repeat(50)),{kind:'unavailable'});
  assert.equal(reads,0);
});

test('scope and ordered account mapping are captured before caller mutation',async()=>{
  const ctx={...scope,accounts:scope.accounts.map(row=>({...row}))};const port=fixture(ctx);
  ctx.accounts[0].externalAccountId=uid(99);ctx.sessionId=uid(99);ctx.revision=99;
  const token=await sealed(port);assert.equal((await fixture().open(token)).kind,'position');port.close();
});

test('cross account filters host scope invalid indices and oversized raw next fail before key import',async()=>{
  let reads=0;const port=fixture(scope,()=>{reads++;return key();});
  for(const [account,w,next] of [[uid(99),0,query()],[uid(6),2,query()],[uid(6),0,query(uid(9))],[uid(6),0,query(uid(7),'2026-09-01')],[uid(6),0,'https://evil.invalid'],[uid(6),0,query(uid(7),'2026-10-01','2026-10-31','x'.repeat(1000))]])assert.deepEqual(await port.seal(account,w,next),{kind:'unavailable'});
  assert.equal(reads,0);port.close();
});

test('expiry and clock rollback permanently invalidate a port',async()=>{
  let clock=1000;const port=fixture(scope,key,{now:()=>clock});const token=await sealed(port);
  clock=121000;assert.deepEqual(await port.open(token),{kind:'unavailable'});clock=1000;assert.deepEqual(await port.open(token),{kind:'unavailable'});
  clock=1000;const rollback=fixture(scope,key,{now:()=>clock});const prior=await sealed(rollback);clock=999;assert.deepEqual(await rollback.open(prior),{kind:'unavailable'});
});

test('close during key acquisition discards a late result and prevents subsequent work',async()=>{
  let release;const pending=new Promise(resolve=>{release=resolve;});const port=fixture(scope,()=>pending);
  const result=port.seal(uid(6),0,query());port.close();release(key());assert.deepEqual(await result,{kind:'unavailable'});assert.deepEqual(await port.open(await sealed()),{kind:'unavailable'});
});

test('one nonexportable AES key import serves seal and open without modifying caller bytes',async()=>{
  let reads=0,imports=0,copy;const secret=key();
  const crypto={getRandomValues:bytes=>webcrypto.getRandomValues(bytes),subtle:{
    importKey(...args){imports++;copy=args[1];assert.equal(args[3],false);assert.deepEqual(args[4],['encrypt','decrypt']);return webcrypto.subtle.importKey(...args);},
    encrypt:(...args)=>webcrypto.subtle.encrypt(...args),decrypt:(...args)=>webcrypto.subtle.decrypt(...args),
  }};
  const port=fixture(scope,()=>{reads++;return secret;},{crypto});const token=await sealed(port);assert.equal((await port.open(token)).kind,'position');assert.equal(reads,1);assert.equal(imports,1);assert.deepEqual(secret,key());assert.ok(copy.every(byte=>byte===0));port.close();
});

test('expiry during encryption rejects the returned token',async()=>{
  let clock=1000;
  const crypto={getRandomValues:bytes=>webcrypto.getRandomValues(bytes),subtle:{importKey:(...args)=>webcrypto.subtle.importKey(...args),async encrypt(...args){const result=await webcrypto.subtle.encrypt(...args);clock=121000;return result;},decrypt:(...args)=>webcrypto.subtle.decrypt(...args)}};
  assert.deepEqual(await fixture(scope,key,{now:()=>clock,crypto}).seal(uid(6),0,query()),{kind:'unavailable'});
});

test('malformed key or native crypto errors never expose raw errors or credentials',async()=>{
  for(const read of [()=>null,()=>new Uint8Array(31),()=>new Uint8Array(32),()=>{throw Error('private-key-value');}])assert.deepEqual(await fixture(scope,read).seal(uid(6),0,query()),{kind:'unavailable'});
  const crypto={subtle:{importKey(){throw Error('private-native-error');}},getRandomValues(){throw Error();}};
  assert.deepEqual(await fixture(scope,key,{crypto}).seal(uid(6),0,query()),{kind:'unavailable'});
});
