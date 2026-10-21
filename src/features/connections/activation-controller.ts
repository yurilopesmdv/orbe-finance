import type { SessionAccess } from '../sync/session-cache.ts';
import type { ScreenSnapshot } from '../privacy/screen-protection.ts';
import type { StatusResult } from '../connections/status.ts';
import type { ActivationGatewayResult } from './activation-gateway.ts';
interface Protection { getSnapshot(): ScreenSnapshot; subscribe(listener: () => void): () => void }
interface Ports { status(signal: AbortSignal): Promise<StatusResult>; activate(input: { connectionId: string; revision: number }, signal: AbortSignal): Promise<ActivationGatewayResult> }
export interface ActivationSnapshot { readonly phase: 'idle' | 'loading' | 'ready' | 'error' | 'closed'; readonly notice: 'none' | 'activated' | 'origin_unconfirmed' | 'uncertain' | 'unavailable' | 'cooldown' | 'cancelled' }
const fail = (): never => { throw Error('activation_access_unavailable'); };
const uuid = (value: unknown): value is string => typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(value);
export function createActivationController(session: SessionAccess, protection: Protection, ports: Ports, policy: { enabled?: boolean; privateDataApproved?: boolean } = {}) {
  if (policy.enabled !== true || policy.privateDataApproved !== true) return Object.freeze({ kind: 'disabled' as const });
  let closed = false, stopSession: (() => void) | undefined, stopProtection: (() => void) | undefined;
  let snapshot: Readonly<ActivationSnapshot> = Object.freeze({ phase: 'idle', notice: 'none' });
  let pending: { controller: AbortController; cancel(): void } | null = null;
  const listeners = new Set<() => void>();
  const emit = (phase: ActivationSnapshot['phase'], notice: ActivationSnapshot['notice']) => { snapshot = Object.freeze({ phase, notice }); for (const listener of listeners) { try { listener(); } catch {} } };
  const close = () => { if (closed) return; closed = true; pending?.cancel(); const first = stopSession, second = stopProtection; stopSession = undefined; stopProtection = undefined; try { first?.(); } catch {} try { second?.(); } catch {} emit('closed', 'cancelled'); listeners.clear(); };
  const current = () => { try { const screen = protection.getSnapshot(); if (closed || session.assertUnlocked() !== undefined || session.getSnapshot().state !== 'unlocked' || screen.phase !== 'ready' || !screen.active) return fail(); } catch { close(); return fail(); } };
  try {
    current(); const watch = () => { try { current(); } catch {} };
    const first = session.subscribe(watch); if (closed) { first(); return fail(); } stopSession = first;
    const second = protection.subscribe(watch); if (closed) { second(); return fail(); } stopProtection = second; current();
    return Object.freeze({
      kind: 'ready' as const, getSnapshot: () => snapshot, subscribe: (listener: () => void) => { if (closed) return () => {}; listeners.add(listener); return () => { listeners.delete(listener); }; }, close,
      async run(connectionId: string): Promise<boolean> {
        try { current(); } catch { return false; }
        if (!uuid(connectionId)) { emit('error', 'unavailable'); return false; }
        if (pending) return false;
        const controller = new AbortController(); let settle: (value: boolean) => void = () => {};
        const stopped = new Promise<boolean>(resolve => { settle = resolve; });
        const cancel = () => { controller.abort(); settle(false); }; pending = { controller, cancel }; emit('loading', 'none');
        const timer = setTimeout(() => { cancel(); if (!closed) emit('error', 'unavailable'); }, 30000);
        const fresh = () => { current(); if (controller.signal.aborted) return fail(); };
        try {
          const work = async () => {
            fresh(); const metadata = await ports.status(controller.signal); fresh();
            if (metadata.status !== 'complete') { emit('error', metadata.status === 'rate_limited' ? 'cooldown' : 'unavailable'); return false; }
            const selected = metadata.connections.find(row => row.id === connectionId);
            if (!selected || selected.state !== 'pending' || !Number.isSafeInteger(selected.revision) || selected.revision < 1) return fail();
            const input = Object.freeze({ connectionId: selected.id, revision: selected.revision });
            const result = await ports.activate(input, controller.signal); fresh();
            if(result.status==='activated'){
              const confirmed=await ports.status(controller.signal);fresh();
              if(confirmed.status!=='complete'||!confirmed.connections.some(row=>row.id===input.connectionId&&row.institution===selected.institution&&row.state==='active'&&row.revision>input.revision)){emit('error','uncertain');return false;}
              emit('ready','activated');return true;
            }
            if(result.status==='origin_unconfirmed'){emit('error','origin_unconfirmed');return false;}
            emit('error', result.status === 'rate_limited' ? 'cooldown' : result.status === 'cancelled' ? 'cancelled' : 'unavailable'); return false;
          };
          return await Promise.race([work(), stopped]);
        } catch { if (!closed && !controller.signal.aborted) emit('error', 'unavailable'); return false; }
        finally { clearTimeout(timer); controller.abort(); if (pending?.controller === controller) pending = null; }
      },
    });
  } catch { close(); return Object.freeze({ kind: 'unavailable' as const }); }
}
