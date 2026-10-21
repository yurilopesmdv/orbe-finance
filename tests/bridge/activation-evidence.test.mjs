import test from 'node:test';import assert from 'node:assert/strict';
import {verifyActivationEvidence} from '../../supabase/functions/_shared/activation-evidence.ts';
const id='00000000-0000-4000-8000-000000000001',now=Date.UTC(2026,9,21),policy={enabled:true,mode:'fixture'};
const item=()=>({id,connector:{name:'MeuPluggy',isSandbox:false},status:'UPDATED',executionStatus:'SUCCESS',error:null,consentExpiresAt:'2099-01-01T00:00:00Z',products:['ACCOUNTS','TRANSACTIONS','INVESTMENTS'],lastUpdatedAt:null});
const consent=()=>({itemId:'00000000-0000-4000-8000-000000000010',createdAt:'2026-01-01T00:00:00Z',expiresAt:null,revokedAt:null,products:['ACCOUNTS','TRANSACTIONS','INVESTMENTS'],openFinancePermissionsGranted:['ACCOUNTS_ALL','INVESTMENTS_ALL']});
const original=()=>({...item(),id:'00000000-0000-4000-8000-000000000010',connector:{id:606,isOpenFinance:true,isSandbox:false}});
const source=rows=>({page:1,total:rows.length,totalPages:rows.length?1:0,results:rows});
test('activation evidence intersects consent products permissions and item with explicit indefinite expiry',()=>{const result=verifyActivationEvidence(item(),source([consent()]),id,now,policy,original());assert.equal(result.kind,'evidence');assert.deepEqual(result.evidence.capabilities,{accounts:true,transactions:true,investments:true,reserves:false});assert.equal(result.evidence.bankConsentIndefinite,true);assert.equal(result.evidence.bankConsentExpiresAt,null);assert.equal(result.evidence.observedAt,new Date(now).toISOString());});
test('consent belonging to a different original item remains blocked even when proxy and original IDs are distinct in provider response cannot produce activation evidence',()=>{assert.equal(verifyActivationEvidence(item(),source([{...consent(),itemId:'00000000-0000-4000-8000-000000000099'}]),id,now,policy,original()).kind,'unavailable');});
test('ambiguous revoked expired future absent expiry or absent permissions all fail closed',()=>{
 const noExpiry=consent();delete noExpiry.expiresAt;
 for(const rows of [[],[consent(),consent()],[{...consent(),revokedAt:'2026-02-01T00:00:00Z'}],[{...consent(),expiresAt:'2026-02-01T00:00:00Z'}],[{...consent(),createdAt:'2098-01-01T00:00:00Z'}],[noExpiry],[{...consent(),openFinancePermissionsGranted:[]}]])assert.equal(verifyActivationEvidence(item(),source(rows),id,now,policy,original()).kind,'unavailable');
});
test('requested products alone are not availability, partial permissions only authorize their scope',()=>{
 const result=verifyActivationEvidence(item(),source([{...consent(),openFinancePermissionsGranted:['ACCOUNTS_LIST','ACCOUNTS_BALANCES']}]),id,now,policy,original());assert.equal(result.kind,'evidence');assert.deepEqual(result.evidence.capabilities,{accounts:true,transactions:false,investments:false,reserves:false});
 assert.equal(verifyActivationEvidence({...item(),products:[]},source([consent()]),id,now,policy,original()).kind,'unavailable');
});
test('untrusted provider fields never appear in evidence and are not inspected',()=>{const raw=item();Object.defineProperty(raw,'parameters',{get(){throw Error('PRIVATE')}});const c=consent();Object.defineProperty(c,'owner',{get(){throw Error('PRIVATE')}});const result=verifyActivationEvidence(raw,source([c]),id,now,policy,original());assert.equal(result.kind,'evidence');assert.ok(!JSON.stringify(result).includes('parameters'));});
test('disabled gate never inspects provider input',()=>{const poison=new Proxy({},{get(){throw Error();}});assert.deepEqual(verifyActivationEvidence(poison,poison,poison,poison),{kind:'disabled'});});

test('activation refuses timestamps that roll civil day or use hour24',()=>{for(const createdAt of ['2026-02-30T12:00:00Z','2026-01-01T24:00:00Z'])assert.equal(verifyActivationEvidence(item(),source([{...consent(),createdAt}]),id,now,policy,original()).kind,'unavailable');});
