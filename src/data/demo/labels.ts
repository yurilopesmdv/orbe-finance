import type { FinancialType } from '../../domain/expenses.ts';
import { categoryOptions } from './overrides.ts';
export const financialTypes: { id: FinancialType; label: string }[] = [
  { id: 'expense', label: 'Despesa' }, { id: 'income', label: 'Receita' }, { id: 'own_transfer', label: 'Transferência própria' },
  { id: 'contribution', label: 'Aporte' }, { id: 'redemption', label: 'Resgate' }, { id: 'yield', label: 'Rendimento' },
  { id: 'refund', label: 'Estorno' }, { id: 'card_settlement', label: 'Pagamento de fatura' }, { id: 'unknown', label: 'Desconhecido' },
];
export const categoryLabel = (id: string | null) => id === null ? 'Sem categoria' : categoryOptions.find(c => c.id === id)?.label ?? 'Categoria indisponível';
export const institutionLabel = (id?: string) => id === 'bradesco' ? 'Bradesco' : id === 'mercado-pago' ? 'Mercado Pago' : 'Bradesco + Mercado Pago';

export const institutionSourceDate = (id?: string) => id === 'bradesco' ? '19/10/2026' : id === 'mercado-pago' ? '18/10/2026' : '18 e 19/10/2026';
