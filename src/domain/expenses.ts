import { assertCents, occurrenceMonth, sumCents } from './money.ts';

export interface MovementRef { source: string; accountId: string; externalId: string }
export type FinancialType = 'income' | 'expense' | 'own_transfer' | 'contribution' | 'redemption' | 'yield' | 'refund' | 'card_settlement' | 'unknown';
export interface Movement extends MovementRef {
  amountCents: number | null;
  currency: string;
  direction: 'credit' | 'debit';
  type: FinancialType;
  status: 'posted' | 'pending' | 'cancelled';
  occurredAt: string;
  reversalOf?: MovementRef;
}
const types = new Set<FinancialType>(['income', 'expense', 'own_transfer', 'contribution', 'redemption', 'yield', 'refund', 'card_settlement', 'unknown']);
const key = (value: MovementRef) => JSON.stringify([value.source, value.accountId, value.externalId]);
export function calculateExpenses(movements: readonly Movement[], month: string, currency = 'BRL') {
  if (!/^\d{4}-(?:0[1-9]|1[0-2])$/.test(month)) throw new Error('invalid_month');
  const canonical = new Map<string, Movement>(), fingerprints = new Map<string, string>();
  for (const movement of movements) {
    if (!types.has(movement.type) || !['credit', 'debit'].includes(movement.direction) || !['posted', 'pending', 'cancelled'].includes(movement.status)) throw new Error('invalid_movement');
    if (![movement.source, movement.accountId, movement.externalId, movement.currency].every(v => typeof v === 'string' && v.length > 0)) throw new Error('invalid_movement');
    if (movement.amountCents !== null) {
      assertCents(movement.amountCents);
      if (movement.amountCents < 0) throw new Error('negative_movement_magnitude');
    }
    occurrenceMonth(movement.occurredAt);
    const id = key(movement);
    const fingerprint = JSON.stringify([movement.amountCents, movement.currency, movement.direction, movement.type, movement.status, movement.occurredAt, movement.reversalOf ? key(movement.reversalOf) : null]);
    if (fingerprints.has(id) && fingerprints.get(id) !== fingerprint) throw new Error('conflicting_movement');
    canonical.set(id, movement); fingerprints.set(id, fingerprint);
  }
  const expenses: number[] = [], refunds: number[] = [];
  let partial = false;
  for (const movement of canonical.values()) {
    if (movement.currency !== currency || movement.status !== 'posted' || occurrenceMonth(movement.occurredAt) !== month) continue;
    if (movement.type === 'unknown' || movement.amountCents === null) { partial = true; continue; }
    if (movement.type === 'expense') {
      if (movement.direction !== 'debit') { partial = true; continue; }
      expenses.push(movement.amountCents);
    } else if (movement.type === 'refund') {
      const original = movement.reversalOf ? canonical.get(key(movement.reversalOf)) : undefined;
      if (!original || original.type !== 'expense' || original.status !== 'posted' || original.direction !== 'debit' || original.currency !== currency || movement.direction !== 'credit') { partial = true; continue; }
      refunds.push(movement.amountCents);
    }
  }
  const grossCents = sumCents(expenses), refundCents = sumCents(refunds);
  return { grossCents, refundCents, netCents: sumCents([grossCents, -refundCents]), partial, currency, month };
}
