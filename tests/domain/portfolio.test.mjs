import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { reconcilePortfolio, snapshotChange } from '../../src/domain/portfolio.ts';
const cases = JSON.parse(readFileSync(new URL('../fixtures/financial-cases.json', import.meta.url))).cases;
const fixture = id => cases.find(c => c.id === id);
const asset = (overrides = {}) => ({ id: 'account', amountCents: 100000, currency: 'BRL', asOf: '2026-10-19', kind: 'asset', relation: 'distinct', ...overrides });
test('M04 reserve included in balance is not added again',()=>{
 const f=fixture('M04');const result=reconcilePortfolio([asset({amountCents:f.accountTotalCents}),asset({id:'reserve',amountCents:f.includedReserveCents,relation:'included',includedIn:'account'})]);
 assert.equal(result.subtotalCents,f.expectedTotalCents);assert.deepEqual(result.countedIds,['account']);assert.equal(result.partial,false);
});
test('distinct available balance and investment sum after reconciliation',()=>assert.equal(reconcilePortfolio([asset({amountCents:80000}),asset({id:'investment',amountCents:20000})]).subtotalCents,100000));
test('M05 null is partial, preserving unknown instead of claiming complete zero',()=>{
 const result=reconcilePortfolio([asset({amountCents:null})]);assert.equal(result.partial,fixture('M05').expectedPartial);assert.deepEqual(result.unresolvedIds,['account']);assert.equal(result.countedIds.length,0);
});
test('M11 unknown overlap is outside reconciled subtotal',()=>{
 const f=fixture('M11');const result=reconcilePortfolio([asset({amountCents:f.accountCents}),asset({id:'ambiguous',amountCents:f.ambiguousInvestmentCents,relation:'unknown'})]);assert.equal(result.subtotalCents,f.expectedReconciledSubtotalCents);assert.equal(result.partial,true);
});
test('virtual allocations and credit limits never add assets',()=>{
 assert.equal(reconcilePortfolio([asset(),asset({id:'goal',kind:'allocation',amountCents:20000}),asset({id:'limit',kind:'credit_limit',amountCents:500000})]).subtotalCents,100000);
});
test('nested inclusion counts only the root',()=>{
 const result=reconcilePortfolio([asset(),asset({id:'investment',relation:'included',includedIn:'account',amountCents:20000}),asset({id:'reserve',relation:'included',includedIn:'investment',amountCents:10000})]);assert.equal(result.subtotalCents,100000);
});
test('orphan inclusion is partial and not a new asset',()=>{
 const result=reconcilePortfolio([asset({relation:'included',includedIn:'missing'})]);assert.equal(result.partial,true);assert.equal(result.subtotalCents,0);assert.equal(result.countedIds.length,0);
});
test('cycles cannot fabricate a reconciled subtotal',()=>assert.throws(()=>reconcilePortfolio([asset({relation:'included',includedIn:'other'}),asset({id:'other',relation:'included',includedIn:'account'})]),/cyclic/));
test('exact duplicates are idempotent; conflicting IDs fail',()=>{
 assert.equal(reconcilePortfolio([asset(),asset()]).subtotalCents,100000);assert.throws(()=>reconcilePortfolio([asset(),asset({amountCents:1})]),/conflicting/);
});
test('foreign currencies are separate, never converted implicitly',()=>{
 const r=reconcilePortfolio([asset(),asset({id:'usd',currency:'USD'})]);assert.equal(r.subtotalCents,100000);assert.deepEqual(r.otherCurrencies,['USD']);
});
test('inclusion across currencies or into a credit limit fails',()=>{
 assert.throws(()=>reconcilePortfolio([asset(),asset({id:'child',currency:'USD',relation:'included',includedIn:'account'})]),/invalid_inclusion_parent/);
 assert.throws(()=>reconcilePortfolio([asset({kind:'credit_limit'}),asset({id:'child',relation:'included',includedIn:'account'})]),/invalid_inclusion_parent/);
});
test('included value cannot exceed known parent',()=>assert.throws(()=>reconcilePortfolio([asset(),asset({id:'child',relation:'included',includedIn:'account',amountCents:200000})]),/exceeds/));
test('mixed dates and unknown source dates are visible',()=>{
 assert.equal(reconcilePortfolio([asset(),asset({id:'old',asOf:'2026-10-18'})]).mixedDates,true);assert.equal(reconcilePortfolio([asset({asOf:null})]).partial,true);
});
test('negative balance is preserved as unresolved, not a negative asset total',()=>{
 const r=reconcilePortfolio([asset({amountCents:-100})]);assert.equal(r.partial,true);assert.equal(r.countedIds.length,0);
});
test('portfolio total overflow is rejected',()=>assert.throws(()=>reconcilePortfolio([asset({amountCents:Number.MAX_SAFE_INTEGER}),asset({id:'extra',amountCents:1})]),/overflow/));
test('redemption does not imply investment loss',()=>{
 const r=snapshotChange({amountCents:100000,currency:'BRL',asOf:'2026-10-18'},{amountCents:90000,currency:'BRL',asOf:'2026-10-19'},-10000);assert.equal(r.balanceChangeCents,-10000);assert.equal(r.unexplainedChangeCents,0);assert.equal('returnRate' in r,false);
});
test('unknown flows never become zero performance',()=>{
 const r=snapshotChange({amountCents:100000,currency:'BRL',asOf:'2026-10-18'},{amountCents:90000,currency:'BRL',asOf:'2026-10-19'});assert.equal(r.netFlowsCents,null);assert.equal(r.unexplainedChangeCents,null);
});
test('snapshot comparisons reject currency changes and reversed dates',()=>{
 const a={amountCents:100,currency:'BRL',asOf:'2026-10-19'};assert.throws(()=>snapshotChange(a,{...a,currency:'USD',asOf:'2026-10-20'}),/currency/);assert.throws(()=>snapshotChange(a,{...a,asOf:'2026-10-18'}),/order/);
});

test('malformed identifiers and impossible source dates are rejected',()=>{
 assert.throws(()=>reconcilePortfolio([asset({id:42})]),/invalid_component/);assert.throws(()=>reconcilePortfolio([asset({asOf:'2026-02-30'})]),/invalid_date/);
});
