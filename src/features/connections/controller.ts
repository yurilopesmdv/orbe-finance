import type { SessionAccess } from '../sync/session-cache.ts';
import type { ConnectionMetadata, StatusResult } from './status.ts';
import type { CommandResult } from './commands.ts';
type Input = Readonly<{ connectionId: string; revision: number }>;
type Reader = { read(signal?: AbortSignal): Promise<StatusResult> };
type Commands = { pause(input: Input, signal?: AbortSignal): Promise<CommandResult>; remove(input: Input, signal?: AbortSignal): Promise<CommandResult> };
export interface ConnectionsSnapshot {
  readonly phase: 'idle' | 'loading' | 'ready' | 'working' | 'uncertain' | 'error' | 'closed';
  readonly connections: readonly Readonly<ConnectionMetadata>[];
  readonly notice: 'none' | 'updated' | 'paused' | 'removed' | 'not_confirmed' | 'unavailable' | 'rate_limited' | 'uncertain';
}
const empty: readonly Readonly<ConnectionMetadata>[] = Object.freeze([]);
export function createConnectionsController(session: SessionAccess, reader: Reader, commands: Commands, policy: { enabled?: boolean } = {}) {
  let snapshot: Readonly<ConnectionsSnapshot> = Object.freeze({ phase: policy.enabled === true ? 'idle' : 'closed', connections: empty, notice: 'none' });
  let closed = policy.enabled !== true, active: AbortController | undefined, epoch = 0, unsubscribe: (() => void) | undefined;
  const listeners = new Set<() => void>();
  const emit = (phase: ConnectionsSnapshot['phase'], notice: ConnectionsSnapshot['notice'], connections = empty) => {
    snapshot = Object.freeze({ phase, notice, connections });
    for (const listener of listeners) listener();
  };
  const close = () => {
    if (closed) return; closed = true; epoch++; active?.abort(); active = undefined;
    const stop = unsubscribe; unsubscribe = undefined; try { stop?.(); } catch { /* No raw errors. */ }
    emit('closed', 'none'); listeners.clear();
  };
  const current = (): boolean => {
    try { if (!closed && session.assertUnlocked() === undefined && session.getSnapshot().state === 'unlocked') return true; } catch { /* Fail closed. */ }
    close(); return false;
  };
  const valid = (generation: number, controller: AbortController) => current() && generation === epoch && active === controller && !controller.signal.aborted;
  async function load(generation: number, controller: AbortController, notice: ConnectionsSnapshot['notice']) {
    let result: StatusResult;
    try { result = await reader.read(controller.signal); } catch { result = { status: 'unavailable' }; }
    if (!valid(generation, controller)) return;
    if (result.status === 'complete') emit('ready', notice, Object.freeze([...result.connections]));
    else emit('error', result.status === 'rate_limited' ? 'rate_limited' : 'unavailable');
  }
  async function refresh(): Promise<void> {
    if (!current() || active) return;
    const generation = ++epoch, controller = new AbortController(); active = controller;
    emit('loading', 'none');
    try { if (valid(generation, controller)) await load(generation, controller, 'updated'); }
    finally { if (active === controller) active = undefined; }
  }
  async function mutate(action: 'pause' | 'remove', input: Input): Promise<void> {
    if (!current() || active || snapshot.phase !== 'ready') return;
    let target: Readonly<ConnectionMetadata> | undefined;
    try {
      if (Object.keys(input).length !== 2 || !Object.hasOwn(input, 'connectionId') || !Object.hasOwn(input, 'revision')) return;
      const id = input.connectionId, revision = input.revision;
      target = snapshot.connections.find(row => row.id === id && row.revision === revision);
      if (!target || action === 'pause' && target.state !== 'active') return;
    } catch { return; }
    const captured = Object.freeze({ connectionId: target.id, revision: target.revision });
    const generation = ++epoch, controller = new AbortController(); active = controller;
    emit('working', 'none');
    try {
      if (!valid(generation, controller)) return;
      let result: CommandResult;
      try { result = await commands[action](captured, controller.signal); } catch { result = { status: 'unavailable' }; }
      if (!valid(generation, controller)) return;
      if (result.status === 'complete') {
        emit('loading', action === 'pause' ? 'paused' : 'removed');
        if (valid(generation, controller)) await load(generation, controller, action === 'pause' ? 'paused' : 'removed');
      } else emit('uncertain', result.status === 'not_confirmed' ? 'not_confirmed' : result.status === 'rate_limited' ? 'rate_limited' : 'uncertain');
    } finally { if (active === controller) active = undefined; }
  }
  if (!closed) {
    try {
      if (current()) {
        const stop = session.subscribe(() => { current(); });
        if (typeof stop !== 'function') close();
        else if (closed) stop();
        else { unsubscribe = stop; current(); }
      }
    } catch { close(); }
  }
  return Object.freeze({
    getSnapshot: () => snapshot,
    subscribe(listener: () => void) { if (closed) return () => {}; listeners.add(listener); return () => { listeners.delete(listener); }; },
    refresh, pause: (input: Input) => mutate('pause', input), remove: (input: Input) => mutate('remove', input), close,
  });
}
