import type { BridgeClock } from './bridge.ts';
import { readJsonResponse } from './http-json.ts';
export interface ReadScope { connectionId: string; ownerId: string; revision: number; product?: ReadProduct }
export type ReadProduct = 'accounts' | 'transactions' | 'investments' | 'reserves';
export type ReadOutcome = 'success' | 'failed' | 'cancelled';
export type AcquireResult =
  | Readonly<{ status: 'disabled' | 'unavailable' | 'busy' }>
  | Readonly<{ status: 'cooldown'; nextReadAt: string }>
  | Readonly<{ status: 'acquired'; leaseId: string; revision: number; expiresAt: string; nextReadAt: string }>;
export interface LeasePorts {
  acquire(scope: ReadScope, signal: AbortSignal): Promise<AcquireResult>;
  check(scope: ReadScope, leaseId: string, product: ReadProduct, signal: AbortSignal): Promise<boolean>;
  finish(scope: ReadScope, leaseId: string, outcome: ReadOutcome, signal: AbortSignal): Promise<boolean>;
}
type Configuration = { origin: string; secretKey: string };
type Transport = (url: string, init: RequestInit) => Promise<Response>;
const endpoints = Object.freeze({ begin: 'orbe_begin_connection_read', product: 'orbe_begin_product_read', check: 'orbe_check_connection_read', finish: 'orbe_finish_connection_read' });
const products = ['accounts', 'transactions', 'investments', 'reserves'];
const outcomes = ['success', 'failed', 'cancelled'];
const object = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value);
const uuid = (value: unknown): value is string => typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(value);
function unavailable(): never { throw new Error('lease_unavailable'); }
function active(signal: AbortSignal) { if (signal.aborted) unavailable(); }
function scope(input: ReadScope): Readonly<ReadScope> {
  if (!object(input) || !['connectionId', 'ownerId', 'revision'].every(key => Object.hasOwn(input, key)) || !uuid(input.connectionId) || !uuid(input.ownerId) || !Number.isSafeInteger(input.revision) || input.revision < 1) throw new Error('lease_request_invalid');
  if(input.product!==undefined&&!['accounts','transactions','investments'].includes(input.product))throw Error('lease_request_invalid');
  return Object.freeze({ connectionId: input.connectionId, ownerId: input.ownerId, revision: input.revision, ...(input.product?{product:input.product}:{}) });
}
function instant(value: unknown): string {
  if (typeof value !== 'string') return unavailable();
  const match = /^\d{4}-\d{2}-\d{2}T(\d{2}):(\d{2}):(\d{2})(?:\.\d{1,6})?(?:Z|[+-](\d{2}):(\d{2}))$/.exec(value);
  const date = new Date(value.slice(0, 10) + 'T00:00:00Z');
  if (!match || !Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== value.slice(0, 10) || Number(match[1]) > 23 || Number(match[2]) > 59 || Number(match[3]) > 59 || match[4] !== undefined && (Number(match[4]) > 14 || Number(match[5]) > 59 || Number(match[4]) === 14 && Number(match[5]) !== 0) || !Number.isFinite(Date.parse(value))) return unavailable();
  return new Date(value).toISOString();
}
export function parseLeaseGrant(raw: unknown, expected: ReadScope, now: number): AcquireResult {
  if (!object(raw) || !Number.isSafeInteger(now)) return unavailable();
  if (raw.status === 'busy' || raw.status === 'unavailable') return Object.freeze({ status: raw.status });
  if (raw.status === 'cooldown') {
    const nextReadAt = instant(raw.next_read_at), next = Date.parse(nextReadAt);
    if (next <= now || next > now + 960000) return unavailable();
    return Object.freeze({ status: 'cooldown', nextReadAt });
  }
  if (raw.status !== 'acquired' || !uuid(raw.lease_id) || raw.revision !== expected.revision) return unavailable();
  const expiresAt = instant(raw.lease_expires_at), nextReadAt = instant(raw.next_read_at);
  const expiration = Date.parse(expiresAt), next = Date.parse(nextReadAt);
  if (expiration <= now || expiration > now + 180000 || next - expiration !== (expected.product ? -90000 : 780000)) return unavailable();
  return Object.freeze({ status: 'acquired', leaseId: raw.lease_id, revision: expected.revision, expiresAt, nextReadAt });
}
export function createLeasePorts(resolveConfig: () => Configuration, options: { enabled?: boolean; privateDataApproved?: boolean; transport?: Transport; clock?: BridgeClock } = {}): Readonly<LeasePorts> {
  if (options.enabled !== true || options.privateDataApproved !== true) return Object.freeze({
    acquire: async () => Object.freeze({ status: 'disabled' as const }), check: async () => false, finish: async () => false,
  });
  const configuration = (() => {
    try {
      const { origin, secretKey } = resolveConfig();
      if (typeof origin !== 'string' || typeof secretKey !== 'string' || !/^https:\/\/[a-z]{20}\.supabase\.co$/.test(origin) || !/^sb_secret_[A-Za-z0-9_-]{1,512}$/.test(secretKey)) throw new Error();
      return { origin, secretKey };
    } catch { throw new Error('lease_configuration_invalid'); }
  })();
  const { origin, secretKey } = configuration;
  const transport = options.transport ?? fetch;
  const clock: BridgeClock = options.clock ?? { now: () => Date.now(), setTimer: (callback, ms) => setTimeout(callback, ms), clearTimer: handle => clearTimeout(handle as ReturnType<typeof setTimeout>) };
  async function timed<T>(parent: AbortSignal, work: (signal: AbortSignal) => Promise<T>): Promise<T> {
    active(parent); const controller = new AbortController();
    let timer: unknown, scheduled = false, abort: (() => void) | undefined;
    try {
      const stop = new Promise<never>((_, reject) => {
        abort = () => { controller.abort(); reject(new Error('lease_unavailable')); };
        parent.addEventListener('abort', abort, { once: true });
        timer = clock.setTimer(abort, 20000); scheduled = true;
      });
      return await Promise.race([stop, (async () => { active(controller.signal); return work(controller.signal); })()]);
    } catch { return unavailable(); }
    finally { if (abort) parent.removeEventListener('abort', abort); if (scheduled) clock.clearTimer(timer); controller.abort(); }
  }
  async function rpc(endpoint: keyof typeof endpoints, body: unknown, signal: AbortSignal): Promise<unknown> {
    active(signal);
    const response = await transport(origin + '/rest/v1/rpc/' + endpoints[endpoint], {
      method: 'POST', body: JSON.stringify(body), headers: { apikey: secretKey, Accept: 'application/json', 'Content-Type': 'application/json' },
      signal, redirect: 'error', credentials: 'omit', cache: 'no-store',
    });
    active(signal);
    if (response.status !== 200 || response.redirected) { void response.body?.cancel().catch(() => {}); return unavailable(); }
    const value = await readJsonResponse(response, signal, 16384); active(signal); return value;
  }
  const body = (value: ReadScope) => ({ p_connection_id: value.connectionId, p_owner_id: value.ownerId });
  return Object.freeze({
    async acquire(input: ReadScope, signal: AbortSignal) {
      const value = scope(input);
      return timed(signal, async child => parseLeaseGrant(await rpc(value.product?'product':'begin', { ...body(value), p_expected_revision: value.revision, ...(value.product?{p_product:value.product}:{}) }, child), value, clock.now()));
    },
    async check(input: ReadScope, leaseId: string, product: ReadProduct, signal: AbortSignal) {
      const value = scope(input); if (!uuid(leaseId) || !products.includes(product)) throw new Error('lease_request_invalid');
      return timed(signal, async child => {
        const result = await rpc('check', { ...body(value), p_revision: value.revision, p_lease_id: leaseId, p_product: product }, child);
        if (typeof result !== 'boolean') return unavailable(); return result;
      });
    },
    async finish(input: ReadScope, leaseId: string, outcome: ReadOutcome, signal: AbortSignal) {
      const value = scope(input); if (!uuid(leaseId) || !outcomes.includes(outcome)) throw new Error('lease_request_invalid');
      return timed(signal, async child => {
        const result = await rpc('finish', { ...body(value), p_revision: value.revision, p_lease_id: leaseId, p_outcome: outcome }, child);
        if (typeof result !== 'boolean') return unavailable(); return result;
      });
    },
  });
}
