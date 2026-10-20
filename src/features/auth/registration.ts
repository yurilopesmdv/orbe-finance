import { AuthFailure } from './gateway.ts';
interface SignupGateway { requestSignup(email: string, password: string, signal?: AbortSignal): Promise<void> }
/** Prepared for a future admission policy; the current runtime passes false. */
export function createRegistrationPort(enabled: boolean, gatewayFactory: () => SignupGateway) {
  const admitted = enabled === true;
  let gateway: SignupGateway | undefined;
  return Object.freeze({
    enabled: admitted,
    async register(email: string, password: string, signal?: AbortSignal): Promise<void> {
      // Off means no configuration, input processing, network or gateway construction.
      if (!admitted) throw new AuthFailure('invalid_configuration');
      if (signal?.aborted) throw new AuthFailure('cancelled');
      gateway ??= gatewayFactory();
      await gateway.requestSignup(email, password, signal);
    },
  });
}
