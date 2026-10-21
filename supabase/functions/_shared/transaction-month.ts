import { resolveExecutionMode, type ExecutionPolicy } from './execution-mode.ts';
import type { TransactionWindow } from './pluggy-targets.ts';

const unavailable = Object.freeze({ kind: 'unavailable' as const });
function instant(value: unknown): string | null {
  if (typeof value !== 'string' || value.length < 20 || value.length > 24 || !value.endsWith('Z') || !/^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}(?:\.[0-9]{1,3})?Z$/.test(value)) return null;
  const date = new Date(value);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0,19) === value.slice(0,19) ? date.toISOString() : null;
}
/** Day filters deliberately overfetch UTC boundaries; classification must precede local promotion. */
export function planTransactionMonth(rawMonth: unknown, policy: ExecutionPolicy & { enabled?: boolean } = {}) {
  if (policy.enabled !== true || resolveExecutionMode(policy) === null) return Object.freeze({ kind: 'disabled' as const });
  try {
    if (typeof rawMonth !== 'string' || rawMonth.length !== 7 || !/^20[0-9]{2}-(?:0[1-9]|1[0-2])$/.test(rawMonth)) return unavailable;
    const month = rawMonth, year = Number(month.slice(0,4)), number = Number(month.slice(5));
    const first = month + '-01';
    const last = new Date(Date.UTC(year, number, 0)).toISOString().slice(0,10);
    const next = new Date(Date.UTC(year, number, 1)).toISOString().slice(0,10);
    const days = Number(last.slice(8));
    const windows: readonly Readonly<TransactionWindow>[] = Object.freeze(days === 31
      ? [Object.freeze({ dateFrom: first, dateTo: last }), Object.freeze({ dateFrom: next, dateTo: next })]
      : [Object.freeze({ dateFrom: first, dateTo: next })]);
    const formatter = new Intl.DateTimeFormat('en-US', { timeZone: 'America/Sao_Paulo', calendar: 'gregory', numberingSystem: 'latn', year: 'numeric', month: '2-digit' });
    return Object.freeze({
      kind: 'plan' as const, month, timeZone: 'America/Sao_Paulo' as const, windows,
      classifyInstant(raw: unknown) {
        try {
          const occurredAt = instant(raw);
          if (occurredAt === null) return unavailable;
          const parts = formatter.formatToParts(new Date(occurredAt));
          const localYear = parts.find(part => part.type === 'year')?.value;
          const localMonth = parts.find(part => part.type === 'month')?.value;
          if (!localYear || !localMonth) return unavailable;
          return Object.freeze({ kind: localYear + '-' + localMonth === month ? 'inside' as const : 'outside' as const, occurredAt });
        } catch { return unavailable; }
      },
    });
  } catch { return unavailable; }
}
