import { MemoryGoals } from '../local/goals.ts';
import { demoAssets } from './scenario.ts';
export const demoGoalSubject = 'invented-demo-goals';
export const demoGoalRoot = 'bradesco-account';
export interface DemoGoalInput { title: string; targetCents: number; deadline: string | null }
export function createDemoGoals() {
  // Public synthetic scenario only. Never use this constant principal for private/live data.
  const goals = new MemoryGoals(() => ({ subject: demoGoalSubject, generation: 1, unlocked: true }));
  const root = demoAssets.find(asset => asset.id === demoGoalRoot)!;
  goals.setBudget({ ownerSubject: demoGoalSubject, root, revision: 1, allocatableCents: 600000, sourceReservesExcluded: true });
  goals.createGoal({ ownerSubject: demoGoalSubject, id: 'example-emergency', title: 'Reserva de emergência · exemplo', currency: 'BRL', targetCents: 500000, deadline: '2027-12-31' });
  goals.allocate('example-emergency', demoGoalRoot, 100000, 1);
  return goals;
}
