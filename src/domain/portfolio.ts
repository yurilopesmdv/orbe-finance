import { assertCents, occurrenceMonth, sumCents } from './money.ts';

export interface AssetComponent {
  id: string;
  currency: string;
  amountCents: number | null;
  asOf: string | null;
  kind: 'asset' | 'allocation' | 'credit_limit';
  relation: 'distinct' | 'included' | 'unknown';
  includedIn?: string;
}
export function reconcilePortfolio(components: readonly AssetComponent[], currency = 'BRL') {
  const items = new Map<string, AssetComponent>(), signatures = new Map<string, string>();
  for (const component of components) {
    if (![component.id, component.currency].every(value => typeof value === 'string' && value.length > 0) || !['asset', 'allocation', 'credit_limit'].includes(component.kind) || !['distinct', 'included', 'unknown'].includes(component.relation)) throw new Error('invalid_component');
    if (component.includedIn !== undefined && (typeof component.includedIn !== 'string' || !component.includedIn.length)) throw new Error('invalid_inclusion_reference');
    if (component.amountCents !== null) assertCents(component.amountCents);
    if (component.asOf !== null) occurrenceMonth(component.asOf);
    if (component.kind === 'asset' && component.relation === 'included' && !component.includedIn) throw new Error('missing_inclusion_reference');
    if (component.relation !== 'included' && component.includedIn) throw new Error('invalid_inclusion_reference');
    const signature = JSON.stringify([component.currency, component.amountCents, component.asOf, component.kind, component.relation, component.includedIn ?? null]);
    if (signatures.has(component.id) && signatures.get(component.id) !== signature) throw new Error('conflicting_component');
    signatures.set(component.id, signature); items.set(component.id, component);
  }
  const visiting = new Set<string>(), visited = new Set<string>();
  function visit(component: AssetComponent) {
    if (visiting.has(component.id)) throw new Error('cyclic_inclusion');
    if (visited.has(component.id)) return;
    visiting.add(component.id);
    if (component.kind === 'asset' && component.relation === 'included') {
      const parent = items.get(component.includedIn!);
      if (parent) {
        if (parent.kind !== 'asset' || parent.currency !== component.currency) throw new Error('invalid_inclusion_parent');
        if (component.amountCents !== null && parent.amountCents !== null && component.amountCents > parent.amountCents) throw new Error('inclusion_exceeds_parent');
        visit(parent);
      }
    }
    visiting.delete(component.id); visited.add(component.id);
  }
  for (const component of items.values()) visit(component);
  const values: number[] = [], countedIds: string[] = [], unresolvedIds: string[] = [], dates = new Set<string>(), otherCurrencies = new Set<string>();
  let partial = false;
  for (const component of items.values()) {
    if (component.kind !== 'asset') continue;
    if (component.currency !== currency) { otherCurrencies.add(component.currency); continue; }
    if (component.asOf !== null) dates.add(component.asOf);
    const unresolved = component.amountCents === null || component.amountCents < 0 || component.asOf === null || component.relation === 'unknown' || (component.relation === 'included' && !items.has(component.includedIn!));
    if (unresolved) { partial = true; unresolvedIds.push(component.id); }
    if (component.relation !== 'distinct' || component.amountCents === null || component.amountCents < 0) continue;
    values.push(component.amountCents); countedIds.push(component.id);
  }
  return { currency, subtotalCents: sumCents(values), partial, countedIds, unresolvedIds, mixedDates: dates.size > 1, asOfDates: [...dates].sort(), otherCurrencies: [...otherCurrencies].sort() };
}
export interface BalanceSnapshot { amountCents: number; currency: string; asOf: string }
export function snapshotChange(previous: BalanceSnapshot, current: BalanceSnapshot, netFlowsCents: number | null = null) {
  assertCents(previous.amountCents); assertCents(current.amountCents);
  occurrenceMonth(previous.asOf); occurrenceMonth(current.asOf);
  if (previous.currency !== current.currency) throw new Error('currency_mismatch');
  if (Date.parse(current.asOf) <= Date.parse(previous.asOf)) throw new Error('invalid_snapshot_order');
  if (netFlowsCents !== null) assertCents(netFlowsCents);
  const balanceChangeCents = sumCents([current.amountCents, -previous.amountCents]);
  return { currency: current.currency, balanceChangeCents, netFlowsCents, unexplainedChangeCents: netFlowsCents === null ? null : sumCents([balanceChangeCents, -netFlowsCents]) };
}
