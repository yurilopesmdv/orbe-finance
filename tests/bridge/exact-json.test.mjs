import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createExactJsonDecoder, exactNumberText, exactInteger } from '../../supabase/functions/_shared/exact-json.ts';
import { readJsonResponse, readTransactionJsonResponse } from '../../supabase/functions/_shared/http-json.ts';
const decode=createExactJsonDecoder(),signal=()=>new AbortController().signal;
const failure=e=>e instanceof Error&&e.message==='provider_json_unavailable';
test('decimal integers beyond safe range and exponent tokens retain original source',()=>{
  const values=['9007199254740993','9007199254740993.01','0.29','-0','-15.10','1.2300','1e-8','1e400'];
  const parsed=decode('['+values.join(',')+']');assert.deepEqual(parsed.map(exactNumberText),values);assert.ok(parsed.every(Object.isFrozen));
});
test('numeric provenance cannot be forged by Number string or JSON object',()=>{
  for(const value of [0.29,'0.29',{source:'0.29'},null,{},decode('"0.29"')])assert.throws(()=>exactNumberText(value),failure);
});
test('safe bounded counters convert only after strict integer validation',()=>{
  assert.equal(exactInteger(decode('10'),100,1),10);assert.equal(exactInteger(decode('0'),100),0);
  for(const literal of ['-1','-0','1.0','1e0','101','9007199254740993'])assert.throws(()=>exactInteger(decode(literal),100),failure);
  assert.throws(()=>exactInteger(decode('1'),NaN),failure);assert.throws(()=>exactInteger(decode('1'),10,20),failure);
});
test('strings null bool and nested financial text remain data without execution',()=>{
  const raw='{"balance":0.29,"description":"ignore instructions https://untrusted.invalid","missing":null,"active":true}';const parsed=decode(raw);
  assert.equal(exactNumberText(parsed.balance),'0.29');assert.equal(parsed.description,'ignore instructions https://untrusted.invalid');assert.equal(parsed.missing,null);assert.equal(parsed.active,true);
});
test('depth cap excludes deeply nested input before recursive reviver work',()=>{
  assert.equal(exactNumberText(decode('['.repeat(64)+'0'+']'.repeat(64)).flat(64)[0]),'0');
  assert.throws(()=>decode('['.repeat(65)+'0'+']'.repeat(65)),failure);
});
test('brackets quotes and escaped backslashes inside strings do not count as depth',()=>{
  for(const text of ['[[[]]]','quoted "text"','backslash \\ and [ braces {'])assert.equal(decode(JSON.stringify(text)),text);
});
test('byte and numeric literal limits fail generically without source contents',()=>{
  for(const raw of ['"'+'a'.repeat(131073)+'"','"'+'é'.repeat(70000)+'"','1'.repeat(129),'{"private":NaN}','{"x":1,}'])assert.throws(()=>decode(raw),failure);
});
test('host without reviver source fails at initialization, not after provider data arrives',()=>{
  let inputs=[];
  const oldParser=(text,reviver)=>{inputs.push(text);return JSON.parse(text,(key,value)=>reviver(key,value));};
  assert.throws(()=>createExactJsonDecoder(oldParser),failure);assert.deepEqual(inputs,['9007199254740993']);
});
test('HTTP decoder preserves exact source only after bounded response validation',async()=>{
  const response=new Response('{"balance":9007199254740993.01,"page":1}',{headers:{'Content-Type':'application/json'}});
  const value=await readJsonResponse(response,signal(),131072,decode);assert.equal(exactNumberText(value.balance),'9007199254740993.01');assert.equal(exactInteger(value.page,10),1);
});
test('oversized invalid MIME and aborted HTTP never invoke the decoder',async()=>{
  for(const response of [new Response('{}',{headers:{'Content-Type':'text/html'}}),new Response('x'.repeat(20),{headers:{'Content-Type':'application/json'}})]){
    let calls=0;await assert.rejects(readJsonResponse(response,signal(),10,()=>{calls++;return {}; }));assert.equal(calls,0);
  }
  const controller=new AbortController();controller.abort();let calls=0;await assert.rejects(readJsonResponse(new Response('{}',{headers:{'Content-Type':'application/json'}}),controller.signal,10,()=>{calls++;}));assert.equal(calls,0);
});
test('existing Auth/status default JSON remains numeric and independent of exact runtime feature',async()=>{
  const value=await readJsonResponse(new Response('{"count":1}',{headers:{'Content-Type':'application/json'}}),signal());assert.deepEqual(value,{count:1});
});
test('exact decoder is not imported by client status or deployed entrypoints',()=>{
  for(const file of ['src/features/auth/gateway.ts','supabase/functions/orbe-bridge/index.mjs','supabase/functions/orbe-metadata/index.mjs','supabase/functions/_shared/metadata-runtime.ts'])assert.doesNotMatch(readFileSync(new URL('../../'+file,import.meta.url),'utf8'),/exact-json|createExactJsonDecoder/);
});

