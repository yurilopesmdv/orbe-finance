import { connectionProducts, type ConnectionProduct } from '../../domain/connections.ts';
/** Capture a requested subset without changing the upstream capability metadata. */
export function selectReadProducts(readable: readonly ConnectionProduct[], requested?: readonly ConnectionProduct[]): readonly ConnectionProduct[] {
  if (requested === undefined) return Object.freeze([...readable]);
  if (!Array.isArray(requested) || requested.length === 0 || requested.length > connectionProducts.length) throw Error('invalid_product_scope');
  const selected = new Set(requested);
  if (selected.size !== requested.length || requested.some(product => !connectionProducts.includes(product) || !readable.includes(product))) throw Error('invalid_product_scope');
  return Object.freeze(connectionProducts.filter(product => selected.has(product)));
}
