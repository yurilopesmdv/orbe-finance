import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readBoundedJson } from '../../src/lib/bounded-json.ts';
const json={'Content-Type':'application/json; charset=utf-8'};
const signal=()=>new AbortController().signal;
const fails=promise=>assert.rejects(promise,/^Error: invalid_json_response$/);
const response=(body,headers={})=>new Response(body,{headers:{...json,...headers}});

test('strict bounded reader accepts valid JSON and byte-sized UTF8 at boundary',async()=>{
 assert.deepEqual(await readBoundedJson(response('{"ok":true}'),signal()),{ok:true});
 const text='"é"',bytes=new TextEncoder().encode(text);assert.equal(bytes.length,4);assert.equal(await readBoundedJson(response(bytes),signal(),4),'é');await fails(readBoundedJson(response(bytes),signal(),3));
});
test('actual chunked bytes limited independently from missing or misleading Content-Length',async()=>{
 for(const header of [undefined,'1']){let cancelled=false;const chunks=[new TextEncoder().encode('{"value":"'),new Uint8Array(32).fill(65)];const stream=new ReadableStream({pull(controller){const value=chunks.shift();if(value)controller.enqueue(value);else controller.close();},cancel(){cancelled=true;}},{highWaterMark:0});await fails(readBoundedJson(response(stream,header===undefined?{}:{'Content-Length':header}),signal(),16));assert.equal(cancelled,true);}
});
test('declared oversize invalid or negative length cancels before reading body',async()=>{
 for(const length of ['131073','-1','not-a-number','9007199254740993']){let pulls=0,cancelled=false;const stream=new ReadableStream({pull(){pulls++;},cancel(){cancelled=true;}},{highWaterMark:0});await fails(readBoundedJson(response(stream,{'Content-Length':length}),signal()));assert.equal(pulls,0);assert.equal(cancelled,true);}
});
test('wrong MIME empty body and unsupported streaming never call json or text fallback',async()=>{
 await fails(readBoundedJson(response('{}',{'Content-Type':'text/plain'}),signal()));await fails(readBoundedJson(new Response(null,{headers:json}),signal()));
 let calls=0;const unsupported={headers:new Headers(json),body:null,json(){calls++;throw new Error('raw');},text(){calls++;throw new Error('raw');}};await fails(readBoundedJson(unsupported,signal()));assert.equal(calls,0);
});
test('invalid UTF8 JSON or stream chunks produce the same sanitized error',async()=>{
 await fails(readBoundedJson(response(Uint8Array.from([0x22,0xc3,0x28,0x22])),signal()));await fails(readBoundedJson(response('PRIVATE_SYNTHETIC_INVALID_JSON'),signal()));
 const stream=new ReadableStream({start(controller){controller.enqueue('wrong-type');controller.close();}});await fails(readBoundedJson(response(stream),signal()));
});
test('abort while reader is pending cancels and exits without waiting for ignored cancellation',async()=>{
 const controller=new AbortController();let cancelled=0,started;const reading=new Promise(resolve=>{started=resolve;});
 const fake={headers:new Headers(json),body:{getReader(){return{read(){started();return new Promise(()=>{});},cancel(){cancelled++;return new Promise(()=>{});},releaseLock(){throw new Error('PRIVATE_SYNTHETIC');}};}}};
 const result=readBoundedJson(fake,controller.signal);await reading;controller.abort();await fails(result);assert.ok(cancelled>0);
});
test('pre-aborted operation and invalid caps fail without reading a stream',async()=>{
 let cancelled=false;const stream=new ReadableStream({cancel(){cancelled=true;}},{highWaterMark:0});const controller=new AbortController();controller.abort();await fails(readBoundedJson(response(stream),controller.signal));assert.equal(cancelled,true);for(const cap of [0,131073,1.2,NaN])await fails(readBoundedJson(response('{}'),signal(),cap));
});
test('reader failure never exposes raw error and releases its lock',async()=>{
 let released=false,cancelled=false;const fake={headers:new Headers(json),body:{getReader(){return{async read(){throw new Error('PRIVATE_SYNTHETIC_TOKEN');},async cancel(){cancelled=true;},releaseLock(){released=true;}};}}};await fails(readBoundedJson(fake,signal()));assert.equal(released,true);assert.equal(cancelled,true);
});
