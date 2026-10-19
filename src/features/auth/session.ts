import { AuthFailure, type AuthCode, type AuthSession, type createAuthGateway } from './gateway.ts';
type Gateway = ReturnType<typeof createAuthGateway>;
export type SessionState = 'locked' | 'authenticating' | 'unlocked' | 'sending_code' | 'recovery_pending' | 'recovering';
export interface SessionSnapshot { readonly state: SessionState; readonly error: AuthCode | null }
const codes = new Set<AuthCode>(['invalid_configuration', 'invalid_credentials', 'rate_limited', 'unavailable', 'cancelled', 'expired_code', 'weak_password']);
const safeCode = (error: unknown): AuthCode => error instanceof AuthFailure && codes.has(error.code) ? error.code : 'unavailable';
type Schedule = (callback: () => void, delayMs: number) => () => void;
const schedule: Schedule = (callback, delay) => { const timer = setTimeout(callback, delay); return () => clearTimeout(timer); };

/** Session credentials never enter the observable snapshot or persistent storage. */
export class SessionModel {
  #gateway: Gateway;
  #origin: string | undefined;
  #now: () => number;
  #schedule: Schedule;
  #cancelExpiry: (() => void) | null = null;
  #session: AuthSession | null = null;
  #epoch = 0;
  #active = true;
  #controllers = new Set<AbortController>();
  #listeners = new Set<() => void>();
  #snapshot: SessionSnapshot = Object.freeze({ state: 'locked', error: null });
  constructor(gateway: Gateway, now = Date.now, scheduler = schedule) { this.#gateway = gateway; const origin = gateway.origin; this.#origin = typeof origin === 'string' ? origin : undefined; this.#now = now; this.#schedule = scheduler; }
  getPublicOrigin = (): string => { if (!this.#origin) throw new AuthFailure('invalid_configuration'); return this.#origin; };
  getSnapshot = () => this.#snapshot;
  subscribe = (listener: () => void) => { this.#listeners.add(listener); return () => { this.#listeners.delete(listener); }; };
  #emit(state: SessionState, error: AuthCode | null = null) {
    this.#snapshot = Object.freeze({ state, error });
    for (const listener of this.#listeners) listener();
  }
  async #discard(session: AuthSession | null) {
    if (!session?.accessToken) return;
    try { await this.#gateway.signOut(session); } catch { /* Local state stays locked even if the server is offline. */ }
  }
  #clear(revoke: boolean) {
    const previous = this.#session;
    this.#epoch++; this.#session = null;
    this.#cancelExpiry?.(); this.#cancelExpiry = null;
    for (const controller of this.#controllers) controller.abort();
    this.#controllers.clear(); this.#emit('locked');
    if (revoke) void this.#discard(previous);
    return previous;
  }
  lock = () => { this.#clear(true); };
  setActive(active: boolean) { this.#active = active; if (!active) this.lock(); }
  #current(epoch: number) { return epoch === this.#epoch && this.#active; }
  #controller() { const controller = new AbortController(); this.#controllers.add(controller); return controller; }
  async login(email: string, password: string) {
    this.lock();
    if (!this.#active) return false;
    const epoch = this.#epoch, controller = this.#controller();
    this.#emit('authenticating');
    try {
      const session = await this.#gateway.signIn(email, password, controller.signal);
      if (!this.#current(epoch)) { void this.#discard(session); return false; }
      if (!session || typeof session.accessToken !== 'string' || !session.accessToken || !Number.isFinite(session.expiresAt) || session.expiresAt <= this.#now() || session.expiresAt > this.#now() + 600000) {
        void this.#discard(session); this.#emit('locked', 'invalid_credentials'); return false;
      }
      this.#session = Object.freeze({ ...session });
      this.#cancelExpiry = this.#schedule(this.lock, Math.max(1, session.expiresAt - this.#now()));
      this.#emit('unlocked'); return true;
    } catch (error) {
      if (this.#current(epoch)) this.#emit('locked', safeCode(error));
      return false;
    } finally { this.#controllers.delete(controller); }
  }
  async logout() { const previous = this.#clear(false); await this.#discard(previous); }
  #requireSession(): AuthSession {
    if (this.#session && this.#session.expiresAt <= this.#now()) this.lock();
    if (!this.#active || !this.#session || this.#snapshot.state !== 'unlocked') throw new AuthFailure('invalid_credentials');
    return this.#session;
  }
  assertUnlocked = (): void => { this.#requireSession(); };
  async read<T>(operation: (token: string, signal: AbortSignal) => Promise<T>): Promise<T> {
    const session = this.#requireSession(), epoch = this.#epoch, controller = this.#controller();
    try {
      const result = await operation(session.accessToken, controller.signal);
      if (session.expiresAt <= this.#now()) this.lock();
      if (!this.#current(epoch) || this.#session !== session) throw new AuthFailure('cancelled');
      return result;
    } catch (error) {
      const code = safeCode(error);
      if (code === 'invalid_credentials' && this.#current(epoch)) this.lock();
      throw new AuthFailure(code);
    } finally { this.#controllers.delete(controller); }
  }
  async requestRecovery(email: string) {
    this.lock(); if (!this.#active) return false;
    const epoch = this.#epoch, controller = this.#controller(); this.#emit('sending_code');
    try {
      await this.#gateway.requestRecovery(email, controller.signal);
      if (!this.#current(epoch)) return false;
      this.#emit('recovery_pending'); return true;
    } catch (error) { if (this.#current(epoch)) this.#emit('locked', safeCode(error)); return false; }
    finally { this.#controllers.delete(controller); }
  }
  async resetPassword(email: string, code: string, password: string) {
    this.lock(); if (!this.#active) return false;
    const epoch = this.#epoch, controller = this.#controller(); this.#emit('recovering');
    try {
      await this.#gateway.resetPassword(email, code, password, controller.signal);
      if (!this.#current(epoch)) return false;
      this.#emit('locked'); return true;
    } catch (error) { if (this.#current(epoch)) this.#emit('locked', safeCode(error)); return false; }
    finally { this.#controllers.delete(controller); }
  }
}
