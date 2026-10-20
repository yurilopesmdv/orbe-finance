import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateOwnerSetup } from '../../src/features/auth/owner-setup.ts';
import { createRegistrationPort } from '../../src/features/auth/registration.ts';
import { createAuthGateway, AuthFailure } from '../../src/features/auth/gateway.ts';
import { SessionModel } from '../../src/features/auth/session.ts';
const config = { origin: `https://${'a'.repeat(20)}.supabase.co`, publishableKey: 'sb_publishable_invented' };
const email = 'invented@example.invalid', password = 'invented-password-123';
const json = (body, status=200) => new Response(status===204 ? null : JSON.stringify(body), {status, headers:{'Content-Type':'application/json'}});
const failure = expected => e => e instanceof AuthFailure && e.code === expected;
test('owner setup rejects mismatch before attempting password update', () => {
  assert.equal(validateOwnerSetup(email,'123456',password,'different-password'),'confirmation');
  assert.equal(validateOwnerSetup(email,'12345a',password,password),'code');
  assert.equal(validateOwnerSetup(email,'123456','short','short'),'password');
  assert.equal(validateOwnerSetup('invalid','123456',password,password),'email');
  assert.equal(validateOwnerSetup(email,'123456',password,password),null);
});
test('private activation verifies owner, changes password, revokes temporary session and stays locked', async () => {
  const calls=[];
  const steps=[{access_token:'invented-recovery',expires_in:600,token_type:'bearer'}, {id:'00000000-0000-4000-8000-000000000001',is_anonymous:false},true,{},null];
  const gateway=createAuthGateway(config, async (url,init) => {calls.push({url,init}); return json(steps.shift(),url.includes('/logout')?204:200);});
  const model=new SessionModel(gateway);
  assert.equal(await model.resetPassword(email,'123456',password),true);
  assert.deepEqual(model.getSnapshot(),{state:'locked',error:null});
  assert.throws(()=>model.assertUnlocked(),failure('invalid_credentials'));
  assert.equal(calls.length,5);
  assert.deepEqual(JSON.parse(calls[0].init.body),{email,token:'123456',type:'recovery'});
  assert.deepEqual(JSON.parse(calls[3].init.body),{password});
  assert.ok(calls[4].url.endsWith('/logout?scope=local'));
  assert.ok(calls.every(({url})=>!url.includes(email)&&!url.includes(password)&&!url.includes('123456')));
});
test('disabled future registration never constructs gateway or reads config', async () => {
  let reads=0;
  const port=createRegistrationPort(false,()=>{reads++;throw Error('must not run');});
  assert.equal(port.enabled,false);
  await assert.rejects(port.register(email,password),failure('invalid_configuration'));
  assert.equal(reads,0);
});
test('Auth gateway independently refuses signup by default without a request', async () => {
  let calls=0;
  const gateway=createAuthGateway(config,async()=>{calls++;throw Error();});
  await assert.rejects(gateway.requestSignup(email,password),failure('invalid_configuration'));
  assert.equal(calls,0);
});
test('future email signup has fixed destination and never grants a session or owner role', async () => {
  const calls=[];
  const gateway=createAuthGateway(config,async(url,init)=>{calls.push({url,init});return json({id:'00000000-0000-4000-8000-000000000002'});},Date.now,20000,true);
  const port=createRegistrationPort(true,()=>gateway);
  assert.equal(await port.register(email,password),undefined);
  assert.equal(calls.length,1);assert.equal(calls[0].url,config.origin+'/auth/v1/signup');
  assert.deepEqual(JSON.parse(calls[0].init.body),{email,password});
  assert.equal(calls[0].init.redirect,'error');assert.equal(calls[0].init.credentials,'omit');
});
test('unexpected auto-confirm signup session is discarded and reported as configuration failure', async () => {
  const calls=[];
  const gateway=createAuthGateway(config,async(url,init)=>{calls.push({url,init});return url.includes('/signup')?json({access_token:'invented-unexpected-token'}):json(null,204);},Date.now,20000,true);
  await assert.rejects(gateway.requestSignup(email,password),failure('invalid_configuration'));
  assert.equal(calls.length,2);assert.ok(calls[1].url.endsWith('/logout?scope=local'));
});
test('future registration cancellation and rate limits never include provider errors', async () => {
  const controller=new AbortController();controller.abort();let builds=0;
  const port=createRegistrationPort(true,()=>{builds++;throw Error();});
  await assert.rejects(port.register(email,password,controller.signal),failure('cancelled'));assert.equal(builds,0);
  const gateway=createAuthGateway(config,async()=>json({message:'private-response'},429),Date.now,20000,true);
  await assert.rejects(gateway.requestSignup(email,password),failure('rate_limited'));
});
