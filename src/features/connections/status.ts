import { AuthFailure, type AuthConfig } from '../auth/gateway.ts';
import type { SessionModel } from '../auth/session.ts';
import { readBoundedJson } from '../../lib/bounded-json.ts';
export interface ConnectionMetadata {
  readonly id: string;
  readonly institution: 'bradesco' | 'mercado-pago' | 'inter' | 'nubank';
  readonly revision: number;
  readonly state: 'pending' | 'active' | 'paused' | 'renewal_required' | 'revoked' | 'error';
  readonly capabilities: Readonly<Record<'accounts' | 'transactions' | 'investments' | 'reserves', boolean | null>>;
  readonly openFinanceVerifiedAt: string | null;
  readonly proxyConsentExpiresAt: string | null;
  readonly bankConsentExpiresAt: string | null;
  readonly authorizationExpiresAt: string | null;
  readonly sourceUpdatedAt: string | null;
  readonly lastReadAt: string | null;
}
export type StatusResult = Readonly<{ status: 'complete'; connections: readonly Readonly<ConnectionMetadata>[] }> |
  Readonly<{ status: 'disabled' | 'locked' | 'busy' | 'cancelled' | 'unavailable' | 'rate_limited' }>;
type Session = Pick<SessionModel, 'read' | 'assertUnlocked' | 'getPublicOrigin'>;
type Transport = (url: string, init: RequestInit) => Promise<Pick<Response, 'ok' | 'status' | 'redirected' | 'headers' | 'body'>>;
const fail = (status: Exclude<StatusResult['status'], 'complete'>): StatusResult => Object.freeze({ status });
const object = (value: unknown): value is Record<string, unknown> => !!value && typeof value === 'object' && !Array.isArray(value);
function invalid(): never { throw new Error('connection_status_invalid'); }
function date(value: unknown): string | null {
  if (value === null) return null;
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value) || Number(value.slice(0, 4)) < 1) return invalid();
  const timestamp = new Date(value);
  if (!Number.isFinite(timestamp.getTime()) || timestamp.toISOString() !== value) return invalid();
  return value;
}
function project(value: unknown): readonly Readonly<ConnectionMetadata>[] {
  if (!object(value) || !Object.hasOwn(value, 'connections') || !Array.isArray(value.connections) || value.connections.length > 100) return invalid();
  const seen = new Set<string>();
  return Object.freeze(value.connections.map(raw => {
    if (!object(raw)) return invalid();
    const fields = ['id', 'institution', 'revision', 'state', 'capabilities', 'openFinanceVerifiedAt', 'proxyConsentExpiresAt', 'bankConsentExpiresAt', 'authorizationExpiresAt', 'sourceUpdatedAt', 'lastReadAt'];
    if (fields.some(key => !Object.hasOwn(raw, key))) return invalid();
    const { id, institution, revision, state, capabilities } = raw;
    if (typeof id !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(id) || seen.has(id) || !['bradesco', 'mercado-pago', 'inter', 'nubank'].includes(institution as string) || !['pending', 'active', 'paused', 'renewal_required', 'revoked', 'error'].includes(state as string) || typeof revision !== 'number' || !Number.isSafeInteger(revision) || revision < 1 || !object(capabilities)) return invalid();
    seen.add(id);
    const projectedCapabilities = {} as Record<keyof ConnectionMetadata['capabilities'], boolean | null>;
    for (const product of ['accounts', 'transactions', 'investments', 'reserves'] as const) {
      if (!Object.hasOwn(capabilities, product) || capabilities[product] !== null && typeof capabilities[product] !== 'boolean') return invalid();
      projectedCapabilities[product] = capabilities[product] as boolean | null;
    }
    const openFinanceVerifiedAt = date(raw.openFinanceVerifiedAt), proxyConsentExpiresAt = date(raw.proxyConsentExpiresAt), bankConsentExpiresAt = date(raw.bankConsentExpiresAt);
    const authorizationExpiresAt = [proxyConsentExpiresAt, bankConsentExpiresAt].filter((entry): entry is string => entry !== null).sort()[0] ?? null;
    if (date(raw.authorizationExpiresAt) !== authorizationExpiresAt || state === 'active' && openFinanceVerifiedAt === null) return invalid();
    return Object.freeze({ id, institution: institution as ConnectionMetadata['institution'], revision, state: state as ConnectionMetadata['state'], capabilities: Object.freeze(projectedCapabilities), openFinanceVerifiedAt, proxyConsentExpiresAt, bankConsentExpiresAt, authorizationExpiresAt, sourceUpdatedAt: date(raw.sourceUpdatedAt), lastReadAt: date(raw.lastReadAt) });
  }));
}

