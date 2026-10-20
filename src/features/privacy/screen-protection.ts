export interface ScreenPorts { activate(): Promise<void>; release(): Promise<void> }
export interface NativeScreen { available(): Promise<boolean>; prevent(key: string): Promise<void>; allow(key: string): Promise<void>; blur(): Promise<void>; unblur(): Promise<void> }
export function createScreenRegistry(native: NativeScreen) {
  const owners = new Set<string>(); let sequence = 0, tail: Promise<void> = Promise.resolve();
  const prefix = 'orbe-private-' + Date.now().toString(36) + '-';
  const enqueue = (work: () => Promise<void>) => { const result = tail.then(work, work); tail = result.catch(() => {}); return result; };
  return Object.freeze({
    create(): ScreenPorts {
      const key = prefix + ++sequence; let released = false, activation: Promise<void> | null = null;
      return Object.freeze({
        async activate() {
          if (released) throw Error('screen_protection_unavailable');
          owners.add(key);
          if (!activation) activation = enqueue(async () => {
            if (!owners.has(key) || !await native.available()) throw Error();
            if (!owners.has(key)) throw Error();
            await native.prevent(key);
            if (!owners.has(key)) throw Error();
            await native.blur();
            if (!owners.has(key)) throw Error();
          }).catch(() => { activation = null; throw Error('screen_protection_unavailable'); });
          return activation;
        },
        async release() {
          if (released) return; released = true; owners.delete(key);
          return enqueue(async () => {
            try { await native.allow(key); }
            finally { if (owners.size === 0) await native.unblur(); }
          }).catch(() => { throw Error('screen_protection_unavailable'); });
        },
      });
    },
  });
}
export interface ScreenSnapshot { readonly phase: 'preparing' | 'ready' | 'unavailable' | 'closed'; readonly active: boolean }
interface Timer { set(callback: () => void, ms: number): unknown; clear(handle: unknown): void }
const timer: Timer = { set: (callback, ms) => setTimeout(callback, ms), clear: handle => clearTimeout(handle as ReturnType<typeof setTimeout>) };
export class ScreenProtectionModel {
  #ports: ScreenPorts; #timer: Timer; #epoch = 0; #closed = false;
  #pending: Promise<boolean> | null = null; #cancel: (() => void) | null = null;
  #listeners = new Set<() => void>();
  #snapshot: ScreenSnapshot = Object.freeze({ phase: 'preparing', active: false });
  constructor(ports: ScreenPorts, clock: Timer = timer) { this.#ports = ports; this.#timer = clock; }
  getSnapshot = () => this.#snapshot;
  subscribe = (listener: () => void) => { this.#listeners.add(listener); return () => { this.#listeners.delete(listener); }; };
  #emit(phase: ScreenSnapshot['phase'], active = this.#snapshot.active) {
    this.#snapshot = Object.freeze({ phase, active }); for (const listener of this.#listeners) listener();
  }
  setActive(active: boolean) { if (!this.#closed) this.#emit(this.#snapshot.phase, active); }
  start = (): Promise<boolean> => {
    if (this.#closed) return Promise.resolve(false);
    if (this.#snapshot.phase === 'ready') return Promise.resolve(true);
    if (this.#pending) return this.#pending;
    this.#pending = Promise.resolve().then(() => this.#run()).finally(() => { this.#pending = null; });
    return this.#pending;
  };
  async #run() {
    if (this.#closed) return false;
    const epoch = ++this.#epoch; this.#emit('preparing');
    let handle: unknown, scheduled = false;
    try {
      const stopped = new Promise<boolean>(resolve => {
        this.#cancel = () => resolve(false);
        handle = this.#timer.set(() => resolve(false), 5000); scheduled = true;
      });
      const ready = await Promise.race([this.#ports.activate().then(() => true, () => false), stopped]);
      if (this.#closed || epoch !== this.#epoch) return false;
      this.#emit(ready ? 'ready' : 'unavailable'); return ready;
    } catch { if (!this.#closed && epoch === this.#epoch) this.#emit('unavailable'); return false; }
    finally { if (scheduled) { try { this.#timer.clear(handle); } catch { /* Never surface timer internals. */ } } this.#cancel = null; }
  }
  close() {
    if (this.#closed) return;
    this.#closed = true; this.#epoch++; this.#cancel?.(); this.#emit('closed', false);
    void this.#ports.release().catch(() => {});
  }
}
