import { assertCents } from '../domain/money.ts';
/** Formats exact canonical cents without converting the fractional part to a floating number. */
export function formatCents(cents: number, currency = 'BRL') {
  assertCents(cents);
  if (!/^[A-Z]{3}$/.test(currency)) throw new Error('invalid_currency');
  const value = BigInt(cents), units = value / 100n;
  const fraction = ((value < 0n ? -value : value) % 100n).toString().padStart(2, '0');
  const whole = cents < 0 && units === 0n ? -0 : Number(units);
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency, minimumFractionDigits: 2, maximumFractionDigits: 2 })
    .formatToParts(whole).map(part => part.type === 'fraction' ? fraction : part.value).join('');
}
export function moneyLabel(cents: number | null, hidden: boolean, currency = 'BRL') {
  if (hidden) return 'Valor oculto';
  if (cents === null) return 'Não informado';
  try { return formatCents(cents, currency); } catch { return 'Valor indisponível'; }
}
