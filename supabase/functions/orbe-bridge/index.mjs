import { createFinancialRuntime } from '../_shared/financial-runtime.ts';

// Financial release is disabled in code, independently of environment flags.
Deno.serve(createFinancialRuntime(name => Deno.env.get(name), { liveApproved: false }).handler);
