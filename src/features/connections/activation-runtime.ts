import type { SessionAccess } from '../sync/session-cache.ts';
import type { HttpSession, SessionTransport } from '../../lib/session-json.ts';
import type { AuthConfig } from '../auth/gateway.ts';
import type { ScreenProtectionModel } from '../privacy/screen-protection.ts';
import { createConnectionStatusReader } from '../connections/status.ts';
import { createActivationGateway } from './activation-gateway.ts';
import { createActivationController } from './activation-controller.ts';
export function createActivationRuntime(session: HttpSession & SessionAccess, protection: Pick<ScreenProtectionModel, 'getSnapshot' | 'subscribe'>, config: () => AuthConfig | null, transport: SessionTransport, policy: { connectionActivationEnabled?: boolean; liveIntegrationEnabled?: boolean; privateFinancialDataApproved?: boolean } = {}) {
  if (policy.connectionActivationEnabled !== true || policy.liveIntegrationEnabled !== true || policy.privateFinancialDataApproved !== true) return Object.freeze({ kind: 'disabled' as const });
  try {
    const reader = createConnectionStatusReader(session, config, transport, { enabled: true });
    const gateway = createActivationGateway(session, config, transport, { enabled: true, privateDataApproved: true });
    const controller = createActivationController(session, protection, { status: signal => reader.read(signal), activate: gateway.activate }, { enabled: true, privateDataApproved: true });
    if (controller.kind !== 'ready') throw Error('discovery_access_unavailable');
    return Object.freeze({ kind: 'ready' as const, controller, close: controller.close });
  } catch { return Object.freeze({ kind: 'unavailable' as const }); }
}
