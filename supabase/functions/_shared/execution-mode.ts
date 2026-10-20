export type ExecutionMode = 'fixture' | 'live';
export interface ExecutionPolicy { mode?: ExecutionMode; privateDataApproved?: boolean; fixtureOnly?: boolean }
/** Capability selector only; live-data approval must also be enforced by the boot. */
export function resolveExecutionMode(policy: ExecutionPolicy): ExecutionMode | null {
  if (policy.fixtureOnly === true) return policy.mode === undefined || policy.mode === 'fixture' ? 'fixture' : null;
  if (policy.mode === 'fixture') return 'fixture';
  if (policy.mode === 'live' && policy.privateDataApproved === true) return 'live';
  return null;
}
