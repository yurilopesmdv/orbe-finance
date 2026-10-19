export interface ActivitySource {
  readonly currentState: string | null;
  addEventListener(event: 'change', listener: (state: string) => void): { remove(): void };
}
/** Unknown states fail closed; stale native callbacks after cleanup are ignored. */
export function observeActivity(source: ActivitySource, onChange: (active: boolean) => void) {
  let disposed = false;
  const notify = (state: string | null) => { if (!disposed) onChange(state === 'active'); };
  const subscription = source.addEventListener('change', notify);
  notify(source.currentState);
  return () => { disposed = true; subscription.remove(); };
}
