import { compareMonths, type MonthObservation } from '../../domain/comparison.ts';
import { selectMovements, type LocalMovement, type MovementFilters } from '../local/query.ts';
import { demoReportFilters } from './report-route.ts';

export function demoComparisonFilters(params: Record<string, unknown>) {
  if (Object.keys(params).some(key => !['month', 'institution', 'category', 'account', 'type'].includes(key))) return null;
  const parsed = demoReportFilters({ ...params, category: params.category === 'all' ? 'uncategorized' : params.category });
  if (!parsed) return null;
  const { scopeCategoryId, ...filters } = parsed;
  return { ...filters, categoryId: params.category === 'all' ? undefined : filters.categoryId };
}
export function demoMonthComparison(movements: readonly LocalMovement[], filters: Omit<MovementFilters, 'offset' | 'limit'>) {
  if (!['2026-09', '2026-10'].includes(filters.month) || filters.currency !== undefined && filters.currency !== 'BRL') throw new Error('invalid_demo_comparison');
  const previous = filters.month === '2026-10' ? '2026-09' : '2026-08';
  function observe(month: string): MonthObservation {
    // Explicit fixture coverage, never infer complete historical coverage from an empty query.
    if (!['2026-09', '2026-10'].includes(month)) return { month, currency: 'BRL', netCents: null, coverage: 'missing', observedAt: null };
    const selected = selectMovements(movements, { ...filters, month, currency: 'BRL' }, true);
    const netCents = selected.totalCount > 0 && selected.items.every(m => m.amountCents === null) ? null : selected.summary.netCents;
    return {
      month, currency: 'BRL', netCents,
      coverage: month === '2026-10' || selected.summary.partial || netCents === null ? 'partial' : 'complete',
      observedAt: '2026-10-19',
    };
  }
  return compareMonths(observe(filters.month), observe(previous));
}
