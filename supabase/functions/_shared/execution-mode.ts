export type ExecutionMode = 'fixture' | 'live';
export interface ExecutionPolicy { mode?: ExecutionMode; privateDataApproved?: boolean; fixtureOnly?: boolean }
/** Capability selector only; live-data approval must also be enforced by the boot. */
export function resolveExecutionMode(policy: ExecutionPolicy): ExecutionMode | null {
  if (policy.fixtureOnly === true) return policy.mode === undefined || policy.mode === 'fixture' ? 'fixture' : null;
  if (policy.mode === 'fixture') return 'fixture';
  if (policy.mode === 'live' && policy.privateDataApproved === true) return 'live';
  return null;
}

export interface BackendExecutionPolicy { mode?: ExecutionMode; fixtureOnly?: boolean; liveApproved?: boolean }
/** Code-release gate only. Environment approval/configuration is checked separately. */
export function resolveBackendExecutionMode(policy: BackendExecutionPolicy): ExecutionMode | null {
  const mode = policy.mode ?? (policy.fixtureOnly === true ? 'fixture' : null);
  if (mode === 'fixture') return 'fixture';
  if (mode === 'live' && policy.fixtureOnly !== true && policy.liveApproved === true) return 'live';
  return null;
}
