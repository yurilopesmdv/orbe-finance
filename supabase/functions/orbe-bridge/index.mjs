import { createFinancialRuntime } from '../_shared/financial-runtime.ts';

// Independent owner release switch; every product still requires its own flag and authorization.
const liveApproved = Deno.env.get('ORBE_OWNER_LIVE_RELEASE') === 'true';
Deno.serve(createFinancialRuntime(name => Deno.env.get(name), { liveApproved }).handler);
