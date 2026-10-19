import { reconcilePortfolio, type AssetComponent } from '../../domain/portfolio.ts';
import { queryMovements, type LocalMovement } from '../local/query.ts';
export const demoMonth = '2026-10';
export const demoSourceDate = '19/10/2026';
export const demoAssets: readonly AssetComponent[] = [
  { id: 'bradesco-account', currency: 'BRL', amountCents: 800000, asOf: '2026-10-19', kind: 'asset', relation: 'distinct' },
  { id: 'mp-account', currency: 'BRL', amountCents: 250000, asOf: '2026-10-18', kind: 'asset', relation: 'distinct' },
  { id: 'bradesco-investment', currency: 'BRL', amountCents: 500000, asOf: '2026-10-19', kind: 'asset', relation: 'distinct' },
  { id: 'bradesco-reserve', currency: 'BRL', amountCents: 200000, asOf: '2026-10-19', kind: 'asset', relation: 'included', includedIn: 'bradesco-account' },
  { id: 'mp-investment', currency: 'BRL', amountCents: null, asOf: null, kind: 'asset', relation: 'unknown' },
];
const base = { source: 'invented', accountId: 'bradesco-account', currency: 'BRL', direction: 'debit' as const, type: 'expense' as const, status: 'posted' as const, institutionId: 'bradesco' };
export const demoMovements: readonly LocalMovement[] = [
  { ...base, externalId: 'rent', amountCents: 70000, occurredAt: '2026-10-05', description: 'Moradia · exemplo', categoryId: 'housing' },
  { ...base, externalId: 'market', amountCents: 20000, occurredAt: '2026-10-12', description: 'Mercado · exemplo', categoryId: 'food' },
  { ...base, accountId: 'mp-account', institutionId: 'mercado-pago', externalId: 'transport', amountCents: 10000, occurredAt: '2026-10-16', description: 'Transporte · exemplo', categoryId: 'transport' },
  { ...base, externalId: 'refund', amountCents: 5000, direction: 'credit', type: 'refund', occurredAt: '2026-10-17', description: 'Estorno de mercado · exemplo', categoryId: 'food', reversalOf: { source: 'invented', accountId: 'bradesco-account', externalId: 'market' } },
  { ...base, externalId: 'own-transfer', amountCents: 250000, type: 'own_transfer', occurredAt: '2026-10-18', description: 'Transferência própria confirmada · exemplo', categoryId: null },
];
export function demoOverview() {
  return { portfolio: reconcilePortfolio(demoAssets), expenses: queryMovements(demoMovements, { month: demoMonth }, true).summary };
}
