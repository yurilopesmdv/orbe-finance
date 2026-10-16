import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { parseMoney, sumCents, occurrenceMonth } from '../../src/domain/money.ts';
import { calculateExpenses } from '../../src/domain/expenses.ts';
const cases = JSON.parse(readFileSync(new URL('../fixtures/financial-cases.json', import.meta.url))).cases;
const fixture = id => cases.find(c => c.id === id);
const movement = (overrides = {}) => ({ source: 'synthetic', accountId: 'account', externalId: 'purchase', amountCents: 10000, currency: 'BRL', direction: 'debit', type: 'expense', status: 'posted', occurredAt: '2026-10-01', ...overrides });
const ref = value => ({ source: value.source, accountId: value.accountId, externalId: value.externalId });
test('T04 M01 decimal sum is exact', () => {
 const f=fixture('M01');assert.equal(sumCents(f.amounts.map(parseMoney)),f.expectedCents);
});
test('null and zero remain distinct; negative balances are supported', () => {
 assert.equal(parseMoney(null),null);assert.equal(parseMoney('0'),0);assert.equal(parseMoney('-1.05'),-105);
});
test('T04 M10 rejects precision, exponent, separators and overflow', () => {
 for(const value of fixture('M10').inputs)assert.throws(()=>parseMoney(value));
 assert.throws(()=>sumCents([Number.MAX_SAFE_INTEGER,1]),/overflow/);
 assert.throws(()=>sumCents([0.1]),/invalid_cents/);
});
test('maximum safe cents do not round during parsing',()=>assert.equal(parseMoney('90071992547409.91'),Number.MAX_SAFE_INTEGER));
test('T04 M06 civil date preserves month',()=>assert.equal(occurrenceMonth(fixture('M06').value),fixture('M06').expectedMonth));
test('T04 M07 UTC boundary uses Brasília',()=>assert.equal(occurrenceMonth(fixture('M07').value),fixture('M07').expectedMonth));
test('impossible dates and timestamps without timezone fail',()=>{
 for(const value of ['2026-02-30','2026-13-01','2026-10-01T01:00:00','2026-02-30T12:00:00Z'])assert.throws(()=>occurrenceMonth(value),/invalid_date/);
});
test('T04 M02 expense less linked refund equals 8000 cents',()=>{
 const purchase=movement(),refund=movement({externalId:'refund',type:'refund',direction:'credit',amountCents:2000,reversalOf:ref(purchase)});
 assert.equal(calculateExpenses([purchase,refund],'2026-10').netCents,fixture('M02').expectedCents);
});
test('T04 M08 refund affects its own month',()=>{
 const purchase=movement({occurredAt:'2026-09-01'}),refund=movement({externalId:'refund',type:'refund',direction:'credit',amountCents:2000,reversalOf:ref(purchase)});
 const result=calculateExpenses([purchase,refund],'2026-10');assert.equal(result.netCents,fixture('M08').expectedCents);assert.equal(result.partial,false);
});
test('unverified refund is partial and never silently reduces spend',()=>{
 const result=calculateExpenses([movement({type:'refund',direction:'credit'})],'2026-10');assert.equal(result.partial,true);assert.equal(result.refundCents,0);
});
test('T04 M03 transfer is excluded; third party expense is counted',()=>{
 assert.equal(calculateExpenses([movement({type:'own_transfer',amountCents:50000})],'2026-10').netCents,fixture('M03').expectedExpenseCents);
 assert.equal(calculateExpenses([movement()],'2026-10').netCents,10000);
});
test('T04 M09 purchase and settlement do not double count',()=>{
 const f=fixture('M09');assert.equal(calculateExpenses([movement({amountCents:f.postedPurchaseCents}),movement({externalId:'bill',type:'card_settlement',amountCents:f.billSettlementCents})],'2026-10').netCents,f.expectedExpenseCents);
});
test('T04 M12 pending and cancelled do not count',()=>{
 assert.equal(calculateExpenses([movement({status:'pending'}),movement({externalId:'cancelled',status:'cancelled'})],'2026-10').netCents,fixture('M12').expectedExpenseCents);
});
test('T04 M13 repeat is idempotent and ordering does not choose conflicts',()=>{
 const a=movement();assert.equal(calculateExpenses([a,{...a}],'2026-10').netCents,10000);
 assert.throws(()=>calculateExpenses([a,{...a,amountCents:20000}],'2026-10'),/conflicting/);
});
test('T04 M14 currencies stay separated',()=>{
 assert.equal(calculateExpenses([movement(),movement({externalId:'usd',currency:'USD',amountCents:5000})],'2026-10').netCents,fixture('M14').expectedBrlCents);
});
test('missing amount or unknown type makes total explicitly partial',()=>{
 assert.equal(calculateExpenses([movement({amountCents:null})],'2026-10').partial,true);
 assert.equal(calculateExpenses([movement({type:'unknown'})],'2026-10').partial,true);
});
test('same external ID in different accounts is not deduplicated',()=>{
 assert.equal(calculateExpenses([movement(),movement({accountId:'other'})],'2026-10').netCents,20000);
});
test('negative movement magnitude and invalid report period fail',()=>{
 assert.throws(()=>calculateExpenses([movement({amountCents:-1})],'2026-10'),/magnitude/);
 assert.throws(()=>calculateExpenses([],'2026-99'),/invalid_month/);
});
