import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createAuthGateway, AuthFailure } from '../../src/features/auth/gateway.ts';
const config = { origin: `https://${'a'.repeat(20)}.supabase.co`, publishableKey: 'sb_publishable_invented' };
const login = { access_token: 'invented-access-token', refresh_token: 'never-retain-this', expires_in: 600, token_type: 'bearer' };
const user = { id: '00000000-0000-4000-8000-000000000001', is_anonymous: false };
const email = 'invented@example.invalid', password = 'invented-password-only';
const response = (body, status = 200) => new Response(status === 204 ? null : JSON.stringify(body), { status, headers: { 'Content-Type':'application/json' } });
function fixture(steps, now = () => 1000) {
  const calls = [];
  const gateway = createAuthGateway(config, async (url, init) => {
    calls.push({ url, init });
    const step = steps.shift();
    if (step instanceof Error) throw step;
    if (typeof step === 'function') return step(url, init);
    if (step instanceof Response) return step;
    return response(step);
  }, now);
  return { gateway, calls };
}
const code = expected => error => error instanceof AuthFailure && error.code === expected && error.message === expected;
test('only verified owner receives a frozen short-lived session without refresh token', async () => {
  const { gateway } = fixture([login, user, true]); const result = await gateway.signIn(email, password);
  assert.deepEqual(result, { accessToken: login.access_token, expiresAt: 601000, subject:user.id }); assert.equal(Object.isFrozen(result), true); assert.equal('refreshToken' in result, false);
});
test('denied owner gets no session and issued credentials are discarded', async () => {
  const { gateway, calls } = fixture([login, user, false, response(null, 204)]);
  await assert.rejects(gateway.signIn(email, password), code('invalid_credentials')); assert.ok(calls.at(-1).url.endsWith('/logout?scope=local'));
});
test('malformed verified identity cannot reach authorization RPC', async () => {
  const { gateway, calls } = fixture([login, { id: 'not-a-uuid' }, response(null, 204)]);
  await assert.rejects(gateway.signIn(email, password), code('invalid_credentials')); assert.ok(!calls.some(c => c.url.includes('/rpc/')));
});
test('anonymous identity is refused even if a token was issued', async () => {
  const { gateway } = fixture([login, { ...user, is_anonymous: true }, response(null, 204)]);
  await assert.rejects(gateway.signIn(email, password), code('invalid_credentials'));
});
test('invalid expiry cannot establish a session', async () => {
  const { gateway } = fixture([{ ...login, expires_in: null }, response(null, 204)]);
  await assert.rejects(gateway.signIn(email, password), code('invalid_credentials'));
});
test('provider expiry longer than policy is capped to ten minutes', async () => {
  const { gateway } = fixture([{ ...login, expires_in: 3600 }, user, true]); assert.equal((await gateway.signIn(email, password)).expiresAt, 601000);
});
test('arbitrary destinations and administrative keys are refused', () => {
  for (const origin of ['http://example.invalid', config.origin + '/path', config.origin + '?secret=x', config.origin + '.untrusted.invalid']) assert.throws(() => createAuthGateway({ ...config, origin }), code('invalid_configuration'));
  for (const publishableKey of ['sbp_invented', 'sb_secret_invented', 'legacy-jwt']) assert.throws(() => createAuthGateway({ ...config, publishableKey }), code('invalid_configuration'));
});
test('credentials stay in Auth body and fixed-origin headers, never URL', async () => {
  const { gateway, calls } = fixture([login, user, true]); await gateway.signIn(email, password);
  assert.deepEqual(JSON.parse(calls[0].init.body), { email, password });
  for (const { url, init } of calls) { assert.ok(url.startsWith(config.origin + '/')); assert.ok(!url.includes(email) && !url.includes(password) && !url.includes(login.access_token)); assert.equal(init.redirect, 'error'); assert.equal(init.credentials, 'omit'); }
  assert.equal(calls[1].init.headers.Authorization, 'Bearer ' + login.access_token);
  for (const call of calls) { assert.match(call.init.headers['Cache-Control'], /no-store/); assert.match(call.init.headers['Cache-Control'], /no-cache/); assert.equal(call.init.headers.Pragma, 'no-cache'); }
});
test('rate limit ignores sensitive server error payload', async () => {
  const { gateway } = fixture([response({ message: 'private provider content' }, 429)]);
  await assert.rejects(gateway.signIn(email, password), code('rate_limited'));
});
test('network error is sanitized', async () => {
  const { gateway } = fixture([new Error('private url and credentials')]); await assert.rejects(gateway.signIn(email, password), code('unavailable'));
});
test('pre-cancelled request never calls transport', async () => {
  const abort = new AbortController(); abort.abort(); const { gateway, calls } = fixture([]);
  await assert.rejects(gateway.signIn(email, password, abort.signal), code('cancelled')); assert.equal(calls.length, 0);
});
test('late authorization after cancellation cannot return credentials', async () => {
  const abort = new AbortController();
  const { gateway, calls } = fixture([login, user, () => { abort.abort(); return response(true); }, response(null, 204)]);
  await assert.rejects(gateway.signIn(email, password, abort.signal), code('cancelled')); assert.ok(calls.at(-1).url.includes('/logout'));
});
test('request deadline aborts transport and gives sanitized failure', async () => {
  const gateway = createAuthGateway(config, async (_url, init) => new Promise((_resolve, reject) => init.signal.addEventListener('abort', () => reject(new Error('private timeout detail')))), () => 1000, 5);
  await assert.rejects(gateway.signIn(email, password), code('unavailable'));
});
test('recovery unknown account does not reveal existence', async () => {
  const { gateway } = fixture([response({ message: 'not found' }, 400)]); assert.equal(await gateway.requestRecovery(email), undefined);
});
test('recovery verifies owner, updates password and discards recovery credentials', async () => {
  const { gateway, calls } = fixture([login, user, true, user, response(null, 204)]);
  assert.equal(await gateway.resetPassword(email, '123456', password), undefined);
  assert.equal(JSON.parse(calls[0].init.body).type, 'recovery'); assert.equal(calls[3].init.method, 'PUT'); assert.deepEqual(JSON.parse(calls[3].init.body), { password }); assert.ok(calls.at(-1).url.includes('/logout'));
});
test('non-owner recovery never changes password', async () => {
  const { gateway, calls } = fixture([login, user, false, response(null, 204)]);
  await assert.rejects(gateway.resetPassword(email, '123456', password), code('invalid_credentials')); assert.ok(!calls.some(c => c.init.method === 'PUT'));
});
test('password update failure still discards recovery session', async () => {
  const { gateway, calls } = fixture([login, user, true, response({ message: 'private reason' }, 500), response(null, 204)]);
  await assert.rejects(gateway.resetPassword(email, '123456', password), code('unavailable')); assert.ok(calls.at(-1).url.includes('/logout'));
});
test('invalid recovery code and weak password do not leave device', async () => {
  const { gateway, calls } = fixture([]);
  await assert.rejects(gateway.resetPassword(email, 'invalid', password), code('expired_code'));
  await assert.rejects(gateway.resetPassword(email, '123456', 'short'), code('weak_password')); assert.equal(calls.length, 0);
});