export function createConnectionStatusReader(session: Session, resolvePublicConfig: () => AuthConfig | null, transport: Transport, policy: { enabled?: boolean; timeoutMs?: number } = {}) {
  const enabled = policy.enabled === true;
  const timeoutMs = policy.timeoutMs ?? 20000;
  let pending = false;
  async function read(external?: AbortSignal): Promise<StatusResult> {
    if (!enabled) return fail('disabled');
    try { if (session.assertUnlocked() !== undefined) return fail('locked'); } catch { return fail('locked'); }
    if (pending) return fail('busy');
    if (external?.aborted) return fail('cancelled');
    pending = true;
    try {
      const expectedOrigin = session.getPublicOrigin();
      return await session.read<StatusResult>(async (token, parent) => {
        if (parent.aborted || external?.aborted) return fail('cancelled');
        let origin: string, publishableKey: string;
        try {
          const config = resolvePublicConfig();
          if (!config || !Object.hasOwn(config, 'origin') || !Object.hasOwn(config, 'publishableKey')) return fail('unavailable');
          const url = config.origin, key = config.publishableKey;
          if (typeof url !== 'string' || url !== expectedOrigin || !/^https:\/\/[a-z]{20}\.supabase\.co$/.test(url) || typeof key !== 'string' || !/^sb_publishable_[A-Za-z0-9_-]+$/.test(key) || typeof transport !== 'function' || !Number.isSafeInteger(timeoutMs) || timeoutMs < 1 || timeoutMs > 20000) return fail('unavailable');
          origin = url; publishableKey = key;
        } catch { return fail('unavailable'); }
        const child = new AbortController(); let stop: (() => void) | undefined, timer: ReturnType<typeof setTimeout> | undefined;
        const interrupted = new Promise<StatusResult>(resolve => {
          stop = () => { child.abort(); resolve(fail('cancelled')); };
          parent.addEventListener('abort', stop, { once: true }); external?.addEventListener('abort', stop, { once: true });
          timer = setTimeout(() => { child.abort(); resolve(fail('unavailable')); }, timeoutMs);
        });
        try {
          if (parent.aborted || external?.aborted) return fail('cancelled');
          const operation = async (): Promise<StatusResult> => {
            try {
              const response = await transport(origin + '/functions/v1/orbe-metadata/connections/status', {
                method: 'POST', headers: { apikey: publishableKey, Authorization: 'Bearer ' + token, 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }, body: '{}',
                signal: child.signal, credentials: 'omit', redirect: 'error', cache: 'no-store',
              });
              const discard = () => { try { void response.body?.cancel().catch(() => {}); } catch {} };
              try {
                if (child.signal.aborted) return fail(parent.aborted || external?.aborted ? 'cancelled' : 'unavailable');
                if (response.redirected) return fail('unavailable');
                if (response.status === 401 || response.status === 403) throw new AuthFailure('invalid_credentials');
                if (response.status === 429) return fail('rate_limited');
                if (response.status !== 200 || !response.ok) return fail('unavailable');
                const value = await readBoundedJson(response, child.signal, 131072);
                if (child.signal.aborted) return fail(parent.aborted || external?.aborted ? 'cancelled' : 'unavailable');
                return Object.freeze({ status: 'complete', connections: project(value) });
              } finally { discard(); }
            } catch (error) {
              if (error instanceof AuthFailure) throw error;
              return fail(parent.aborted || external?.aborted ? 'cancelled' : 'unavailable');
            }
          };
          return await Promise.race([operation(), interrupted]);
        } finally { clearTimeout(timer); if (stop) { parent.removeEventListener('abort', stop); external?.removeEventListener('abort', stop); } child.abort(); }
      });
    } catch (error) {
      return fail(error instanceof AuthFailure && error.code === 'invalid_credentials' ? 'locked' : error instanceof AuthFailure && error.code === 'cancelled' ? 'cancelled' : 'unavailable');
    } finally { pending = false; }
  }
  return Object.freeze({ read });
}
