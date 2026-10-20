import { resolveBackendExecutionMode, type BackendExecutionPolicy } from './execution-mode.ts';
import { readPreparedAccountConfiguration, type AccountConfigurationReader } from './account-configuration.ts';
import { createAccountNetworkTransport } from './account-network.ts';
import { createSupabasePorts } from './supabase-rest.ts';
import { createPendingInventoryPorts } from './pending-inventory-rest.ts';
import { createPluggyInventoryPort } from './pluggy-auth.ts';
import { createInventoryDiscovery } from './inventory-discovery.ts';
import { createInventoryHandler } from './inventory-handler.ts';
type Transport = (url: string, init: RequestInit) => Promise<Response>;
const response = (status: number, error: string) => new Response(JSON.stringify({ error }), { status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', Pragma: 'no-cache', 'X-Content-Type-Options': 'nosniff' } });
/** Guarded boot capability; the deployed bridge does not import this. */
export function createInventoryBackendRuntime(read: AccountConfigurationReader, options: BackendExecutionPolicy & { transport?: Transport } = {}) {
  const disabled = Object.freeze({ handler: async (_request: Request) => response(503, 'unavailable'), close() {} });
  const mode = resolveBackendExecutionMode(options); if (mode === null) return disabled;
  let provider: ReturnType<typeof createPluggyInventoryPort> | undefined;
  let coordinator: ReturnType<typeof createInventoryDiscovery> | undefined;
  let http: ReturnType<typeof createInventoryHandler> | undefined;
  try {
    const configuration = readPreparedAccountConfiguration(read, 'ORBE_INVENTORY_DISCOVERY_ENABLED');
    if (!configuration) return disabled;
    const network = options.transport ?? (mode === 'live' ? ((url: string, init: RequestInit) => globalThis.fetch(url, init)) : undefined);
    if (typeof network !== 'function') return disabled;
    const { origin, publishableKey, secretKey, clientId, clientSecret } = configuration;
    const transport = createAccountNetworkTransport({ enabled: true, privateDataApproved: true, network });
    const auth = createSupabasePorts({ origin, publishableKey }, transport);
    const pending = createPendingInventoryPorts(() => ({ origin, secretKey }), { enabled: true, mode, privateDataApproved: true, transport });
    provider = createPluggyInventoryPort(() => ({ clientId, clientSecret }), { enabled: true, mode, privateDataApproved: true, transport });
    coordinator = createInventoryDiscovery({ authenticate: auth.authenticate, resolve: pending.resolve, acquire: pending.acquire, check: pending.check, commit: pending.commit, readInventory: provider.readInventory }, { enabled: true, privateDataApproved: true, mode });
    http = createInventoryHandler(coordinator, { enabled: true, mode, privateDataApproved: true });
    const handler = http.handler;
    let closed = false;
    return Object.freeze({
      async handler(request: Request) {
        if (closed) return response(503, 'unavailable');
        try {
          const url = new URL(request.url);
          if (url.pathname !== '/orbe-bridge/accounts/discover') return response(404, 'not_found');
          url.pathname = '/accounts/discover';
          return await handler(new Request(url, request));
        } catch { return response(503, 'unavailable'); }
      },
      close() { if (closed) return; closed = true; http?.close(); coordinator?.close(); provider?.close(); },
    });
  } catch { http?.close(); coordinator?.close(); provider?.close(); return disabled; }
}
