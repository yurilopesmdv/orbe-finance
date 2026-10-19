import { classifyMovement, type ClassificationFields } from '../../domain/classification.ts';
import type { LocalMovement } from '../local/query.ts';
export const categoryOptions = [
  { id: 'housing', label: 'Moradia', archived: false }, { id: 'food', label: 'Alimentação', archived: false },
  { id: 'transport', label: 'Transporte', archived: false }, { id: 'health', label: 'Saúde', archived: false },
  { id: 'other', label: 'Outros', archived: false },
];
export const movementKey = (movement: LocalMovement) => JSON.stringify([movement.source, movement.accountId, movement.externalId]);
export function applyDemoOverrides(movements: readonly LocalMovement[], overrides: Readonly<Record<string, ClassificationFields>>) {
  return movements.map(movement => {
    const correction = overrides[movementKey(movement)];
    if (!correction) return { ...movement };
    const classification = classifyMovement({ description: movement.description, accountId: movement.accountId, direction: movement.direction, provider: { categoryId: movement.categoryId, type: movement.type }, override: correction, trustedOwnTransfer: movement.type === 'own_transfer' }, categoryOptions, []);
    return { ...movement, categoryId: classification.categoryId, type: classification.type };
  });
}
