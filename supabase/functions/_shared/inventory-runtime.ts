import { readPreparedAccountConfiguration, type AccountConfigurationReader } from './account-configuration.ts';
import { createAccountNetworkTransport } from './account-network.ts';
import { createSupabasePorts } from './supabase-rest.ts';
import { createPendingInventoryPorts } from './pending-inventory-rest.ts';
import { createPluggyInventoryPort } from './pluggy-auth.ts';
import { createInventoryDiscovery } from './inventory-discovery.ts';
import { createInventoryHandler } from './inventory-handler.ts';
type Transport = (url: string, init: RequestInit) => Promise<Response>;
const response = (status: number, error: string) => new Response(JSON.stringify({ error }), { status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', Pragma: 'no-cache', 'X-Content-Type-Options': 'nosniff' } });
/** Injected prepared composition only. The deployed bridge does not import this. */
export function createInventoryBackendRuntime(read: AccountConfigurationReader, options: { fixtureOnly?: boolean; transport?: Transport } = {}) {
  const disabled = Object.freeze({ handler: async (_request: Request) => response(503, 'unavailable'), close() {} });
  if (options.fixtureOnly !== true) return disabled;
  let provider: ReturnType<typeof createPluggyInventoryPort> | undefined;
  let coordinator: ReturnType<typeof createInventoryDiscovery> | undefined;
  let http: ReturnType<typeof createInventoryHandler> | undefined;
  try {
    const configuration = readPreparedAccountConfiguration(read, 'ORBE_INVENTORY_DISCOVERY_ENABLED');
    if (!configuration) return disabled;
    const network = options.transport;
    if (typeof network !== 'function') return disabled;
    const { origin, publishableKey, secretKey, clientId, clientSecret } = configuration;
    const transport = createAccountNetworkTransport({ enabled: true, privateDataApproved: true, network });
    const auth = createSupabasePorts({ origin, publishableKey }, transport);
    const pending = createPendingInventoryPorts(() => ({ origin, secretKey }), { enabled: true, fixtureOnly: true, transport });
    provider = createPluggyInventoryPort(() => ({ clientId, clientSecret }), { enabled: true, fixtureOnly: true, transport });
    coordinator = createInventoryDiscovery({ authenticate: auth.authenticate, resolve: pending.resolve, acquire: pending.acquire, check: pending.check, commit: pending.commit, readInventory: provider.readInventory }, { enabled: true, privateDataApproved: true, fixtureOnly: true });
    http = createInventoryHandler(coordinator, { enabled: true, fixtureOnly: true });
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
