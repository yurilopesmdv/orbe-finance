import { readJsonResponse as jsonResponse } from './http-json.ts';
import type { BridgePorts } from './bridge.ts';

type Configuration = { origin: string; publishableKey: string };
type Transport = (input: string, init: RequestInit) => Promise<Response>;
const uuid = (value: unknown): value is string => typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(value);
const object = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value);
function unavailable(): never { throw new Error('bridge_upstream_unavailable'); }
function active(signal: AbortSignal): void { if (signal.aborted) unavailable(); }

// Parsing is only a structural/expiry precheck. Remote Auth and RPC verify trust.
function claims(token: string, origin: string, now: number): { subject: string; expiresAt: number } | null {
  if (token.length > 8192 || !/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(token)) return null;
  try {
    const encoded = token.split('.')[1]!;
    const raw = atob(encoded.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - encoded.length % 4) % 4));
    const payload: unknown = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(Uint8Array.from(raw, character => character.charCodeAt(0))));
    if (!object(payload) || !uuid(payload.sub) || payload.iss !== origin + '/auth/v1' || payload.aud !== 'authenticated' || payload.role !== 'authenticated' || payload.is_anonymous === true || !Number.isSafeInteger(payload.exp)) return null;
    const expiresAt = (payload.exp as number) * 1000;
    if (!Number.isSafeInteger(expiresAt) || expiresAt <= now) return null;
    return { subject: payload.sub, expiresAt };
  } catch { return null; }
}
const columns = 'id,owner_id,institution,state,revision,accounts_available,transactions_available,investments_available,reserves_available,open_finance_verified_at,authorization_expires_at,source_updated_at,last_read_at';
const endpoints = Object.freeze({
  user: '/auth/v1/user', owner: '/rest/v1/rpc/orbe_is_owner',
  connections: '/rest/v1/orbe_connections?select=' + columns + '&order=created_at.desc,id.desc&limit=101',
});

export function createSupabasePorts(config: Configuration, transport: Transport = fetch, now: () => number = Date.now): BridgePorts {
  // Snapshot configuration; a later mutation must not change the destination.
  const { origin, publishableKey } = config;
  if (typeof origin !== 'string' || typeof publishableKey !== 'string' || !/^https:\/\/[a-z]{20}\.supabase\.co$/.test(origin) || !/^sb_publishable_[A-Za-z0-9_-]+$/.test(publishableKey)) throw new Error('bridge_configuration_invalid');
  async function request(endpoint: keyof typeof endpoints, token: string, signal: AbortSignal): Promise<Response> {
    active(signal);
    try {
      const rpc = endpoint === 'owner';
      const response = await transport(origin + endpoints[endpoint], {
        method: rpc ? 'POST' : 'GET', body: rpc ? '{}' : undefined,
        headers: { apikey: publishableKey, Authorization: 'Bearer ' + token, Accept: 'application/json', ...(rpc ? { 'Content-Type': 'application/json' } : {}) },
        signal, redirect: 'error', credentials: 'omit', cache: 'no-store',
      });
      active(signal);
      if (response.redirected || response.status >= 300 && response.status < 400) { void response.body?.cancel().catch(() => {}); unavailable(); }
      return response;
    } catch { return unavailable(); }
  }
  return {
    async authenticate(token, signal) {
      try {
        active(signal); const decoded = claims(token, origin, now()); if (!decoded) return null;
        const response = await request('user', token, signal);
        if ([401, 403].includes(response.status)) { void response.body?.cancel().catch(() => {}); return null; }
        if (response.status !== 200) { void response.body?.cancel().catch(() => {}); unavailable(); }
        const user = await jsonResponse(response, signal); active(signal);
        if (!object(user) || user.id !== decoded.subject || user.is_anonymous !== false || decoded.expiresAt <= now()) return null;
        const owner = await request('owner', token, signal);
        if (owner.status !== 200) { void owner.body?.cancel().catch(() => {}); unavailable(); }
        const allowed = await jsonResponse(owner, signal); active(signal);
        if (typeof allowed !== 'boolean') unavailable();
        if (decoded.expiresAt <= now()) return null;
        return { subject: decoded.subject, isOwner: allowed, expiresAt: decoded.expiresAt };
      } catch { return unavailable(); }
    },
    async listConnections(subject, signal, token) {
      try {
        active(signal); const decoded = claims(token, origin, now());
        if (!decoded || decoded.subject !== subject) unavailable();
        const response = await request('connections', token, signal);
        if (response.status !== 200) { void response.body?.cancel().catch(() => {}); unavailable(); }
        const rows = await jsonResponse(response, signal); active(signal);
        if (decoded.expiresAt <= now() || !Array.isArray(rows)) unavailable();
        return rows;
      } catch { return unavailable(); }
    },
  };
}
