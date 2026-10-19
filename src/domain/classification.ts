import type { FinancialType } from './expenses.ts';

export interface Category { id: string; archived: boolean }
export interface ClassificationFields { categoryId?: string | null; type?: FinancialType }
export interface ClassificationRule extends ClassificationFields {
  id: string;
  priority: number;
  contains: string;
  accountId?: string;
  direction?: 'credit' | 'debit';
}
export interface ClassificationInput {
  description: string;
  accountId: string;
  direction: 'credit' | 'debit';
  provider?: ClassificationFields;
  override?: ClassificationFields;
  trustedOwnTransfer?: boolean;
}
type Origin = 'override' | 'rule' | 'provider' | 'fallback';
const types = new Set<FinancialType>(['income', 'expense', 'own_transfer', 'contribution', 'redemption', 'yield', 'refund', 'card_settlement', 'unknown']);
const normalize = (text: string) => text.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/\s+/g, ' ').trim();
const validId = (id: unknown): id is string => typeof id === 'string' && id.trim().length > 0;
function validateFields(fields: ClassificationFields) {
  if (fields.categoryId !== undefined && fields.categoryId !== null && !validId(fields.categoryId)) throw new Error('invalid_classification');
  if (fields.type !== undefined && !types.has(fields.type)) throw new Error('invalid_classification');
}

/** Pure classification; caller must supply an authorized catalog and confirmed transfer evidence. */
export function classifyMovement(input: ClassificationInput, categories: readonly Category[], rules: readonly ClassificationRule[]) {
  if (typeof input.description !== 'string' || !validId(input.accountId) || !['credit', 'debit'].includes(input.direction)) throw new Error('invalid_classification');
  if (input.trustedOwnTransfer !== undefined && typeof input.trustedOwnTransfer !== 'boolean') throw new Error('invalid_classification');
  const catalog = new Map<string, Category>();
  for (const category of categories) {
    if (!validId(category.id) || typeof category.archived !== 'boolean' || catalog.has(category.id)) throw new Error('invalid_category_catalog');
    catalog.set(category.id, category);
  }
  validateFields(input.provider ?? {}); validateFields(input.override ?? {});
  const ruleIds = new Set<string>();
  for (const rule of rules) {
    validateFields(rule);
    if (!validId(rule.id) || ruleIds.has(rule.id) || !Number.isSafeInteger(rule.priority) || typeof rule.contains !== 'string' || !normalize(rule.contains) || (rule.categoryId === undefined && rule.type === undefined)) throw new Error('invalid_rule');
    if (rule.accountId !== undefined && !validId(rule.accountId)) throw new Error('invalid_rule');
    if (rule.direction !== undefined && !['credit', 'debit'].includes(rule.direction)) throw new Error('invalid_rule');
    if (rule.type === 'own_transfer') throw new Error('unconfirmed_transfer_rule');
    ruleIds.add(rule.id);
  }
  const description = normalize(input.description);
  const matching = [...rules].sort((a, b) => a.priority - b.priority || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0)).filter(rule => description.includes(normalize(rule.contains)) && (rule.accountId === undefined || rule.accountId === input.accountId) && (rule.direction === undefined || rule.direction === input.direction));
  const categoryRule = matching.find(rule => rule.categoryId !== undefined);
  const typeRule = matching.find(rule => rule.type !== undefined);
  let categoryOrigin: Origin = 'fallback', typeOrigin: Origin = 'fallback';
  let categoryId: string | null = null;
  let type: FinancialType = 'unknown';
  let needsReview = false;
  if (input.override?.categoryId !== undefined) { categoryOrigin = 'override'; categoryId = input.override.categoryId; }
  else if (categoryRule) { categoryOrigin = 'rule'; categoryId = categoryRule.categoryId ?? null; }
  else if (input.provider?.categoryId !== undefined) { categoryOrigin = 'provider'; categoryId = input.provider.categoryId; }
  if (categoryId !== null) {
    const category = catalog.get(categoryId);
    if (!category || (category.archived && categoryOrigin !== 'override')) { categoryId = null; needsReview = true; }
  }
  if (input.override?.type !== undefined) { typeOrigin = 'override'; type = input.override.type; }
  else if (typeRule?.type !== undefined) { typeOrigin = 'rule'; type = typeRule.type; }
  else if (input.provider?.type !== undefined) { typeOrigin = 'provider'; type = input.provider.type; }
  if (type === 'own_transfer' && typeOrigin !== 'override' && input.trustedOwnTransfer !== true) { type = 'unknown'; needsReview = true; }
  return { categoryId, type, categoryOrigin, typeOrigin, needsReview: needsReview || type === 'unknown', categoryRuleId: categoryOrigin === 'rule' ? categoryRule?.id ?? null : null, typeRuleId: typeOrigin === 'rule' ? typeRule?.id ?? null : null };
}
