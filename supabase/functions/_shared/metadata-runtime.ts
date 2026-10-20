import { createBridgeHandler } from './bridge.ts';
import { createSupabasePorts } from './supabase-rest.ts';

type ConfigurationName = 'ORBE_METADATA_ENABLED' | 'SUPABASE_URL' | 'ORBE_PUBLISHABLE_KEY';
type ConfigurationReader = (name: ConfigurationName) => unknown;
type Transport = (input: string, init: RequestInit) => Promise<Response>;

// Boot composition only. No provider, privileged credentials, or financial gate.
export function createMetadataRuntime(read: ConfigurationReader, transport: Transport): (request: Request) => Promise<Response> {
  const disabled = createBridgeHandler({
    async authenticate() { throw new Error('metadata_disabled'); },
    async listConnections() { throw new Error('metadata_disabled'); },
  }, { enabled: false });
  try {
    if (read('ORBE_METADATA_ENABLED') !== 'true') return disabled;
    const origin = read('SUPABASE_URL');
    const publishableKey = read('ORBE_PUBLISHABLE_KEY');
    if (typeof origin !== 'string' || typeof publishableKey !== 'string' || typeof transport !== 'function') return disabled;
    return createBridgeHandler(createSupabasePorts({ origin, publishableKey }, transport), { enabled: true });
  } catch {
    return disabled;
  }
}
