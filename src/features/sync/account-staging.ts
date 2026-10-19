import { normalizeAccountPage, type AccountPageContext } from './accounts.ts';
import { createAssetStager, type AssetStager } from './asset-staging.ts';
import type { MemoryAssets } from '../../data/local/assets.ts';
export type AccountStager = AssetStager;
export function createAccountStager(store: MemoryAssets, input: AccountPageContext, policy: { enabled?: boolean; privateDataApproved?: boolean } = {}): AccountStager | Readonly<{ kind: 'disabled' }> {
  if (policy.enabled !== true || policy.privateDataApproved !== true) return Object.freeze({ kind: 'disabled' });
  try {
    if (!input || ['ownerSubject','connectionId','institutionId','allowedAccountIds'].some(key => !Object.hasOwn(input,key))) throw new Error();
    const allowed = input.allowedAccountIds;
    if (!Array.isArray(allowed) || allowed.length > 10000) throw new Error();
    const context = Object.freeze({ ownerSubject: input.ownerSubject, connectionId: input.connectionId, institutionId: input.institutionId, allowedAccountIds: Object.freeze([...allowed]) });
    const approved = { enabled: true, privateDataApproved: true };
    normalizeAccountPage({ connectionId: context.connectionId, items: [], nextCursor: null, authoritative: false, sourceUpdatedAt: null },context,approved);
    return createAssetStager(store,{ connectionId: context.connectionId, institutionId: context.institutionId, product: 'account' },raw => {
      const page = normalizeAccountPage(raw,context,approved);
      if (page.kind !== 'page') throw new Error();
      return page;
    },'invalid_account_staging',approved);
  } catch { throw new Error('invalid_account_staging'); }
}
