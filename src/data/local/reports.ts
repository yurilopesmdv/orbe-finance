import { selectMovements, type LocalMovement, type MovementFilters } from './query.ts';
import { sumCents } from '../../domain/money.ts';
export function spendingReport(movements: readonly LocalMovement[], filters: Omit<MovementFilters, 'offset' | 'limit'>, sourceComplete: boolean) {
  const selected = selectMovements(movements, filters, sourceComplete);
  const categories = [...new Set(selected.items.map(m => m.categoryId))].sort((a, b) => (a ?? '') < (b ?? '') ? -1 : (a ?? '') > (b ?? '') ? 1 : 0).map(categoryId => {
    const result = selectMovements(movements, { ...filters, categoryId }, sourceComplete);
    return { categoryId, count: result.totalCount, summary: { ...result.summary, partial: result.summary.partial || selected.summary.partial } };
  });
  const types = [...new Set(selected.items.map(m => m.type))].sort().map(type => {
    const items = selected.items.filter(m => m.type === type), posted = items.filter(m => m.status === 'posted');
    const known = posted.filter(m => m.amountCents !== null);
    return {
      type, postedCount: posted.length, pendingCount: items.filter(m => m.status === 'pending').length, cancelledCount: items.filter(m => m.status === 'cancelled').length,
      creditCents: sumCents(known.filter(m => m.direction === 'credit').map(m => m.amountCents!)),
      debitCents: sumCents(known.filter(m => m.direction === 'debit').map(m => m.amountCents!)),
      missingAmountCount: posted.length - known.length,
      partial: selected.summary.partial || posted.length !== known.length,
    };
  });
  return { month: filters.month, currency: filters.currency ?? 'BRL', summary: selected.summary, totalCount: selected.totalCount, categories, types };
}
