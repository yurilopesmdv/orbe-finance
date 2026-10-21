import test from 'node:test';
import assert from 'node:assert/strict';
import { webcrypto } from 'node:crypto';
import { createMovementIdentity } from '../../supabase/functions/_shared/movement-identity.ts';
const owner='11111111-1111-4111-8111-111111111111', account='22222222-2222-4222-8222-222222222222', external='33333333-3333-4333-8333-333333333333';
const other='44444444-4444-4444-8444-444444444444';
const bytes=()=>Uint8Array.from({length:32},(_,i)=>i+1);
const fixture=(read=bytes,scope={ownerSubject:owner,accountId:account},extra={})=>createMovementIdentity(read,scope,{enabled:true,mode:'fixture',...extra});
const deferred=()=>{let resolve;const promise=new Promise(done=>{resolve=done;});return {promise,resolve};};
const tick=()=>new Promise(resolve=>setImmediate(resolve));

test('disabled or unapproved modes never touch context key crypto or input',async()=>{
  const poison=new Proxy({}, {get(){throw Error('private');}});
  for(const policy of [{},{enabled:true},{enabled:true,mode:'live'},{enabled:true,mode:'live',fixtureOnly:true,privateDataApproved:true}]){
    const port=createMovementIdentity(()=>{throw Error('private');},poison,{...policy,get subtle(){throw Error('private');}});
    assert.deepEqual(await port.deriveMovement(poison),{kind:'disabled'});port.close();
  }
});

test('independent Python HMAC vector yields stable internal UUIDv8 across instances',async()=>{
  const expected={kind:'id',movementId:'deb39ce6-a9e2-817e-a1e8-134fa5328bc2'};
  for(let i=0;i<2;i++){
    const port=fixture();assert.deepEqual(await port.deriveMovement(external),expected);
    const result=await port.deriveMovement(external);assert.deepEqual(result,expected);
    assert.ok(Object.isFrozen(result));assert.match(result.movementId,/^[0-9a-f]{8}-[0-9a-f]{4}-8[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);port.close();
  }
});

test('owner account provider ID and independent key separate identities',async()=>{
  const cases=[fixture(),fixture(bytes,{ownerSubject:other,accountId:account}),fixture(bytes,{ownerSubject:owner,accountId:other}),fixture(()=>new Uint8Array(32).fill(9)),fixture()];
  const results=await Promise.all(cases.map((port,i)=>port.deriveMovement(i===4?other:external)));
  assert.ok(results.every(result=>result.kind==='id'));
  assert.equal(new Set(results.map(result=>result.movementId)).size,5);cases.forEach(port=>port.close());
});

test('trusted scope is captured and proxy renewal fields are not part of identity',async()=>{
  const scope={ownerSubject:owner,accountId:account,get connectionId(){throw Error('must not read');},get itemId(){throw Error('must not read');}};
  const port=fixture(bytes,scope);scope.ownerSubject=other;scope.accountId=other;
  assert.equal((await port.deriveMovement(external)).movementId,'deb39ce6-a9e2-817e-a1e8-134fa5328bc2');port.close();
});

test('invalid scope and provider IDs fail before reading any key',async()=>{
  let reads=0;const read=()=>{reads++;return bytes();};
  for(const scope of [null,{},[],Object.create({ownerSubject:owner,accountId:account}),{ownerSubject:'invalid',accountId:account},{ownerSubject:owner,accountId:'invalid'}]){
    assert.deepEqual(await fixture(read,scope).deriveMovement(external),{kind:'unavailable'});
  }
  const port=fixture(read);
  for(const id of [null,{},'AAAAAAAA-AAAA-4AAA-8AAA-AAAAAAAAAAAA',external+'\n','https://invalid.example',0])assert.deepEqual(await port.deriveMovement(id),{kind:'unavailable'});
  assert.equal(reads,0);port.close();
});

test('missing zero or malformed key and raw crypto errors stay generic',async()=>{
  for(const key of [null,'do-not-echo',new Uint8Array(31),new Uint8Array(33),new Uint8Array(32)]){
    assert.deepEqual(await fixture(()=>key).deriveMovement(external),{kind:'unavailable'});
  }
  const bad=fixture(()=>{throw Error('private-credential');});assert.deepEqual(await bad.deriveMovement(external),{kind:'unavailable'});
  const cryptoError=fixture(bytes,undefined,{subtle:{importKey(){throw Error('private-crypto');},sign(){throw Error();}}});
  assert.deepEqual(await cryptoError.deriveMovement(external),{kind:'unavailable'});
});

test('concurrent derivations import a nonextractable signing key only once without changing caller bytes',async()=>{
  let reads=0,imports=0,importedCopy;const secret=bytes(),original=bytes();
  const subtle={async importKey(...args){imports++;assert.equal(args[3],false);assert.deepEqual(args[4],['sign']);importedCopy=args[1];return webcrypto.subtle.importKey(...args);},sign:(...args)=>webcrypto.subtle.sign(...args)};
  const port=fixture(()=>{reads++;return secret;},undefined,{subtle});
  const [a,b]=await Promise.all([port.deriveMovement(external),port.deriveMovement(other)]);
  assert.equal(a.kind,'id');assert.equal(b.kind,'id');assert.equal(reads,1);assert.equal(imports,1);
  assert.deepEqual(secret,original);assert.ok(importedCopy.every(byte=>byte===0));port.close();
});

test('close during key acquisition rejects late identity and future calls',async()=>{
  const pending=deferred();let reads=0;
  const port=fixture(()=>{reads++;return pending.promise;});const result=port.deriveMovement(external);port.close();pending.resolve(bytes());
  assert.deepEqual(await result,{kind:'unavailable'});assert.deepEqual(await port.deriveMovement(external),{kind:'unavailable'});assert.equal(reads,1);
});

test('close during asynchronous signature discards completed identity',async()=>{
  const pending=deferred(),started=deferred();
  const subtle={importKey:(...args)=>webcrypto.subtle.importKey(...args),sign(){started.resolve();return pending.promise;}};
  const port=fixture(bytes,undefined,{subtle});const result=port.deriveMovement(external);await started.promise;port.close();pending.resolve(new Uint8Array(32).buffer);
  assert.deepEqual(await result,{kind:'unavailable'});
});

test('invalid crypto result or signing error never exposes raw content',async()=>{
  for(const sign of [async()=>new Uint8Array(16).buffer,async()=>{throw Error('private-provider-id');}]){
    const port=fixture(bytes,undefined,{subtle:{importKey:(...args)=>webcrypto.subtle.importKey(...args),sign}});
    assert.deepEqual(await port.deriveMovement(external),{kind:'unavailable'});port.close();
  }
});

test('public port and result expose neither external identity nor key or export method',async()=>{
  const port=fixture();assert.deepEqual(Object.keys(port),['deriveMovement','close']);
  const result=await port.deriveMovement(external);assert.deepEqual(Object.keys(result),['kind','movementId']);
  for(const raw of [external,owner,account,Buffer.from(bytes()).toString('hex')])assert.ok(!JSON.stringify(result).includes(raw));port.close();await tick();
});
