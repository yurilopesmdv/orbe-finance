export type ValueBasis = 'gross' | 'net' | 'unknown';
export type PositionClass = 'fixed_income' | 'equity' | 'fund' | 'other' | 'unknown';
export interface PositionValuation { grossCents: number | null; netCents: number | null; valueBasis: ValueBasis; assetClass: PositionClass }
const keys = ['grossCents','netCents','valueBasis','assetClass'] as const;
const cents = (value: unknown): value is number | null => value === null || typeof value === 'number' && Number.isSafeInteger(value);
function invalid(): never { throw new Error('invalid_position_valuation'); }
/** Optional only for legacy synthetic components; never synthesize missing valuation. */
export function projectPositionValuation(raw: unknown, product: string, amountCents: number | null): Readonly<PositionValuation> | undefined {
  try {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return invalid();
    if (!keys.some(key => Object.hasOwn(raw,key))) return undefined;
    if (!['investment','reserve'].includes(product) || !keys.every(key => Object.hasOwn(raw,key))) return invalid();
    const record = raw as Record<string,unknown>;
    const grossCents = record.grossCents, netCents = record.netCents, valueBasis = record.valueBasis, assetClass = record.assetClass;
    if (!cents(grossCents) || !cents(netCents) || !['gross','net','unknown'].includes(valueBasis as string) || !['fixed_income','equity','fund','other','unknown'].includes(assetClass as string)) return invalid();
    const expected = valueBasis === 'gross' ? grossCents : valueBasis === 'net' ? netCents : null;
    if (amountCents !== expected) return invalid();
    return Object.freeze({ grossCents,netCents,valueBasis:valueBasis as ValueBasis,assetClass:assetClass as PositionClass });
  } catch { return invalid(); }
}
