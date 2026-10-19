import { occurrenceMonth, parseMoney } from '../domain/money.ts';
export function parseGoalAmount(value: string) {
  if (typeof value !== 'string' || !/^(?:0|[1-9]\d*)(?:[,.]\d{1,2})?$/.test(value.trim())) throw new Error('invalid_goal_amount');
  const cents = parseMoney(value.trim().replace(',', '.'));
  if (cents === null) throw new Error('invalid_goal_amount');
  return cents;
}
export function parseGoalDeadline(value: string) {
  if (typeof value !== 'string') throw new Error('invalid_goal_deadline');
  const trimmed = value.trim(); if (!trimmed) return null;
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(trimmed);
  if (!match) throw new Error('invalid_goal_deadline');
  const civil = `${match[3]}-${match[2]}-${match[1]}`;
  try { occurrenceMonth(civil); } catch { throw new Error('invalid_goal_deadline'); }
  return civil;
}
