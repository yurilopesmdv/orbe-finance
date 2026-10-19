import { reconcilePortfolio, type AssetComponent } from '../../domain/portfolio.ts';
import { projectPositionValuation, type PositionValuation } from '../../domain/valuation.ts';
import { MemoryScope, type MemoryPrincipal } from './scope.ts';
export type AssetProduct = 'account' | 'investment' | 'reserve';
export interface AssetScope { connectionId: string; institutionId: string; product: AssetProduct }
export interface LocalAsset extends AssetComponent, AssetScope, Partial<PositionValuation> {}
export interface OwnedAsset extends LocalAsset { ownerSubject: string }
export interface AssetTicket { readonly token: symbol }
const scopeKey = (scope: AssetScope) => JSON.stringify([scope.connectionId, scope.product]);
const sameScope = (asset: AssetScope, scope: AssetScope) => asset.connectionId === scope.connectionId && asset.product === scope.product;
const validText = (value: unknown): value is string => typeof value === 'string' && value.trim().length > 0 && value.length <= 200;
export class MemoryAssets {
  #guard: MemoryScope;
  #rows = new Map<string, LocalAsset>();
  #tickets = new Map<symbol, AssetScope>();
  #institutions = new Map<string, string>();
  #unconfirmed = new Map<string, AssetScope>();
  constructor(guard: () => MemoryPrincipal | null) {
    this.#guard = new MemoryScope(guard, () => { this.#rows.clear(); this.#tickets.clear(); this.#institutions.clear(); this.#unconfirmed.clear(); });
  }
  close() { this.#guard.close(); }
  beginImport(scope: AssetScope): AssetTicket {
    this.#guard.assert();
    if (!validText(scope.connectionId) || !['bradesco','mercado-pago','inter','nubank'].includes(scope.institutionId) || !['account','investment','reserve'].includes(scope.product)) throw new Error('invalid_asset_scope');
    const institution = this.#institutions.get(scope.connectionId);
    if (institution && institution !== scope.institutionId) throw new Error('connection_institution_conflict');
    for (const [token, prior] of this.#tickets) if (scopeKey(prior) === scopeKey(scope)) this.#tickets.delete(token);
    const token = Symbol('asset-import'); this.#tickets.set(token, { ...scope }); return Object.freeze({ token });
  }
  abortImport(ticket: AssetTicket) { this.#guard.assert(); this.#tickets.delete(ticket.token); }
  promote(ticket: AssetTicket, items: readonly OwnedAsset[], complete: boolean, authoritative = false, beforeCommit?: () => undefined) {
    this.#guard.assert();
    const scope = this.#tickets.get(ticket?.token);
    if (!scope) throw new Error('stale_import');
    if (complete !== true) throw new Error('incomplete_batch');
    if (typeof authoritative !== 'boolean' || !Array.isArray(items) || items.length > 10000) throw new Error('invalid_asset_batch');
    const institution = this.#institutions.get(scope.connectionId);
    if (institution && institution !== scope.institutionId) throw new Error('connection_institution_conflict');
    const clean = items.map(item => {
      if (!item || typeof item !== 'object') throw new Error('invalid_asset');
      this.#guard.assertOwner(item.ownerSubject);
      if (!sameScope(item, scope) || item.institutionId !== scope.institutionId || !/^[A-Z]{3}$/.test(item.currency)) throw new Error('out_of_scope_asset');
      const asset: LocalAsset = { id: item.id, currency: item.currency, amountCents: item.amountCents, asOf: item.asOf, kind: item.kind, relation: item.relation, connectionId: scope.connectionId, institutionId: scope.institutionId, product: scope.product, ...(item.includedIn === undefined ? {} : { includedIn: item.includedIn }), ...projectPositionValuation(item,scope.product,item.amountCents) };
      return asset;
    });
    // Validate conflicts within the incoming batch before Map deduplication.
    reconcilePortfolio(clean);
    const signatures = new Map<string,string>();
    for (const asset of clean) {
      const signature = JSON.stringify(asset);
      if (signatures.has(asset.id) && signatures.get(asset.id) !== signature) throw new Error('conflicting_component');
      signatures.set(asset.id,signature);
    }
    const candidate = new Map(this.#rows);
    for (const asset of clean) { const old = candidate.get(asset.id); if (old && !sameScope(old, scope)) throw new Error('asset_identity_conflict'); }
    if (authoritative) for (const [id, asset] of candidate) if (sameScope(asset, scope)) candidate.delete(id);
    for (const asset of clean) candidate.set(asset.id, asset);
    for (const asset of candidate.values()) if (asset.includedIn) {
      const parent = candidate.get(asset.includedIn);
      if (parent && parent.connectionId !== asset.connectionId) throw new Error('cross_connection_inclusion');
    }
    const currencies = [...new Set([...candidate.values()].map(asset => asset.currency))];
    for (const currency of currencies) reconcilePortfolio([...candidate.values()], currency);
    if (beforeCommit !== undefined && (typeof beforeCommit !== 'function' || beforeCommit() !== undefined)) throw new Error('invalid_commit_guard');
    this.#guard.assert();
    if (this.#tickets.get(ticket.token) !== scope) throw new Error('stale_import');
    this.#rows = candidate; this.#institutions.set(scope.connectionId, scope.institutionId); this.#tickets.delete(ticket.token);
    if (authoritative) this.#unconfirmed.delete(scopeKey(scope)); else this.#unconfirmed.set(scopeKey(scope), scope);
  }
  list(filters: { connectionId?: string; institutionId?: string; currency?: string } = {}, sourceComplete = false) {
    this.#guard.assert();
    const currency = filters.currency ?? 'BRL';
    if (typeof sourceComplete !== 'boolean' || !/^[A-Z]{3}$/.test(currency)) throw new Error('invalid_asset_query');
    const matches = (asset: Pick<LocalAsset, 'connectionId' | 'institutionId'>) => (filters.connectionId === undefined || asset.connectionId === filters.connectionId) && (filters.institutionId === undefined || asset.institutionId === filters.institutionId);
    const items = [...this.#rows.values()].filter(matches).map(asset => ({ ...asset }));
    const summary = reconcilePortfolio(items, currency);
    const unconfirmed = [...this.#unconfirmed.values()].some(matches);
    return { items, summary: { ...summary, partial: summary.partial || unconfirmed || !sourceComplete } };
  }
}
