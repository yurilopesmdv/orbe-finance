import test from 'node:test';
import assert from 'node:assert/strict';
import { planTransactionMonth } from '../../supabase/functions/_shared/transaction-month.ts';
import { createPluggyTargets } from '../../supabase/functions/_shared/pluggy-targets.ts';
const policy={enabled:true,mode:'fixture'};
const plan=month=>{const result=planTransactionMonth(month,policy);assert.equal(result.kind,'plan');return result;};

test('disabled paths do not inspect month or construct a timezone formatter',()=>{
  const prior=Intl.DateTimeFormat;
  try {
    Intl.DateTimeFormat=function(){throw Error('should not construct');};
    const poison=new Proxy({}, {get(){throw Error('should not inspect');}});
    for(const p of [{},{enabled:true},{enabled:true,mode:'live'},{enabled:false,mode:'fixture'}])assert.deepEqual(planTransactionMonth(poison,p),{kind:'disabled'});
  }finally{Intl.DateTimeFormat=prior;}
});

test('31 day month includes the following UTC day without exceeding request bounds',()=>{
  const result=plan('2026-10');
  assert.deepEqual(result.windows,[{dateFrom:'2026-10-01',dateTo:'2026-10-31'},{dateFrom:'2026-11-01',dateTo:'2026-11-01'}]);
  assert.equal(result.timeZone,'America/Sao_Paulo');assert.ok(Object.isFrozen(result));assert.ok(Object.isFrozen(result.windows));assert.ok(result.windows.every(Object.isFrozen));
});

test('February leap day and year rollover have bounded complete query envelopes',()=>{
  assert.deepEqual(plan('2024-02').windows,[{dateFrom:'2024-02-01',dateTo:'2024-03-01'}]);
  assert.deepEqual(plan('2026-02').windows,[{dateFrom:'2026-02-01',dateTo:'2026-03-01'}]);
  assert.deepEqual(plan('2026-12').windows,[{dateFrom:'2026-12-01',dateTo:'2026-12-31'},{dateFrom:'2027-01-01',dateTo:'2027-01-01'}]);
});

test('UTC timestamps on both sides of a Brasília month are classified correctly',()=>{
  const p=plan('2026-10');
  assert.equal(p.classifyInstant('2026-10-01T02:59:59.999Z').kind,'outside');
  assert.equal(p.classifyInstant('2026-10-01T03:00:00Z').kind,'inside');
  assert.equal(p.classifyInstant('2026-11-01T02:59:59.999Z').kind,'inside');
  assert.equal(p.classifyInstant('2026-11-01T03:00:00Z').kind,'outside');
  assert.equal(p.classifyInstant('2026-10-01T03:00:00.1Z').occurredAt,'2026-10-01T03:00:00.100Z');
});

test('historical DST is read from the IANA zone rather than a fixed UTC minus three',()=>{
  const p=plan('2018-11');
  assert.equal(p.classifyInstant('2018-12-01T01:59:59.999Z').kind,'inside');
  assert.equal(p.classifyInstant('2018-12-01T02:00:00Z').kind,'outside');
});

test('invalid month dates and non-UTC data are distinct from legitimate outside-month rows',()=>{
  for(const month of [null,{},'1999-12','2100-01','2026-00','2026-13','2026-1','2026-10\n'])assert.deepEqual(planTransactionMonth(month,policy),{kind:'unavailable'});
  const p=plan('2026-10');
  for(const value of [null,{},'2026-10-01','2026-02-30T12:00:00Z','2026-10-01T24:00:00Z','2026-10-01T03:00:00+00:00','2026-10-01T03:00:00Z\n'])assert.deepEqual(p.classifyInstant(value),{kind:'unavailable'});
  assert.equal(p.classifyInstant('2026-09-01T12:00:00Z').kind,'outside');
});

test('all 1200 supported months cover the UTC envelope without gaps or overlaps and pass the URL builder',()=>{
  const account='22222222-2222-4222-8222-222222222222';
  const targets=createPluggyTargets({itemId:'11111111-1111-4111-8111-111111111111',accountIds:[account]});
  for(let year=2000;year<=2099;year++)for(let month=1;month<=12;month++){
    const scope=year+'-'+String(month).padStart(2,'0'),p=plan(scope);
    let cursor=Date.UTC(year,month-1,1);
    for(const window of p.windows){
      assert.equal(Date.parse(window.dateFrom),cursor);
      const end=Date.parse(window.dateTo);assert.ok(end>=cursor&&end-cursor<=30*86400000);
      assert.ok(targets.firstTransactions(account,window).startsWith('https://api.pluggy.ai/v2/transactions?accountId='+account));
      cursor=end+86400000;
    }
    assert.equal(cursor,Date.UTC(year,month,2));
  }
});

test('missing native timezone support fails closed without a misleading plan',()=>{
  const prior=Intl.DateTimeFormat;
  try{Intl.DateTimeFormat=function(){throw Error('unavailable');};assert.deepEqual(planTransactionMonth('2026-10',policy),{kind:'unavailable'});}finally{Intl.DateTimeFormat=prior;}
});
