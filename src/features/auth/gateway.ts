export type AuthCode = 'invalid_configuration' | 'invalid_credentials' | 'rate_limited' | 'unavailable' | 'cancelled' | 'expired_code' | 'weak_password';
export class AuthFailure extends Error {
  readonly code: AuthCode;
  constructor(code: AuthCode) { super(code); this.name = 'AuthFailure'; this.code = code; }
}
export interface AuthSession { readonly accessToken: string; readonly expiresAt: number }
export interface AuthConfig { origin: string; publishableKey: string }
type Transport = (url: string, init: RequestInit) => Promise<Response>;
type Payload = Record<string, unknown>;
const isPayload = (value: unknown): value is Payload => typeof value === 'object' && value !== null && !Array.isArray(value);
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const validEmail = (value: string) => typeof value === 'string' && value.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

export function createAuthGateway(config: AuthConfig, transport: Transport = fetch, now: () => number = Date.now, timeoutMs = 20000) {
  if (!/^https:\/\/[a-z]{20}\.supabase\.co$/.test(config.origin) || !/^sb_publishable_[A-Za-z0-9_-]+$/.test(config.publishableKey) || !Number.isSafeInteger(timeoutMs) || timeoutMs <= 0 || timeoutMs > 20000) throw new AuthFailure('invalid_configuration');
  // Only literal internal operations can choose destinations. No arbitrary URL enters the gateway.
  type Operation = 'login' | 'user' | 'owner' | 'logout' | 'recover' | 'verify' | 'update';
  const routes: Record<Operation, string> = { login: '/auth/v1/token?grant_type=password', user: '/auth/v1/user', owner: '/rest/v1/rpc/orbe_is_owner', logout: '/auth/v1/logout?scope=local', recover: '/auth/v1/recover', verify: '/auth/v1/verify', update: '/auth/v1/user' };
  async function request(operation: Operation, body?: Payload, token?: string, signal?: AbortSignal): Promise<unknown> {
    if (signal?.aborted) throw new AuthFailure('cancelled');
    const controller = new AbortController();
    let cancel = () => {};
    let timeout: ReturnType<typeof setTimeout> | undefined;
    const stopped = new Promise<never>((_resolve, reject) => {
      cancel = () => { controller.abort(); reject(new AuthFailure('cancelled')); };
      signal?.addEventListener('abort', cancel, { once: true });
      timeout = setTimeout(() => { controller.abort(); reject(new AuthFailure('unavailable')); }, timeoutMs);
    });
    try {
      const operationResult = (async () => {
        const response = await transport(config.origin + routes[operation], {
          method: operation === 'user' ? 'GET' : operation === 'update' ? 'PUT' : 'POST',
          headers: { apikey: config.publishableKey, 'Content-Type': 'application/json', 'Cache-Control': 'no-store', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
          ...(body === undefined ? {} : { body: JSON.stringify(body) }),
          signal: controller.signal, redirect: 'error', cache: 'no-store', credentials: 'omit',
        });
        if (signal?.aborted) throw new AuthFailure('cancelled');
        if (response.redirected) throw new AuthFailure('unavailable');
        if (response.status === 429) throw new AuthFailure('rate_limited');
        if (!response.ok) throw new AuthFailure(response.status >= 500 ? 'unavailable' : operation === 'verify' ? 'expired_code' : 'invalid_credentials');
        if (response.status === 204) return null;
        const data: unknown = await response.json();
        if (signal?.aborted) throw new AuthFailure('cancelled');
        return data;
      })();
      return await Promise.race([operationResult, stopped]);
    } catch (error) {
      if (error instanceof AuthFailure) throw error;
      throw new AuthFailure(signal?.aborted ? 'cancelled' : 'unavailable');
    } finally {
      clearTimeout(timeout); signal?.removeEventListener('abort', cancel);
    }
  }

  async function signOut(session: AuthSession) { await request('logout', undefined, session.accessToken); }
  async function discard(token: string) {
    try { await signOut({ accessToken: token, expiresAt: 0 }); } catch { /* Caller must still clear local session. */ }
  }
  async function authorize(data: unknown, startedAt: number, signal?: AbortSignal): Promise<AuthSession> {
    const token = isPayload(data) && typeof data.access_token === 'string' ? data.access_token : '';
    try {
      if (!isPayload(data) || !token || /\s/.test(token) || token.length > 16384 || typeof data.expires_in !== 'number' || !Number.isSafeInteger(data.expires_in) || data.expires_in <= 0 || data.token_type !== 'bearer') throw new AuthFailure('invalid_credentials');
      const expiresAt = startedAt + Math.min(data.expires_in, 600) * 1000;
      const user = await request('user', undefined, token, signal);
      if (!isPayload(user) || typeof user.id !== 'string' || !uuid.test(user.id) || user.is_anonymous === true) throw new AuthFailure('invalid_credentials');
      const allowed = await request('owner', {}, token, signal);
      if (allowed !== true || expiresAt <= now() || signal?.aborted) throw new AuthFailure(signal?.aborted ? 'cancelled' : 'invalid_credentials');
      return Object.freeze({ accessToken: token, expiresAt });
    } catch (error) {
      if (token && !/\s/.test(token) && token.length <= 16384) await discard(token);
      throw error instanceof AuthFailure ? error : new AuthFailure('unavailable');
    }
  }
  return Object.freeze({
    async signIn(email: string, password: string, signal?: AbortSignal): Promise<AuthSession> {
      if (!validEmail(email) || typeof password !== 'string' || !password) throw new AuthFailure('invalid_credentials');
      const startedAt = now();
      return authorize(await request('login', { email, password }, undefined, signal), startedAt, signal);
    },
    signOut,
    async requestRecovery(email: string, signal?: AbortSignal): Promise<void> {
      if (!validEmail(email)) throw new AuthFailure('invalid_credentials');
      try { await request('recover', { email }, undefined, signal); }
      catch (error) { if (!(error instanceof AuthFailure) || error.code !== 'invalid_credentials') throw error; }
    },
    async resetPassword(email: string, code: string, password: string, signal?: AbortSignal): Promise<void> {
      if (!validEmail(email) || !/^\d{6}$/.test(code)) throw new AuthFailure('expired_code');
      if (typeof password !== 'string' || password.length < 12) throw new AuthFailure('weak_password');
      const startedAt = now();
      const session = await authorize(await request('verify', { email, token: code, type: 'recovery' }, undefined, signal), startedAt, signal);
      try { await request('update', { password }, session.accessToken, signal); }
      finally { await discard(session.accessToken); }
      // Recovery never returns login credentials. UI must require a new password login.
    },
  });
}
