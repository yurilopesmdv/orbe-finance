import { assertCents, occurrenceMonth } from './money.ts';
export interface MonthObservation {
  month: string;
  currency: string;
  netCents: number | null;
  coverage: 'complete' | 'partial' | 'missing';
  observedAt: string | null;
}
export type ComparisonReason = 'missing_observation' | 'missing_value' | 'undated_period' | 'open_period' | 'partial_period' | 'base_non_positive' | 'negative_current' | 'out_of_range';
const max = BigInt(Number.MAX_SAFE_INTEGER);
const safeNumber = (value: bigint): number | null => value <= max && value >= -max ? Number(value) : null;
function monthIndex(month: string): number {
  if (typeof month !== 'string' || !/^\d{4}-(?:0[1-9]|1[0-2])$/.test(month) || month.startsWith('0000')) throw new Error('invalid_comparison_month');
  return Number(month.slice(0, 4)) * 12 + Number(month.slice(5)) - 1;
}
function project(input: MonthObservation): Readonly<MonthObservation> {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error('invalid_observation');
  monthIndex(input.month);
  if (typeof input.currency !== 'string' || !/^[A-Z]{3}$/.test(input.currency) || !['complete', 'partial', 'missing'].includes(input.coverage)) throw new Error('invalid_observation');
  if (input.netCents !== null) assertCents(input.netCents);
  if (input.coverage === 'missing' && (input.netCents !== null || input.observedAt !== null) || input.coverage === 'complete' && input.netCents === null) throw new Error('invalid_observation');
  if (input.observedAt !== null) {
    const sourceMonth = occurrenceMonth(input.observedAt);
    const time = /T(\d{2}):(\d{2}):(\d{2})/.exec(input.observedAt);
    if (time && (Number(time[1]) > 23 || Number(time[2]) > 59 || Number(time[3]) > 59)) throw new Error('invalid_date');
    if (sourceMonth < input.month) throw new Error('observation_before_period');
  }
  return Object.freeze({ month: input.month, currency: input.currency, netCents: input.netCents, coverage: input.coverage, observedAt: input.observedAt });
}
export function compareMonths(currentInput: MonthObservation, previousInput: MonthObservation) {
  const current = project(currentInput), previous = project(previousInput);
  if (current.currency !== previous.currency) throw new Error('comparison_currency_mismatch');
  if (monthIndex(current.month) - monthIndex(previous.month) !== 1) throw new Error('comparison_period_order');
  const observations = [current, previous];
  const partial = observations.some(value => value.coverage !== 'complete' || value.observedAt === null || value.month >= occurrenceMonth(value.observedAt));
  let reason: ComparisonReason | null = null;
  let deltaCents: number | null = null, percentageBasisPoints: number | null = null;
  if (observations.some(value => value.coverage === 'missing')) reason = 'missing_observation';
  else if (current.netCents === null || previous.netCents === null) reason = 'missing_value';
  else {
    const difference = BigInt(current.netCents) - BigInt(previous.netCents);
    deltaCents = safeNumber(difference);
    if (deltaCents === null) reason = 'out_of_range';
    else if (observations.some(value => value.observedAt === null)) reason = 'undated_period';
    else if (observations.some(value => value.month >= occurrenceMonth(value.observedAt!))) reason = 'open_period';
    else if (partial) reason = 'partial_period';
    else if (previous.netCents <= 0) reason = 'base_non_positive';
    else if (current.netCents < 0) reason = 'negative_current';
    else {
      const numerator = difference * 10000n, denominator = BigInt(previous.netCents);
      const magnitude = numerator < 0n ? -numerator : numerator;
      const rounded = (magnitude + denominator / 2n) / denominator;
      percentageBasisPoints = safeNumber(numerator < 0n ? -rounded : rounded);
      if (percentageBasisPoints === null) reason = 'out_of_range';
    }
  }
  return Object.freeze({ current, previous, deltaCents, percentageBasisPoints, percentageUnavailableReason: reason, partial });
}
