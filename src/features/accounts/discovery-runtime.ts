import type { SessionAccess } from '../sync/session-cache.ts';
import type { HttpSession, SessionTransport } from '../../lib/session-json.ts';
import type { AuthConfig } from '../auth/gateway.ts';
import type { ScreenProtectionModel } from '../privacy/screen-protection.ts';
import { createConnectionStatusReader } from '../connections/status.ts';
import { createDiscoveryGateway } from './discovery-gateway.ts';
import { createDiscoveryController } from './discovery-controller.ts';
export function createDiscoveryRuntime(session: HttpSession & SessionAccess, protection: Pick<ScreenProtectionModel, 'getSnapshot' | 'subscribe'>, config: () => AuthConfig | null, transport: SessionTransport, policy: { inventoryDiscoveryEnabled?: boolean; liveIntegrationEnabled?: boolean; privateFinancialDataApproved?: boolean } = {}) {
  if (policy.inventoryDiscoveryEnabled !== true || policy.liveIntegrationEnabled !== true || policy.privateFinancialDataApproved !== true) return Object.freeze({ kind: 'disabled' as const });
  try {
    const reader = createConnectionStatusReader(session, config, transport, { enabled: true });
    const gateway = createDiscoveryGateway(session, config, transport, { enabled: true, privateDataApproved: true });
    const controller = createDiscoveryController(session, protection, { status: signal => reader.read(signal), discover: gateway.discover }, { enabled: true, privateDataApproved: true });
    if (controller.kind !== 'ready') throw Error('discovery_access_unavailable');
    return Object.freeze({ kind: 'ready' as const, controller, close: controller.close });
  } catch { return Object.freeze({ kind: 'unavailable' as const }); }
}
