// Isolated synthetic spike. No production Auth or persistence adapter.
const allowedCodes = new Set(['invalid_credentials', 'rate_limited', 'offline', 'expired_code']);
const safeCode = error => allowedCodes.has(error?.code) ? error.code : 'unavailable';

export class AccessSession {
  #provider; #owner; #now; #epoch = 0; #session = null;
  #state = 'locked'; #appState = 'active'; #error = null;
  constructor({ provider, ownerId, now = Date.now }) {
    if (!provider || !ownerId) throw new TypeError('invalid_configuration');
    this.#provider = provider; this.#owner = ownerId; this.#now = now;
  }
  get snapshot() {
    this.#expire();
    return Object.freeze({ state: this.#state, error: this.#error });
  }
  #expire() {
    if (this.#session && this.#session.expiresAt <= this.#now()) this.lock();
  }
  lock() {
    this.#epoch++; this.#session = null; this.#state = 'locked'; this.#error = null;
  }
  setAppState(value) {
    this.#appState = value;
    if (value !== 'active') this.lock();
  }
  async #discard(session) {
    if (session?.accessToken) {
      try { await this.#provider.signOut(session.accessToken); } catch { /* Local remains locked. */ }
    }
  }
  async login(email, password) {
    this.lock();
    if (this.#appState !== 'active') return false;
    const epoch = this.#epoch; this.#state = 'authenticating';
    try {
      const session = await this.#provider.signIn({ email, password });
      if (epoch !== this.#epoch || this.#appState !== 'active') {
        await this.#discard(session); return false;
      }
      if (session?.userId !== this.#owner || typeof session.accessToken !== 'string' || !session.accessToken ||
          !Number.isFinite(session.expiresAt) || session.expiresAt <= this.#now()) {
        this.#state = 'locked'; this.#error = 'invalid_credentials';
        await this.#discard(session); return false;
      }
      this.#session = { ...session }; this.#state = 'unlocked'; return true;
    } catch (error) {
      if (epoch === this.#epoch) { this.#state = 'locked'; this.#error = safeCode(error); }
      return false;
    }
  }
  async logout() {
    const session = this.#session; this.lock(); await this.#discard(session);
  }
  async read(operation) {
    this.#expire();
    if (this.#state !== 'unlocked' || this.#appState !== 'active') throw new Error('locked');
    const epoch = this.#epoch;
    let value;
    try { value = await operation(this.#session.accessToken); }
    catch (error) { throw new Error(safeCode(error)); }
    this.#expire();
    if (epoch !== this.#epoch || this.#state !== 'unlocked') throw new Error('stale_result');
    return value;
  }
  async requestRecovery(email) {
    this.lock();
    if (this.#appState !== 'active') return false;
    const epoch = this.#epoch;
    try { await this.#provider.requestRecovery(email); }
    catch { /* Same public response for unknown email or provider rejection. */ }
    if (epoch !== this.#epoch) return false;
    this.#state = 'recovery_pending'; return true;
  }
  async resetPassword(email, code, password) {
    this.lock();
    if (this.#appState !== 'active') return false;
    if (typeof password !== 'string' || password.length < 12) {
      this.#error = 'weak_password'; return false;
    }
    const epoch = this.#epoch; this.#state = 'recovering';
    try {
      // Port owns and disposes recovery-only credentials; never returns a login session.
      await this.#provider.resetPassword({ email, code, password });
      if (epoch !== this.#epoch) return false;
      this.#state = 'locked'; return true;
    } catch (error) {
      if (epoch === this.#epoch) { this.#state = 'locked'; this.#error = safeCode(error); }
      return false;
    }
  }
}
