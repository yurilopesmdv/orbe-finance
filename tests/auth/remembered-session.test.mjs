import test from 'node:test';
import assert from 'node:assert/strict';
import { createRefreshVault, REMEMBER_MS } from '../../src/features/auth/refresh-vault.ts';
import { SessionModel } from '../../src/features/auth/session.ts';
import { AuthFailure, createAuthGateway } from '../../src/features/auth/gateway.ts';
const origin=`https://${'a'.repeat(20)}.supabase.co`,pub='sb_publishable_invented';
const access='invented-access-token',refresh='invented-refresh-token',rotated='invented-rotated-refresh';
const user={id:'00000000-0000-4000-8000-000000000001',is_anonymous:false};
const json=(body,status=200)=>new Response(status===204?null:JSON.stringify(body),{status,headers:{'Content-Type':'application/json'}});
const failure=code=>e=>e instanceof AuthFailure&&e.code===code;
const deferred=()=>{let resolve;const promise=new Promise(r=>{resolve=r;});return {resolve,promise};};
const flush=()=>new Promise(resolve=>setImmediate(resolve));
function fixture(overrides={}) {
  let time=1000,raw=null,expiry,refreshCalls=0,signins=0;const revoked=[],writes=[];
  const native={get:async()=>raw,set:async value=>{writes.push(value);raw=value;},remove:async()=>{raw=null;},...overrides.native};
  const vault=createRefreshVault(native,origin,()=>time);
  const gateway={origin,signIn:async()=>{signins++;return {accessToken:access,expiresAt:time+600000};},signInRemembered:async()=>{signins++;return {accessToken:access,expiresAt:time+600000,refreshToken:refresh};},refresh:async token=>{refreshCalls++;assert.ok([refresh,rotated].includes(token));return {accessToken:access+'-renewed',expiresAt:time+600000,refreshToken:rotated};},signOut:async value=>{revoked.push(value.accessToken);},requestRecovery:async()=>{},resetPassword:async()=>{},...overrides.gateway};
  const make=()=>new SessionModel(gateway,()=>time,callback=>{expiry=callback;return()=>{expiry=null;};},vault);
  return {model:make(),make,vault,native,gateway,revoked,writes,get raw(){return raw;},set raw(v){raw=v;},get refreshCalls(){return refreshCalls;},get signins(){return signins;},setTime:v=>{time=v;},expire:()=>expiry?.()};
}
test('remembered password login saves only refresh token origin and fixed deadline',async()=>{
  const f=fixture();assert.equal(await f.model.login('invented@example.invalid','never-save-this-password',true),true);
  const record=JSON.parse(f.raw);assert.deepEqual(record,{origin,refreshToken:refresh,rememberUntil:1000+REMEMBER_MS});
  assert.ok(!f.raw.includes('password')&&!f.raw.includes(access)&&!f.raw.includes('example.invalid'));
  assert.deepEqual(f.model.getSnapshot(),{state:'unlocked',error:null});assert.equal(f.model.hasRememberedAccess(),true);
});
test('app restart restores online and rotates token without password login',async()=>{
  const f=fixture();await f.model.login('','',true);const deadline=JSON.parse(f.raw).rememberUntil;
  f.model.setActive(false);const restarted=f.make();assert.equal(await restarted.resume(),true);
  assert.equal(f.signins,1);assert.equal(f.refreshCalls,1);assert.equal(JSON.parse(f.raw).refreshToken,rotated);assert.equal(JSON.parse(f.raw).rememberUntil,deadline);
  assert.ok(!JSON.stringify(restarted.getSnapshot()).includes(refresh));
});
test('background blocks reads but retains credential and returning active resumes without password',async()=>{
  const f=fixture();await f.model.login('','',true);f.model.setActive(false);
  assert.equal(f.model.getSnapshot().state,'locked');assert.throws(()=>f.model.assertUnlocked(),failure('invalid_credentials'));assert.equal(f.revoked.length,0);
  f.model.setActive(true);await flush();assert.equal(f.model.getSnapshot().state,'unlocked');assert.equal(f.signins,1);assert.equal(f.refreshCalls,1);
});
test('normal login without remembering clears earlier vault and keeps old lock behavior',async()=>{
  const f=fixture();await f.model.login('','',true);await f.model.login('','',false);assert.equal(f.raw,null);assert.equal(f.model.hasRememberedAccess(),false);
  f.model.setActive(false);assert.equal(f.model.getSnapshot().state,'locked');assert.ok(f.revoked.length>=1);
});
test('active access expiry renews remembered session but never extends local30day limit',async()=>{
  const f=fixture();await f.model.login('','',true);const until=JSON.parse(f.raw).rememberUntil;f.setTime(601000);f.expire();await flush();
  assert.equal(f.model.getSnapshot().state,'unlocked');assert.equal(f.refreshCalls,1);assert.equal(JSON.parse(f.raw).rememberUntil,until);
});
test('concurrent resume calls share one rotation',async()=>{
  const pending=deferred();let calls=0;
  const f=fixture({gateway:{refresh:async()=>{calls++;return pending.promise;}}});await f.model.login('','',true);f.model.setActive(false);
  // Activate triggers first restoration; explicit retry must share it.
  f.model.setActive(true);await flush();const a=f.model.resume(),b=f.model.resume();assert.equal(a,b);assert.equal(calls,1);
  pending.resolve({accessToken:access,expiresAt:601000,refreshToken:rotated});assert.equal(await a,true);
});
test('temporary network error leaves saved token intact but never unlocks offline',async()=>{
  const f=fixture({gateway:{refresh:async()=>{throw new AuthFailure('unavailable');}}});await f.model.login('','',true);f.model.setActive(false);const old=f.raw;
  f.model.setActive(true);await flush();assert.equal(f.model.getSnapshot().state,'locked');assert.equal(f.model.getSnapshot().error,'unavailable');assert.equal(f.raw,old);assert.equal(f.model.canResumeSavedAccess(),true);
});
test('denied refresh or expired30day window erases the credential',async()=>{
  const f=fixture({gateway:{refresh:async()=>{throw new AuthFailure('invalid_credentials');}}});await f.model.login('','',true);f.model.setActive(false);f.model.setActive(true);await flush();assert.equal(f.raw,null);assert.equal(f.model.hasRememberedAccess(),false);
  const other=fixture();await other.model.login('','',true);other.model.setActive(false);other.setTime(1000+REMEMBER_MS);other.model.setActive(true);await flush();assert.equal(other.raw,null);assert.equal(other.refreshCalls,0);
});
test('write failure keeps only current in-memory access and reports storage unavailable',async()=>{
  const f=fixture({native:{set:async()=>{throw Error('private-native-error');}}});assert.equal(await f.model.login('','',true),true);
  assert.equal(f.model.hasRememberedAccess(),false);assert.equal(f.raw,null);assert.deepEqual(f.model.getSnapshot(),{state:'unlocked',error:'secure_storage'});
});
test('logout erases vault and late refresh cannot resurrect it',async()=>{
  const pending=deferred();const f=fixture({gateway:{refresh:async()=>pending.promise}});await f.model.login('','',true);f.model.setActive(false);f.model.setActive(true);await flush();
  const restoring=f.model.resume();const logout=f.model.logout();await flush();assert.equal(f.raw,null);
  pending.resolve({accessToken:'late-access',expiresAt:601000,refreshToken:rotated});await restoring;await logout;assert.equal(f.model.getSnapshot().state,'locked');assert.equal(f.raw,null);assert.equal(await f.model.resume(),false);assert.ok(f.revoked.includes('late-access'));
});
test('logout serialized behind a pending Keychain write removes late saved data',async()=>{
  const pending=deferred();let raw=null,entered=false;
  const f=fixture({native:{get:async()=>raw,set:async value=>{entered=true;await pending.promise;raw=value;},remove:async()=>{raw=null;}}});const login=f.model.login('','',true);await flush();assert.equal(entered,true);const logout=f.model.logout();pending.resolve();assert.equal(await login,false);await logout;assert.equal(raw,null);assert.equal(f.model.getSnapshot().state,'locked');
});
test('sensitive reauthentication cannot be satisfied by automatic token refresh',async()=>{
  const f=fixture();await f.model.login('','',true);f.model.requirePassword();f.model.setActive(false);f.model.setActive(true);await flush();
  assert.equal(f.model.getSnapshot().state,'locked');assert.equal(await f.model.resume(),false);assert.equal(f.refreshCalls,0);assert.equal(f.model.canResumeSavedAccess(),false);
  assert.equal(await f.model.login('','',true),true);assert.equal(f.signins,2);
});
test('recovery and activation never retain remembered login',async()=>{
  const f=fixture();await f.model.login('','',true);assert.equal(await f.model.resetPassword('','123456','invented-password'),true);assert.equal(f.raw,null);assert.equal(f.model.hasRememberedAccess(),false);assert.equal(f.model.getSnapshot().state,'locked');
});
test('native read errors and malformed cross-project data cannot unlock or leak values',async()=>{
  const f=fixture({native:{get:async()=>{throw Error('private-native');}}});assert.equal(await f.model.resume(),false);assert.equal(f.model.getSnapshot().error,'secure_storage');
  const other=fixture();other.raw=JSON.stringify({origin:origin.replace('a','b'),refreshToken:refresh,rememberUntil:2000});assert.equal(await other.model.resume(),false);assert.equal(other.raw,null);assert.equal(other.refreshCalls,0);
});
test('vault refuses passwords extra fields oversize payload and invalid local clock',async()=>{
  let raw=null;const native={get:async()=>raw,set:async v=>{raw=v;},remove:async()=>{raw=null;}};
  const vault=createRefreshVault(native,origin,()=>1000);
  for(const value of [{origin,refreshToken:refresh,rememberUntil:2000,password:'never'},{origin,refreshToken:refresh,rememberUntil:1000},{origin,refreshToken:'bad\nkey',rememberUntil:2000}])await assert.rejects(vault.write(value),failure('invalid_credentials'));
  raw='x'.repeat(1025);await assert.rejects(vault.read(),failure('invalid_credentials'));
  await assert.rejects(createRefreshVault(native,origin,()=>NaN).write({origin,refreshToken:refresh,rememberUntil:2000}),failure('invalid_credentials'));
});
function gatewayFixture(steps){const calls=[];const gateway=createAuthGateway({origin,publishableKey:pub},async(url,init)=>{calls.push({url,init});const value=steps.shift();return value instanceof Response?value:json(value);},()=>1000);return {gateway,calls};}
const pair={access_token:access,refresh_token:rotated,expires_in:600,token_type:'bearer'};
test('refresh uses fixed body-only route and verifies identity owner and active session',async()=>{
  const {gateway,calls}=gatewayFixture([pair,user,true,true]);const result=await gateway.refresh(refresh);
  assert.deepEqual(result,{accessToken:access,expiresAt:601000,refreshToken:rotated});assert.equal(calls[0].url,origin+'/auth/v1/token?grant_type=refresh_token');assert.deepEqual(JSON.parse(calls[0].init.body),{refresh_token:refresh});
  assert.ok(calls.at(-1).url.endsWith('/orbe_has_session'));assert.ok(calls.every(c=>!c.url.includes(refresh)&&!c.url.includes(rotated)));
});
test('refresh denied by active session gate discards newly issued access token',async()=>{
  const {gateway,calls}=gatewayFixture([pair,user,true,false,json(null,204)]);await assert.rejects(gateway.refresh(refresh),failure('invalid_credentials'));assert.ok(calls.at(-1).url.endsWith('/logout?scope=local'));
});
test('missing rotated refresh token never becomes a saved session',async()=>{
  const {gateway,calls}=gatewayFixture([{...pair,refresh_token:null},user,true,json(null,204)]);await assert.rejects(gateway.signInRemembered('invented@example.invalid','invented-password'),failure('invalid_credentials'));assert.ok(calls.at(-1).url.includes('/logout'));
});

test('late failed logout cannot overwrite a newer successful password login',async()=>{
  const remote=deferred();const f=fixture({gateway:{signOut:async()=>remote.promise}});await f.model.login('','',true);const logout=f.model.logout();await flush();
  assert.equal(await f.model.login('','',true),true);remote.resolve();await logout;assert.equal(f.model.getSnapshot().state,'unlocked');assert.ok(f.raw);
});
test('failed native deletion is visible and cannot auto-restore within the process',async()=>{
  const f=fixture({native:{remove:async()=>{throw Error('private-native');}}});
  // Password login is still available without claiming that anything was saved.
  await f.model.login('','',true);await f.model.logout();assert.equal(f.model.getSnapshot().error,'secure_storage');f.model.setActive(false);f.model.setActive(true);await flush();assert.equal(await f.model.resume(),false);assert.equal(f.model.getSnapshot().state,'locked');
});
