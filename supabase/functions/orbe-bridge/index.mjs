import { createBridgeHandler } from '../_shared/bridge.ts';

// This deployed development entrypoint cannot be enabled through environment.
const ports = {
  async authenticate() { throw new Error('bridge_disabled'); },
  async listConnections() { throw new Error('bridge_disabled'); },
};
Deno.serve(createBridgeHandler(ports, { enabled: false }));
