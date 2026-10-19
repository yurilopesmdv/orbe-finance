export interface MemoryPrincipal { subject: string; generation: number; unlocked: boolean }
/** Shared guard for volatile stores; not a substitute for server authorization or encrypted storage. */
export class MemoryScope {
  #guard: (() => MemoryPrincipal | null) | null;
  #initial: { subject: string; generation: number } | null;
  #closed = false;
  #purge: () => void;
  constructor(guard: () => MemoryPrincipal | null, purge: () => void) {
    let principal;
    try { principal = guard(); } catch { throw new Error('repository_locked'); }
    if (principal?.unlocked !== true || typeof principal.subject !== 'string' || !principal.subject.trim() || principal.subject.length > 200 || !Number.isSafeInteger(principal.generation) || principal.generation < 0) throw new Error('repository_locked');
    this.#guard = guard; this.#initial = { subject: principal.subject, generation: principal.generation }; this.#purge = purge;
  }
  assert() {
    if (this.#closed || !this.#guard || !this.#initial) throw new Error('repository_locked');
    let current;
    try { current = this.#guard(); } catch { current = null; }
    if (current?.unlocked !== true || current.subject !== this.#initial.subject || current.generation !== this.#initial.generation) { this.close(); throw new Error('repository_locked'); }
  }
  assertOwner(subject: string) { this.assert(); if (subject !== this.#initial?.subject) throw new Error('owner_mismatch'); }
  close() { if (this.#closed) return; this.#closed = true; this.#guard = null; this.#initial = null; this.#purge(); }
}
