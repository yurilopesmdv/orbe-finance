import type { MovementFilters } from '../local/query.ts';
import { categoryLabel, financialTypes, institutionLabel } from './labels.ts';
export const demoAccounts = [
  { id: 'bradesco-account', institution: 'bradesco', label: 'Conta corrente Bradesco · exemplo' },
  { id: 'mp-account', institution: 'mercado-pago', label: 'Conta de pagamento Mercado Pago · exemplo' },
] as const;
export function filterSummary(filters: Omit<MovementFilters, 'offset' | 'limit'>): string {
  return [
    `Instituição: ${institutionLabel(filters.institutionId)}`,
    `Conta: ${demoAccounts.find(account => account.id === filters.accountId)?.label ?? 'Todas'}`,
    `Tipo: ${financialTypes.find(type => type.id === filters.type)?.label ?? 'Todos'}`,
    `Categoria: ${filters.categoryId === undefined ? 'Todas' : categoryLabel(filters.categoryId)}`,
    ...(filters.search?.trim() ? ['Busca por descrição aplicada'] : []),
  ].join('. ') + '.';
}
