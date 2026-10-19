import { portfolioComposition, type AssetClassification } from '../../domain/composition.ts';
import { demoPortfolio } from './scenario.ts';
export const demoClassification: Readonly<Record<string, AssetClassification>> = {
  'bradesco-account': { institution: 'bradesco', assetClass: 'account' },
  'mp-account': { institution: 'mercado-pago', assetClass: 'account' },
  'bradesco-investment': { institution: 'bradesco', assetClass: 'investment' },
  'bradesco-reserve': { institution: 'bradesco', assetClass: 'account' },
  'mp-investment': { institution: 'mercado-pago', assetClass: 'investment' },
};
export function demoCompositionInstitution(value: unknown): 'bradesco' | 'mercado-pago' | undefined | null {
  return value === undefined || value === 'all' ? undefined : value === 'bradesco' || value === 'mercado-pago' ? value : null;
}
export const demoComposition = (institution?: 'bradesco' | 'mercado-pago') => portfolioComposition(demoPortfolio(institution).components, demoClassification);
