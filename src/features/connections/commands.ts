import { AuthFailure, type AuthConfig } from '../auth/gateway.ts';
import type { SessionModel } from '../auth/session.ts';
import { readBoundedJson } from '../../lib/bounded-json.ts';
export type CommandStatus = 'disabled'|'busy'|'invalid_input'|'locked'|'cancelled'|'unavailable'|'rate_limited'|'not_confirmed'|'complete';
export interface CommandResult { readonly status: CommandStatus }
type Session = Pick<SessionModel,'read'|'assertUnlocked'|'getPublicOrigin'>;
type Transport = (url: string, init: RequestInit) => Promise<Pick<Response,'ok'|'status'|'redirected'|'headers'|'body'>>;
const result = (status: CommandStatus): Readonly<CommandResult> => Object.freeze({ status });
const uuid = (value: unknown): value is string => typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(value);
export function createConnectionCommands(session: Session, resolvePublicConfig: () => AuthConfig | null, transport: Transport, policy: { enabled?: boolean; privateDataApproved?: boolean; timeoutMs?: number } = {}) {
  const enabled = policy.enabled === true && policy.privateDataApproved === true;
  let pending = false;
  async function run(action: 'pause'|'remove', raw: unknown, external?: AbortSignal): Promise<Readonly<CommandResult>> {
    if (!enabled) return result('disabled');
    let read: Session['read'];
    try {
      if (session.assertUnlocked() !== undefined || typeof session.read !== 'function') return result('locked');
      read = session.read.bind(session);
    } catch { return result('locked'); }
    if (pending) return result('busy');
    if (external?.aborted) return result('cancelled');
    let connectionId: string, revision: number;
    try {
      if (!raw || typeof raw !== 'object' || Array.isArray(raw) || Object.keys(raw).length !== 2 || !Object.hasOwn(raw,'connectionId') || !Object.hasOwn(raw,'revision')) return result('invalid_input');
      const input = raw as Record<string,unknown>, id = input.connectionId, version = input.revision;
      if (!uuid(id) || typeof version !== 'number' || !Number.isSafeInteger(version) || version < 1 || action === 'pause' && version >= Number.MAX_SAFE_INTEGER) return result('invalid_input');
      connectionId = id; revision = version;
    } catch { return result('invalid_input'); }
    pending = true;
    try {
      const expectedOrigin = session.getPublicOrigin();
      return await read<Readonly<CommandResult>>(async(token,parent) => {
        if (parent.aborted || external?.aborted) return result('cancelled');
        let origin: string, publishableKey: string, timeoutMs: number;
        try {
          const config = resolvePublicConfig();
          if (!config || !Object.hasOwn(config,'origin') || !Object.hasOwn(config,'publishableKey')) return result('unavailable');
          const url = config.origin, key = config.publishableKey;
          timeoutMs = policy.timeoutMs ?? 20000;
          if (typeof url !== 'string' || url !== expectedOrigin || !/^https:\/\/[a-z]{20}\.supabase\.co$/.test(url) || typeof key !== 'string' || !/^sb_publishable_[A-Za-z0-9_-]+$/.test(key) || !Number.isSafeInteger(timeoutMs) || timeoutMs < 1 || timeoutMs > 20000 || typeof transport !== 'function') return result('unavailable');
          origin = url; publishableKey = key;
        } catch { return result('unavailable'); }
        const child = new AbortController(); let stop: (() => void) | undefined, timer: ReturnType<typeof setTimeout> | undefined;
        const interrupted = new Promise<Readonly<CommandResult>>(resolve => {
          stop = () => { child.abort(); resolve(result('cancelled')); };
          parent.addEventListener('abort',stop,{ once:true }); external?.addEventListener('abort',stop,{ once:true });
          timer = setTimeout(()=>{ child.abort(); resolve(result('unavailable')); },timeoutMs);
        });
        try {
          if (parent.aborted || external?.aborted) return result('cancelled');
          const operation = async(): Promise<Readonly<CommandResult>> => {
            try {
              const response = await transport(origin+'/rest/v1/rpc/'+(action === 'pause' ? 'orbe_pause_connection' : 'orbe_remove_connection'),{
                method:'POST',headers:{ apikey:publishableKey,Authorization:`Bearer ${token}`,'Content-Type':'application/json','Cache-Control':'no-store' },
                body:JSON.stringify({ p_connection_id:connectionId,p_revision:revision }),signal:child.signal,credentials:'omit',redirect:'error',cache:'no-store',
              });
              const discard = () => { try { void response.body?.cancel().catch(()=>{}); } catch {} };
              try {
                if (child.signal.aborted) return result(parent.aborted || external?.aborted ? 'cancelled' : 'unavailable');
                if (response.redirected) return result('unavailable');
                if (response.status === 401 || response.status === 403) throw new AuthFailure('invalid_credentials');
                if (response.status === 429) return result('rate_limited');
                if (response.status !== 200 || !response.ok) return result('unavailable');
                const value = await readBoundedJson(response,child.signal,16384);
                if (child.signal.aborted) return result(parent.aborted || external?.aborted ? 'cancelled' : 'unavailable');
                return result(value === true ? 'complete' : value === false ? 'not_confirmed' : 'unavailable');
              } finally { discard(); }
            } catch (error) {
              if (error instanceof AuthFailure) throw error;
              return result(parent.aborted || external?.aborted ? 'cancelled' : 'unavailable');
            }
          };
          return await Promise.race([operation(),interrupted]);
        } finally { clearTimeout(timer); if (stop) { parent.removeEventListener('abort',stop); external?.removeEventListener('abort',stop); } child.abort(); }
      });
    } catch (error) {
      return result(error instanceof AuthFailure && error.code === 'invalid_credentials' ? 'locked' : error instanceof AuthFailure && error.code === 'cancelled' ? 'cancelled' : 'unavailable');
    } finally { pending = false; }
  }
  return Object.freeze({ pause:(input:unknown,signal?:AbortSignal)=>run('pause',input,signal),remove:(input:unknown,signal?:AbortSignal)=>run('remove',input,signal) });
}
