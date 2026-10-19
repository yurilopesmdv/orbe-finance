import { occurrenceMonth } from '../../domain/money.ts';
import { reconcilePortfolio } from '../../domain/portfolio.ts';
import type { OwnedAsset, AssetProduct } from '../../data/local/assets.ts';
export type PositionProduct = 'investment' | 'reserve';
export type ValueBasis = 'gross' | 'net' | 'unknown';
export type PositionClass = 'fixed_income' | 'equity' | 'fund' | 'other' | 'unknown';
export interface OwnedPosition extends OwnedAsset { readonly grossCents: number | null; readonly netCents: number | null; readonly valueBasis: ValueBasis; readonly assetClass: PositionClass }
export interface PositionPageContext {
  readonly ownerSubject: string; readonly connectionId: string; readonly institutionId: string; readonly product: PositionProduct;
  readonly allowedPositionIds: readonly string[]; readonly allowedParents: readonly Readonly<{ product: AssetProduct; id: string }>[];
}
export interface PositionPage {
  readonly kind: 'page'; readonly items: readonly Readonly<OwnedPosition>[]; readonly rowCount: number;
  readonly nextCursor: string | null; readonly complete: boolean; readonly partial: boolean; readonly authoritative: boolean; readonly sourceUpdatedAt: string | null;
}
const uuid = (value: unknown): value is string => typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(value);
const products = ['account','investment','reserve'];
const cents = (value: unknown): value is number | null => value === null || typeof value === 'number' && Number.isSafeInteger(value);
function invalid(): never { throw new Error('invalid_position_page'); }
function fields(value: unknown, keys: readonly string[]) {
  if (!value || typeof value !== 'object' || Array.isArray(value) || keys.some(key => !Object.hasOwn(value,key))) return invalid();
  const record = value as Record<string,unknown>;
  return Object.fromEntries(keys.map(key => [key,record[key]]));
}
function date(value: unknown, instantOnly = false): string | null {
  if (value === null) return null;
  if (typeof value !== 'string') return invalid();
  occurrenceMonth(value);
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return instantOnly ? invalid() : value;
  const time = /T(\d{2}):(\d{2}):(\d{2})/.exec(value);
  if (!time || Number(time[1]) > 23 || Number(time[2]) > 59 || Number(time[3]) > 59) return invalid();
  return new Date(value).toISOString();
}
export function normalizePositionPage(raw: unknown, input: unknown, policy: { enabled?: boolean; privateDataApproved?: boolean } = {}): PositionPage | Readonly<{ kind: 'disabled' }> {
  if (policy.enabled !== true || policy.privateDataApproved !== true) return Object.freeze({ kind: 'disabled' });
  try {
    const { ownerSubject,connectionId,institutionId,product,allowedPositionIds,allowedParents } = fields(input,['ownerSubject','connectionId','institutionId','product','allowedPositionIds','allowedParents']);
    if (!uuid(ownerSubject) || !uuid(connectionId) || typeof institutionId !== 'string' || !['bradesco','mercado-pago','inter','nubank'].includes(institutionId) || !['investment','reserve'].includes(product as string) || !Array.isArray(allowedPositionIds) || allowedPositionIds.length > 10000 || !Array.isArray(allowedParents) || allowedParents.length > 10000) return invalid();
    const allowed = new Set<string>(), parents = new Set<string>();
    for (const id of allowedPositionIds) { if (!uuid(id)) return invalid(); allowed.add(id); }
    for (const value of allowedParents) { const ref = fields(value,['product','id']); if (!products.includes(ref.product as string) || !uuid(ref.id)) return invalid(); parents.add(`${ref.product}:${ref.id}`); }
    const page = fields(raw,['connectionId','product','items','nextCursor','authoritative','sourceUpdatedAt']);
    if (page.connectionId !== connectionId || page.product !== product || !Array.isArray(page.items) || page.items.length > 1000 || typeof page.authoritative !== 'boolean') return invalid();
    const cursor = page.nextCursor;
    if (!(cursor === null || typeof cursor === 'string' && cursor.length > 0 && cursor.length <= 512 && !/[\u0000-\u001f\u007f]/.test(cursor))) return invalid();
    const sourceUpdatedAt = date(page.sourceUpdatedAt,true);
    let partial = sourceUpdatedAt === null;
    const rows = new Map<string,Readonly<OwnedPosition>>();
    for (const value of page.items) {
      const item = fields(value,['id','connectionId','product','currency','grossCents','netCents','valueBasis','asOf','relation','parent','assetClass','kind']);
      if (!uuid(item.id) || !allowed.has(item.id) || item.connectionId !== connectionId || item.product !== product || typeof item.currency !== 'string' || !/^[A-Z]{3}$/.test(item.currency) || !cents(item.grossCents) || !cents(item.netCents) || !['gross','net','unknown'].includes(item.valueBasis as string) || !['distinct','included','unknown'].includes(item.relation as string) || !['fixed_income','equity','fund','other','unknown'].includes(item.assetClass as string) || !['asset','allocation'].includes(item.kind as string) || product === 'investment' && item.kind !== 'asset') return invalid();
      const id = `${product}:${connectionId}:${item.id}`;
      let includedIn: string | undefined;
      if (item.relation === 'included') {
        const parent = fields(item.parent,['product','id']);
        if (!products.includes(parent.product as string) || !uuid(parent.id) || !parents.has(`${parent.product}:${parent.id}`)) return invalid();
        includedIn = `${parent.product}:${connectionId}:${parent.id}`;
        if (includedIn === id) return invalid();
      } else if (item.parent !== null) return invalid();
      const asOf = date(item.asOf), amountCents = item.valueBasis === 'gross' ? item.grossCents : item.valueBasis === 'net' ? item.netCents : null;
      if (amountCents === null || amountCents < 0 || asOf === null || item.relation === 'unknown') partial = true;
      const position: Readonly<OwnedPosition> = Object.freeze({ ownerSubject,connectionId,institutionId,product: product as PositionProduct,id,currency: item.currency,amountCents,asOf,kind: item.kind as 'asset'|'allocation',relation: item.relation as 'distinct'|'included'|'unknown',...(includedIn ? { includedIn } : {}),grossCents: item.grossCents,netCents: item.netCents,valueBasis: item.valueBasis as ValueBasis,assetClass: item.assetClass as PositionClass });
      const prior = rows.get(id);
      if (prior && JSON.stringify(prior) !== JSON.stringify(position)) return invalid();
      rows.set(id,position);
    }
    const items = [...rows.values()];
    reconcilePortfolio(items);
    return Object.freeze({ kind:'page',items:Object.freeze(items),rowCount:page.items.length,nextCursor:cursor,complete:cursor===null,partial,authoritative:page.authoritative&&!partial,sourceUpdatedAt });
  } catch { return invalid(); }
}
