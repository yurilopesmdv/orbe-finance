import { createAccountBackendRuntime } from './account-runtime.ts';
import { createInventoryBackendRuntime } from './inventory-runtime.ts';
import type { AccountConfigurationReader } from './account-configuration.ts';
type Transport = (url: string, init: RequestInit) => Promise<Response>;
const response = (status: number, error: string) => new Response(JSON.stringify({ error }), { status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', Pragma: 'no-cache', 'X-Content-Type-Options': 'nosniff' } });
/** Code-release switch remains false in the deployed entrypoint. */
export function createFinancialRuntime(read: AccountConfigurationReader, options: { liveApproved?: boolean; transport?: Transport } = {}) {
  const disabled = Object.freeze({ handler: async (_request: Request) => response(503, 'unavailable'), close() {} });
  if (options.liveApproved !== true) return disabled;
  try {
    if (read('ORBE_BRIDGE_ENABLED') !== 'true' || read('ORBE_PRIVATE_DATA_APPROVED') !== 'true' || (read('ORBE_ACCOUNT_READS_ENABLED') !== 'true' && read('ORBE_INVENTORY_DISCOVERY_ENABLED') !== 'true')) return disabled;
    const policy = { mode: 'live' as const, liveApproved: true, transport: options.transport };
    const accounts = createAccountBackendRuntime(read, policy), inventory = createInventoryBackendRuntime(read, policy);
    let closed = false;
    return Object.freeze({
      async handler(request: Request) {
        if (closed) return response(503, 'unavailable');
        try {
          const path = new URL(request.url).pathname;
          if (path === '/orbe-bridge/accounts/discover') return await inventory.handler(request);
          if (['/orbe-bridge/accounts/read', '/orbe-bridge/reads/acquire', '/orbe-bridge/reads/finalize'].includes(path)) return await accounts.handler(request);
          return response(404, 'not_found');
        } catch { return response(503, 'unavailable'); }
      },
      close() { if (closed) return; closed = true; accounts.close(); inventory.close(); },
    });
  } catch { return disabled; }
}