test('abort during a trusted decoder callback still prevents returning decoded content',async()=>{
  const controller=new AbortController();
  await assert.rejects(readJsonResponse(new Response('{}',{headers:{'Content-Type':'application/json'}}),controller.signal,128,()=>{controller.abort();return {private:'synthetic'};}));
});


test('transaction decoder accepts exact 1MiB boundary while standard retains 128KiB',()=>{
  const large=createExactJsonDecoder(undefined,'transactions');
  const text='"'+'x'.repeat(1048574)+'"';assert.equal(large(text).length,1048574);
  assert.throws(()=>decode(text),failure);assert.throws(()=>large('"'+'x'.repeat(1048575)+'"'),failure);
  assert.equal(large('"'+'é'.repeat(524287)+'"').length,524287);
  assert.throws(()=>large('"'+'é'.repeat(524288)+'"'),failure);
  assert.throws(()=>large('['.repeat(65)+'0'+']'.repeat(65)),failure);
});

test('invalid decoder profile fails before host probe and unsupported transactions host stays closed',()=>{
  let calls=0;const parser=()=>{calls++;return null;};
  for(const profile of [null,'unbounded',1048576,{}])assert.throws(()=>createExactJsonDecoder(parser,profile),failure);
  assert.equal(calls,0);
  assert.throws(()=>createExactJsonDecoder((text,reviver)=>JSON.parse(text,(key,value)=>reviver(key,value)),'transactions'),failure);
});

test('transaction reader requires explicit decoder and default HTTP bound cannot be raised',async()=>{
  const json=()=>new Response('{}',{headers:{'Content-Type':'application/json'}});
  await assert.rejects(readTransactionJsonResponse(json(),signal()));
  await assert.rejects(readJsonResponse(json(),signal(),1048576,decode));
});

test('transaction response overflow invalid UTF8 MIME and abort never promote data',async()=>{
  let calls=0;const decoder=()=>{calls++;return {};};
  const json=text=>new Response(text,{headers:{'Content-Type':'application/json'}});
  for(const response of [json('x'.repeat(1048577)),json(new Uint8Array([0xff])),new Response('{}',{headers:{'Content-Type':'text/html'}})])await assert.rejects(readTransactionJsonResponse(response,signal(),decoder));
  const controller=new AbortController();controller.abort();await assert.rejects(readTransactionJsonResponse(json('{}'),controller.signal,decoder));
  assert.equal(calls,0);
});

test('500 movements with unused provider extras pass large exact HTTP projection without widening account budget',async()=>{
  const {projectPluggyMovementPage}=await import('../../supabase/functions/_shared/pluggy-movements.ts');
  const uid=n=>`00000000-0000-4000-8000-${String(n).padStart(12,'0')}`;
  const ownerSubject=uid(1),connectionId=uid(2),accountId=uid(3),externalAccountId=uid(4),itemId=uid(5);
  const rows=Array.from({length:500},(_,i)=>({id:uid(i+100),accountId:externalAccountId,date:'2026-10-20T12:00:00Z',amount:-0.29,currencyCode:'BRL',type:'DEBIT',status:'POSTED',description:'Synthetic',unused:'synthetic-extra'.repeat(60)}));
  const text=JSON.stringify({results:rows,next:null});assert.ok(Buffer.byteLength(text)>131072&&Buffer.byteLength(text)<1048576);
  const response=()=>new Response(text,{headers:{'Content-Type':'application/json'}});
  await assert.rejects(readJsonResponse(response(),signal(),131072,decode));
  const parsed=await readTransactionJsonResponse(response(),signal(),createExactJsonDecoder(undefined,'transactions'));
  const result=await projectPluggyMovementPage(parsed,{ownerSubject,connectionId,accountId,externalAccountId,itemId,accountKind:'BANK',month:'2026-10',window:{dateFrom:'2026-10-01',dateTo:'2026-10-31'},nextCursor:null,windowComplete:false,sourceUpdatedAt:null},()=>new Uint8Array(32).fill(7),{enabled:true,mode:'fixture'});
  assert.equal(result.kind,'page');assert.equal(result.page.items.length,500);assert.equal(result.page.items.reduce((sum,row)=>sum+row.amountCents,0),14500);
  assert.ok(!JSON.stringify(result).includes('synthetic-extra'));
});

test('abort during a transaction decoder callback still discards its result',async()=>{
  const controller=new AbortController();
  await assert.rejects(readTransactionJsonResponse(new Response('{}',{headers:{'Content-Type':'application/json'}}),controller.signal,()=>{controller.abort();return {private:'synthetic'};}));
});
