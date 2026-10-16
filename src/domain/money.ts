const max = BigInt(Number.MAX_SAFE_INTEGER);
const min = -max;
function safe(value: bigint): number {
  if (value > max || value < min) throw new Error('money_overflow');
  return Number(value);
}
export function assertCents(value: number): void {
  if (!Number.isSafeInteger(value)) throw new Error('invalid_cents');
}
export function parseMoney(value: string | null): number | null {
  if (value === null) return null;
  if (typeof value !== 'string' || value.length > 18 || !/^-?(?:0|[1-9]\d*)(?:\.\d{1,2})?$/.test(value)) throw new Error('invalid_money');
  const negative = value.startsWith('-');
  const [whole = '', fraction = ''] = (negative ? value.slice(1) : value).split('.');
  const cents = BigInt(whole) * 100n + BigInt(fraction.padEnd(2, '0'));
  return safe(negative ? -cents : cents);
}
export function sumCents(values: readonly number[]): number {
  return safe(values.reduce((sum, value) => { assertCents(value); return sum + BigInt(value); }, 0n));
}
export function occurrenceMonth(value: string): string {
  if (typeof value !== 'string') throw new Error('invalid_date');
  const civil = value.slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(civil)) throw new Error('invalid_date');
  const civilDate = new Date(`${civil}T00:00:00Z`);
  if (!Number.isFinite(civilDate.getTime()) || civilDate.toISOString().slice(0, 10) !== civil) throw new Error('invalid_date');
  if (value === civil) return civil.slice(0, 7);
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?(?:Z|[+-]\d{2}:\d{2})$/.test(value)) throw new Error('invalid_date');
  const instant = new Date(value);
  if (!Number.isFinite(instant.getTime())) throw new Error('invalid_date');
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit' }).formatToParts(instant);
  return `${parts.find(p => p.type === 'year')!.value}-${parts.find(p => p.type === 'month')!.value}`;
}