test('deadline also rejects when transport ignores abort', async () => {
  const gateway = createAuthGateway(config, async () => new Promise(() => {}), () => 1000, 5);
  await assert.rejects(gateway.signIn(email, password), code('unavailable'));
});
test('malformed JSON does not expose provider data', async () => {
  const { gateway } = fixture([new Response('private invalid json', { status: 200 })]);
  await assert.rejects(gateway.signIn(email, password), code('unavailable'));
});

test('origin and key remain captured after caller mutates the validated configuration',async()=>{
 const mutable={...config},calls=[],steps=[login,user,true];const gateway=createAuthGateway(mutable,async(url,init)=>{calls.push({url,init});return response(steps.shift());},()=>1000);
 mutable.origin='https://attacker.invalid';mutable.publishableKey='sb_publishable_changed';await gateway.signIn(email,password);
 for(const call of calls){assert.ok(call.url.startsWith(config.origin+'/'));assert.equal(call.init.headers.apikey,config.publishableKey);}
});
test('object string coercion inherited or throwing configuration never creates a gateway',()=>{
 let coerced=0;const boxed={toString(){coerced++;return config.origin;}};
 for(const input of [{...config,origin:boxed},{...config,publishableKey:new String(config.publishableKey)},Object.create(config),{get origin(){throw new Error('PRIVATE_SYNTHETIC');},publishableKey:config.publishableKey}])assert.throws(()=>createAuthGateway(input),code('invalid_configuration'));
 assert.equal(coerced,0);
});
test('successful HTTP oversized JSON is rejected before session parsing with no error echo',async()=>{
 const {gateway}=fixture([new Response(JSON.stringify({...login,padding:'x'.repeat(131072)}),{headers:{'Content-Type':'application/json'}})]);await assert.rejects(gateway.signIn(email,password),code('unavailable'));
});
test('Auth deadline also interrupts a pending response body',async()=>{
 let cancelled=false;const stream=new ReadableStream({pull(){return new Promise(()=>{});},cancel(){cancelled=true;}},{highWaterMark:0});
 const gateway=createAuthGateway(config,async()=>new Response(stream,{headers:{'Content-Type':'application/json'}}),()=>1000,5);
 await assert.rejects(gateway.signIn(email,password),code('unavailable'));assert.equal(cancelled,true);
});

test('non-success response body is cancelled without reading private provider errors',async()=>{
 let reads=0,cancelled=false;const stream=new ReadableStream({pull(){reads++;},cancel(){cancelled=true;}},{highWaterMark:0});
 const {gateway,calls}=fixture([new Response(stream,{status:429,headers:{'Content-Type':'application/json'}})]);await assert.rejects(gateway.signIn(email,password),code('rate_limited'));assert.equal(reads,0);assert.equal(cancelled,true);assert.equal(calls[0].init.signal.aborted,true);
});
