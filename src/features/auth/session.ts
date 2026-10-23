import { REMEMBER_MS, type RefreshVault, type SavedAccess } from './refresh-vault.ts';
import { AuthFailure, type AuthCode, type AuthSession, type createAuthGateway } from './gateway.ts';
type Gateway = ReturnType<typeof createAuthGateway>;
export type SessionState = 'locked' | 'authenticating' | 'unlocked' | 'sending_code' | 'recovery_pending' | 'recovering' | 'restoring';
export interface SessionSnapshot { readonly state: SessionState; readonly error: AuthCode | null }
const codes = new Set<AuthCode>(['invalid_configuration', 'invalid_credentials', 'rate_limited', 'unavailable', 'cancelled', 'expired_code', 'weak_password', 'secure_storage']);
const safeCode = (error: unknown): AuthCode => error instanceof AuthFailure && codes.has(error.code) ? error.code : 'unavailable';
type Schedule = (callback: () => void, delayMs: number) => () => void;
const schedule: Schedule = (callback, delay) => { const timer = setTimeout(callback, delay); return () => clearTimeout(timer); };

/** Access credentials stay in memory; optional refresh storage is isolated from snapshots. */
export class SessionModel {
  #gateway: Gateway;
  #vault: RefreshVault | undefined;
  #remembered = false;
  #suppressRestore = false;
  #restoring: Promise<boolean> | null = null;
  #storageQueue: Promise<void> = Promise.resolve();
  #storage<T>(operation: () => Promise<T>): Promise<T> {
    const result = this.#storageQueue.then(operation, operation);
    this.#storageQueue = result.then(() => {}, () => {}); return result;
  }
  async #forget() { this.#remembered = false; if (this.#vault) await this.#storage(() => this.#vault!.clear()); }
  async #save(value: SavedAccess, epoch: number) {
    return this.#storage(async () => {
      if (!this.#current(epoch)) return false;
      await this.#vault!.write(value);
      if (!this.#current(epoch)) { await this.#vault!.clear(); return false; }
      return true;
    });
  }
  hasRememberedAccess = () => this.#remembered;
  canResumeSavedAccess = () => this.#remembered && !this.#suppressRestore;
  requirePassword = () => { this.#suppressRestore = true; this.lock(); };
  get canRemember() { return this.#vault !== undefined; }

  #clearPrivateCache:(()=>Promise<void>)|undefined;
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
  constructor(gateway: Gateway, now = Date.now, scheduler = schedule, vault?: RefreshVault, clearPrivateCache?:()=>Promise<void>) { this.#clearPrivateCache=clearPrivateCache; this.#vault = vault; this.#gateway = gateway; const origin = gateway.origin; this.#origin = typeof origin === 'string' ? origin : undefined; this.#now = now; this.#schedule = scheduler; }
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
  lock = () => { this.#clear(!this.#remembered); };
  setActive(active: boolean) { this.#active = active; if (!active) this.lock(); else if (this.#vault && !this.#suppressRestore) void this.resume(); }
  #current(epoch: number) { return epoch === this.#epoch && this.#active; }
  #controller() { const controller = new AbortController(); this.#controllers.add(controller); return controller; }
  async login(email: string, password: string, remember = false) {
    this.#remembered = false; this.#suppressRestore = false; this.lock();
    if (!this.#active) return false;
    const epoch = this.#epoch, controller = this.#controller();
    this.#emit('authenticating');
    try {
      let storageFailed = false;
      try { if (this.#vault) await this.#forget(); } catch { storageFailed = true; }
      if (!this.#current(epoch)) return false;
      const session = remember && this.#vault && !storageFailed
        ? await this.#gateway.signInRemembered(email, password, controller.signal)
        : await this.#gateway.signIn(email, password, controller.signal);
      if (!this.#current(epoch)) { void this.#discard(session); return false; }
      if (!session || typeof session.accessToken !== 'string' || !session.accessToken || !Number.isFinite(session.expiresAt) || session.expiresAt <= this.#now() || session.expiresAt > this.#now() + 600000) {
        void this.#discard(session); this.#emit('locked', 'invalid_credentials'); return false;
      }
      if (remember && this.#vault && 'refreshToken' in session) {
        try { this.#remembered = await this.#save({ origin: this.getPublicOrigin(), refreshToken: session.refreshToken as string, rememberUntil: this.#now() + REMEMBER_MS }, epoch); }
        catch { storageFailed = true; try { await this.#forget(); } catch { /* Report storage failure below. */ } }
      }
      if (!this.#current(epoch)) { void this.#discard(session); return false; }
      this.#establish(session, storageFailed ? 'secure_storage' : null); return true;
    } catch (error) {
      if (this.#current(epoch)) this.#emit('locked', safeCode(error));
      return false;
    } finally { this.#controllers.delete(controller); }
  }
  #establish(session: AuthSession, error: AuthCode | null = null) {
    // Only the access token enters the active in-memory session, never the refresh credential.
    this.#session = Object.freeze({ accessToken: session.accessToken, expiresAt: session.expiresAt, ...(session.subject?{subject:session.subject}:{}) });
    this.#cancelExpiry = this.#schedule(() => {
      this.lock(); if (this.#active && this.#remembered) void this.resume();
    }, Math.max(1, session.expiresAt - this.#now()));
    this.#emit('unlocked', error);
  }
  async logout() {
    let cacheFailure=false;const clearing=this.#clearPrivateCache?.().catch(()=>{cacheFailure=true;});
    this.#suppressRestore = true; this.#remembered = false;
    const previous = this.#clear(false), epoch = this.#epoch;
    await clearing;
    let failure = cacheFailure, saved: SavedAccess | null = null;
    if (this.#vault) {
      try {
        saved = await this.#storage(async () => {
          let old: SavedAccess | null = null;
          try { old = await this.#vault!.read(); } catch { /* Still remove unreadable storage. */ }
          await this.#vault!.clear(); return old;
        });
      } catch { failure = true; }
    }
    if (previous) await this.#discard(previous);
    else if (saved) {
      try { await this.#discard(await this.#gateway.refresh(saved.refreshToken)); } catch { /* Offline revocation cannot be guaranteed. Local credential was removed first. */ }
    }
    if (failure && this.#current(epoch)) this.#emit('locked', 'secure_storage');
  }
  resume(): Promise<boolean> {
    if (!this.#vault || !this.#active || this.#suppressRestore) return Promise.resolve(false);
    if (this.#snapshot.state === 'unlocked') return Promise.resolve(true);
    if (this.#restoring) return this.#restoring;
    this.#restoring = this.#resume().finally(() => {
      this.#restoring = null;
      if (this.#active && !this.#suppressRestore && this.#remembered && this.#snapshot.state === 'locked' && this.#snapshot.error === null) void this.resume();
    });
    return this.#restoring;
  }
  async #resume() {
    this.#clear(false);
    const epoch = this.#epoch, controller = this.#controller(); this.#emit('restoring');
    let issued: AuthSession | null = null;
    try {
      const saved = await this.#storage(() => this.#vault!.read());
      if (!this.#current(epoch)) return false;
      if (!saved) { this.#remembered = false; this.#emit('locked'); return false; }
      if (saved.origin !== this.getPublicOrigin() || saved.rememberUntil <= this.#now() || saved.rememberUntil > this.#now() + REMEMBER_MS) throw new AuthFailure('invalid_credentials');
      this.#remembered = true;
      const session = await this.#gateway.refresh(saved.refreshToken, controller.signal); issued = session;
      if (!this.#current(epoch)) { void this.#discard(session); return false; }
      if (!session.accessToken || !Number.isFinite(session.expiresAt) || session.expiresAt <= this.#now() || session.expiresAt > this.#now() + 600000) throw new AuthFailure('invalid_credentials');
      if (!await this.#save({ ...saved, refreshToken: session.refreshToken }, epoch)) { void this.#discard(session); return false; }
      this.#establish(session); issued = null; return true;
    } catch (error) {
      if (issued) void this.#discard(issued);
      if (this.#current(epoch)) {
        let code = safeCode(error);
        if (code === 'invalid_credentials' || code === 'invalid_configuration' || code === 'secure_storage') {
          try { await this.#forget(); } catch { code = 'secure_storage'; }
        }
        if (this.#current(epoch)) this.#emit('locked', code);
      }
      return false;
    } finally { this.#controllers.delete(controller); }
  }
  #requireSession(): AuthSession {
    if (this.#session && this.#session.expiresAt <= this.#now()) this.lock();
    if (!this.#active || !this.#session || this.#snapshot.state !== 'unlocked') throw new AuthFailure('invalid_credentials');
    return this.#session;
  }
  cacheSubject = (): string => {const subject=this.#requireSession().subject;if(!subject)throw new AuthFailure('unavailable');return subject;};
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
    this.#suppressRestore = true; this.#remembered = false; this.lock(); if (!this.#active) return false;
    const epoch = this.#epoch, controller = this.#controller(); this.#emit('sending_code');
    try {
      if (this.#vault) await this.#forget();
      if (!this.#current(epoch)) return false;
      await this.#gateway.requestRecovery(email, controller.signal);
      if (!this.#current(epoch)) return false;
      this.#emit('recovery_pending'); return true;
    } catch (error) { if (this.#current(epoch)) this.#emit('locked', safeCode(error)); return false; }
    finally { this.#controllers.delete(controller); }
  }
  async resetPassword(email: string, code: string, password: string) {
    this.#suppressRestore = true; this.#remembered = false; this.lock(); if (!this.#active) return false;
    const epoch = this.#epoch, controller = this.#controller(); this.#emit('recovering');
    try {
      if (this.#vault) await this.#forget();
      if (!this.#current(epoch)) return false;
      await this.#gateway.resetPassword(email, code, password, controller.signal);
      if (!this.#current(epoch)) return false;
      this.#emit('locked'); return true;
    } catch (error) { if (this.#current(epoch)) this.#emit('locked', safeCode(error)); return false; }
    finally { this.#controllers.delete(controller); }
  }
}
