import { AuthFailure, type AuthConfig } from '../auth/gateway.ts';
import { createSessionJsonClient, type HttpSession, type SessionTransport } from '../../lib/session-json.ts';
const ORIGIN = 'https://vvaufaoahotmaocrcyij.supabase.co';
const object = (value: unknown): value is Record<string, unknown> => value !== null && typeof value === 'object' && !Array.isArray(value);
const uuid = (value: unknown): value is string => typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(value);
export type DiscoveryGatewayResult = Readonly<{ status: 'complete'; registeredAccounts: number }> | Readonly<{ status: 'disabled' | 'locked' | 'cancelled' | 'rate_limited' | 'unavailable' }>;
export function createDiscoveryGateway(session: HttpSession, resolve: () => AuthConfig | null, transport: SessionTransport, policy: { enabled?: boolean; privateDataApproved?: boolean; timeoutMs?: number } = {}) {
  if (policy.enabled !== true || policy.privateDataApproved !== true) return Object.freeze({ discover: async (_input: unknown, _signal: AbortSignal): Promise<DiscoveryGatewayResult> => Object.freeze({ status: 'disabled' }) });
  const request = createSessionJsonClient(session, () => { const config = resolve(); if (!config || config.origin !== ORIGIN) throw new AuthFailure('invalid_configuration'); return config; }, transport, policy.timeoutMs ?? 120000);
  return Object.freeze({
    async discover(input: { connectionId: string; revision: number }, signal: AbortSignal): Promise<DiscoveryGatewayResult> {
      try {
        if (!object(input) || Object.keys(input).sort().join(',') !== 'connectionId,revision' || !uuid(input.connectionId) || !Number.isSafeInteger(input.revision) || input.revision < 1) throw new AuthFailure('unavailable');
        const result = await request('discover', { connectionId: input.connectionId, revision: input.revision }, signal);
        if (!object(result) || Object.keys(result).sort().join(',') !== 'registeredAccounts,status' || result.status !== 'complete' || !Number.isSafeInteger(result.registeredAccounts) || (result.registeredAccounts as number) < 0 || (result.registeredAccounts as number) > 1000) throw new AuthFailure('unavailable');
        return Object.freeze({ status: 'complete', registeredAccounts: result.registeredAccounts as number });
      } catch (error) {
        const status = error instanceof AuthFailure ? error.code === 'invalid_credentials' ? 'locked' : error.code === 'cancelled' ? 'cancelled' : error.code === 'rate_limited' ? 'rate_limited' : 'unavailable' : 'unavailable';
        return Object.freeze({ status });
      }
    },
  });
}
