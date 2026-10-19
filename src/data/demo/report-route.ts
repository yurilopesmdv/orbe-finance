import { categoryOptions } from './overrides.ts';
export function demoReportFilters(params: { month?: unknown; institution?: unknown; category?: unknown }) {
  if (typeof params.month !== 'string' || !['2026-09', '2026-10'].includes(params.month)) return null;
  if (typeof params.institution !== 'string' || !['all', 'bradesco', 'mercado-pago'].includes(params.institution)) return null;
  if (typeof params.category !== 'string' || (params.category !== 'uncategorized' && !categoryOptions.some(c => c.id === params.category))) return null;
  return { month: params.month, institutionId: params.institution === 'all' ? undefined : params.institution, categoryId: params.category === 'uncategorized' ? null : params.category };
}
