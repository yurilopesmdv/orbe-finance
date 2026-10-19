import { normalizePositionPage, type PositionPageContext } from './positions.ts';
import { createAssetStager, type AssetStager } from './asset-staging.ts';
import type { MemoryAssets } from '../../data/local/assets.ts';
export type PositionStager = AssetStager;
export function createPositionStager(store: MemoryAssets, input: PositionPageContext, policy: { enabled?: boolean; privateDataApproved?: boolean } = {}): PositionStager | Readonly<{ kind: 'disabled' }> {
  if (policy.enabled !== true || policy.privateDataApproved !== true) return Object.freeze({ kind: 'disabled' });
  try {
    if (!input || ['ownerSubject','connectionId','institutionId','product','allowedPositionIds','allowedParents'].some(key => !Object.hasOwn(input,key))) throw new Error();
    const positions = input.allowedPositionIds, parents = input.allowedParents;
    if (!Array.isArray(positions) || positions.length > 10000 || !Array.isArray(parents) || parents.length > 10000) throw new Error();
    const allowedParents = Object.freeze(parents.map(ref => {
      if (!ref || !Object.hasOwn(ref,'product') || !Object.hasOwn(ref,'id')) throw new Error();
      return Object.freeze({ product: ref.product, id: ref.id });
    }));
    const context = Object.freeze({ ownerSubject: input.ownerSubject, connectionId: input.connectionId, institutionId: input.institutionId, product: input.product, allowedPositionIds: Object.freeze([...positions]), allowedParents });
    const approved = { enabled: true, privateDataApproved: true };
    normalizePositionPage({ connectionId: context.connectionId, product: context.product, items: [], nextCursor: null, authoritative: false, sourceUpdatedAt: null },context,approved);
    return createAssetStager(store,{ connectionId: context.connectionId, institutionId: context.institutionId, product: context.product },raw => {
      const page = normalizePositionPage(raw,context,approved);
      if (page.kind !== 'page') throw new Error();
      return page;
    },'invalid_position_staging',approved);
  } catch { throw new Error('invalid_position_staging'); }
}
