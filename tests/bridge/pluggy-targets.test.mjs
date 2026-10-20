import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createPluggyTargets } from '../../supabase/functions/_shared/pluggy-targets.ts';
const itemId='00000000-0000-4000-8000-000000000001';
const accountId='00000000-0000-4000-8000-000000000002',other='00000000-0000-4000-8000-000000000003';
const period={dateFrom:'2026-10-01',dateTo:'2026-10-31'};
const binding=()=>({itemId,accountIds:[accountId]});
const query=(suffix='opaque%2Bcursor%3D%3D')=>'?accountId='+accountId+'&dateFrom='+period.dateFrom+'&dateTo='+period.dateTo+'&after='+suffix;
const fails=fn=>assert.throws(fn,{message:'pluggy_target_invalid'});
test('only fixed official read destinations are constructed',()=>{
  const targets=createPluggyTargets(binding());assert.equal(Object.isFrozen(targets),true);
  assert.equal(targets.item(),'https://api.pluggy.ai/items/'+itemId);
  assert.equal(targets.accounts(),'https://api.pluggy.ai/accounts?itemId='+itemId);
  assert.equal(targets.investments(2),'https://api.pluggy.ai/investments?itemId='+itemId+'&page=2&pageSize=100');
  assert.equal(targets.firstTransactions(accountId,period),'https://api.pluggy.ai/v2/transactions?accountId='+accountId+'&dateFrom=2026-10-01&dateTo=2026-10-31');
  assert.deepEqual(Object.keys(targets),['item','accounts','investments','firstTransactions','nextTransactions']);
});
test('binding is captured and later mutable account/item changes cannot expand scope',()=>{
  const raw=binding(),targets=createPluggyTargets(raw);raw.itemId=other;raw.accountIds.push(other);
  assert.ok(targets.accounts().endsWith(itemId));fails(()=>targets.firstTransactions(other,period));
});
test('syntactic UUID alone does not admit an account outside the captured binding',()=>{
  const targets=createPluggyTargets(binding());fails(()=>targets.firstTransactions(other,period));fails(()=>targets.nextTransactions(other,period,null));
});
test('raw URLs PII malformed IDs extra configuration and duplicate accounts are rejected',()=>{
  for(const raw of [null,{}, {...binding(),origin:'https://evil.invalid'}, {...binding(),itemId:'https://evil.invalid'}, {...binding(),itemId:'123.456.789-00'},{...binding(),accountIds:[accountId,accountId]},{...binding(),accountIds:['/../../identity']},{...binding(),accountIds:Array(1001).fill(accountId)}])fails(()=>createPluggyTargets(raw));
});
test('investment page bound refuses coercion NaN and unbounded work',()=>{
  const targets=createPluggyTargets(binding());for(const page of [0,-1,1001,1.5,NaN,Infinity,'2',null])fails(()=>targets.investments(page));
});
test('transaction windows are strict calendar dates, ordered and at most31 days',()=>{
  const targets=createPluggyTargets(binding());
  for(const raw of [{dateFrom:'2026-02-29',dateTo:'2026-03-01'},{dateFrom:'2026-10-31',dateTo:'2026-10-01'},{dateFrom:'2026-10-01',dateTo:'2026-11-01'},{...period,dateTo:'2026-10-32'},{...period,url:'https://evil.invalid'},{...period,dateFrom:'2026-10-01T00:00:00Z'}])fails(()=>targets.firstTransactions(accountId,raw));
  assert.ok(targets.firstTransactions(accountId,{dateFrom:'2024-02-29',dateTo:'2024-03-01'}));
});
test('opaque continuation is preserved byte-for-byte on a literal host and endpoint',()=>{
  const targets=createPluggyTargets(binding()),next=query();assert.equal(targets.nextTransactions(accountId,period,next),'https://api.pluggy.ai/v2/transactions'+next);
  assert.equal(targets.nextTransactions(accountId,period,null),null);
});
test('absolute URLs protocol-relative paths fragments and injection cannot choose destination',()=>{
  const targets=createPluggyTargets(binding());
  for(const next of ['https://evil.invalid'+query(),'//evil.invalid'+query(),'/v2/transactions'+query(),'../items'+query(),query()+'#private',query()+'\r\nHeader=x',query()+'\\evil',query()+'<script>',query()+'@evil',query()+'?extra=x'])fails(()=>targets.nextTransactions(accountId,period,next));
});
test('continuation cannot change account period filters or add a second parameter',()=>{
  const targets=createPluggyTargets(binding());
  for(const next of [query().replace(accountId,other),query().replace('2026-10-01','2026-09-01'),query()+'&accountId='+other,query()+'&%61ccountId='+other,query()+'&url=https%3A%2F%2Fevil.invalid',query().replace('&dateTo=2026-10-31',''),query().replace('dateFrom','from'),query()+'&page=2',query()+'&ids=private'])fails(()=>targets.nextTransactions(accountId,period,next));
});
test('malformed percent UTF8 empty cursor control chars and oversized queries fail closed',()=>{
  const targets=createPluggyTargets(binding());
  for(const next of [query('%ZZ'),query('%FF'),query('%0a'),query('%00'),query(''),query('+'),query('x'.repeat(2049)),{},undefined,query()+'&&'])fails(()=>targets.nextTransactions(accountId,period,next));
});
test('provider destinations remain absent from client and active deployed compositions',()=>{
  const root=new URL('../../',import.meta.url);
  for(const file of ['src/features/auth/gateway.ts','src/features/auth/provider.tsx','supabase/functions/orbe-bridge/index.mjs','supabase/functions/orbe-metadata/index.mjs','supabase/functions/_shared/metadata-runtime.ts'])assert.doesNotMatch(fs.readFileSync(new URL(file,root),'utf8'),/pluggy-targets|createPluggyTargets/);
});
