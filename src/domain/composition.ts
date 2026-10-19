import { reconcilePortfolio, type AssetComponent } from './portfolio.ts';
export interface AssetClassification {
  institution: 'bradesco' | 'mercado-pago' | 'inter' | 'nubank';
  assetClass: 'account' | 'investment' | 'other';
}
interface CompositionGroup { id: string; amountCents: number; shareBasisPoints: number | null; partial: boolean }
export function portfolioComposition(components: readonly AssetComponent[], classification: Readonly<Record<string, AssetClassification>>, currency = 'BRL') {
  if (!/^[A-Z]{3}$/.test(currency) || components.some(component => typeof component.currency !== 'string' || !/^[A-Z]{3}$/.test(component.currency))) throw new Error('invalid_composition_currency');
  if (!classification || typeof classification !== 'object' || Array.isArray(classification)) throw new Error('invalid_asset_classification');
  for (const value of Object.values(classification)) {
    if (!value || typeof value !== 'object' || Array.isArray(value) || !['bradesco', 'mercado-pago', 'inter', 'nubank'].includes(value.institution) || !['account', 'investment', 'other'].includes(value.assetClass)) throw new Error('invalid_asset_classification');
  }
  const reconciled = reconcilePortfolio(components, currency);
  const partial = reconciled.partial || reconciled.countedIds.some(id => !Object.hasOwn(classification, id));
  const byId = new Map(components.map(component => [component.id, component]));
  function groups(dimension: keyof AssetClassification): ReadonlyArray<Readonly<CompositionGroup>> {
    const amounts = new Map<string, bigint>();
    for (const id of reconciled.countedIds) {
      const component = byId.get(id)!;
      const tag = Object.hasOwn(classification, id) ? classification[id] : undefined;
      const key = tag?.[dimension] ?? 'unclassified';
      amounts.set(key, (amounts.get(key) ?? 0n) + BigInt(component.amountCents!));
    }
    const total = BigInt(reconciled.subtotalCents);
    const rows = [...amounts].sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0).map(([id, amount]) => ({ id, amount, share: total > 0n ? amount * 10000n / total : 0n, remainder: total > 0n ? amount * 10000n % total : 0n }));
    if (total > 0n) {
      let remaining = 10000n - rows.reduce((sum, row) => sum + row.share, 0n);
      const ranked = [...rows].sort((a, b) => a.remainder > b.remainder ? -1 : a.remainder < b.remainder ? 1 : a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
      for (const row of ranked) { if (remaining === 0n) break; row.share++; remaining--; }
    }
    return Object.freeze(rows.map(row => Object.freeze({ id: row.id, amountCents: Number(row.amount), shareBasisPoints: total > 0n ? Number(row.share) : null, partial })));
  }
  return Object.freeze({
    currency, subtotalCents: reconciled.subtotalCents, partial, mixedDates: reconciled.mixedDates,
    asOfDates: Object.freeze([...reconciled.asOfDates]), otherCurrencies: Object.freeze([...reconciled.otherCurrencies]),
    institutions: groups('institution'), classes: groups('assetClass'),
  });
}
