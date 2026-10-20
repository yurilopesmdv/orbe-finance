import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createExactJsonDecoder, exactNumberText, exactInteger } from '../../supabase/functions/_shared/exact-json.ts';
import { readJsonResponse } from '../../supabase/functions/_shared/http-json.ts';
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
