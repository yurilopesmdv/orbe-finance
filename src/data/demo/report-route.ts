import { categoryOptions } from './overrides.ts';
import { demoAccounts } from './filters.ts';
import { financialTypes } from './labels.ts';
import type { FinancialType } from '../../domain/expenses.ts';
export function demoReportFilters(params: { month?: unknown; institution?: unknown; category?: unknown; account?: unknown; type?: unknown; scopeCategory?: unknown }) {
  if (Object.keys(params).some(key => !['month', 'institution', 'category', 'account', 'type', 'scopeCategory'].includes(key))) return null;
  if (typeof params.month !== 'string' || !['2026-09', '2026-10'].includes(params.month)) return null;
  if (typeof params.institution !== 'string' || !['all', 'bradesco', 'mercado-pago'].includes(params.institution)) return null;
  if (typeof params.category !== 'string' || (params.category !== 'uncategorized' && !categoryOptions.some(c => c.id === params.category))) return null;
  const account = params.account === undefined || params.account === 'all' ? undefined : demoAccounts.find(a => a.id === params.account);
  if (params.account !== undefined && params.account !== 'all' && !account) return null;
  if (account && params.institution !== 'all' && params.institution !== account.institution) return null;
  const type = params.type === undefined || params.type === 'all' ? undefined : financialTypes.find(t => t.id === params.type)?.id;
  if (params.type !== undefined && params.type !== 'all' && type === undefined) return null;
  if (params.scopeCategory !== undefined && params.scopeCategory !== 'all' && params.scopeCategory !== params.category) return null;
  return {
    ...(params.scopeCategory !== undefined && params.scopeCategory !== 'all' ? { scopeCategoryId: params.scopeCategory === 'uncategorized' ? null : params.scopeCategory as string } : {}),
    month: params.month, institutionId: params.institution === 'all' ? undefined : params.institution,
    categoryId: params.category === 'uncategorized' ? null : params.category,
    ...(account ? { accountId: account.id } : {}), ...(type ? { type: type as FinancialType } : {}),
  };
}
