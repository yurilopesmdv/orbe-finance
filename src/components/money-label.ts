import { assertCents } from '../domain/money.ts';
/** Formats exact canonical cents without converting the fractional part to a floating number. */
export function formatCents(cents: number, currency = 'BRL') {
  assertCents(cents);
  if (!/^[A-Z]{3}$/.test(currency)) throw new Error('invalid_currency');
  // Do not depend on optional Intl methods in the native JS runtime.
  // Work on decimal strings so even the largest safe cent amount stays exact.
  const digits = Math.abs(cents).toString().padStart(3, '0');
  const whole = digits.slice(0, -2).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  const fraction = digits.slice(-2);
  const symbol = currency === 'BRL' ? 'R$' : currency === 'USD' ? 'US$' : currency === 'EUR' ? '€' : currency;
  return `${cents < 0 ? '-' : ''}${symbol} ${whole},${fraction}`;
}
export function moneyLabel(cents: number | null, hidden: boolean, currency = 'BRL') {
  if (hidden) return 'Valor oculto';
  if (cents === null) return 'Não informado';
  try { return formatCents(cents, currency); } catch { return 'Valor indisponível'; }
}
