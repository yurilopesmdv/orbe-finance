import { createContext, useContext, useMemo, useRef, useState, type ReactNode } from 'react';
import type { ClassificationFields } from '../../domain/classification';
import type { LocalMovement } from '../local/query';
import type { MemoryGoals } from '../local/goals';
import { demoMovements } from './scenario';
import { applyDemoOverrides } from './overrides';
import { createDemoGoals, demoGoalRoot, demoGoalSubject, type DemoGoalInput } from './goals';
interface DemoValue {
  movements: LocalMovement[];
  corrections: Record<string, ClassificationFields>;
  correct(id: string, fields: ClassificationFields): void;
  reload(): void;
  reset(): void;
  goals: ReturnType<MemoryGoals['list']>;
  createGoal(input: DemoGoalInput): void;
  allocateGoal(id: string, cents: number, revision: number): void;
  deleteGoal(id: string): void;
}
const Context = createContext<DemoValue | null>(null);
export function DemoProvider({ children }: { children: ReactNode }) {
  const [corrections, setCorrections] = useState<Record<string, ClassificationFields>>({});
  const [source, setSource] = useState(() => demoMovements.map(m => ({ ...m })));
  const [goalStore, setGoalStore] = useState(createDemoGoals);
  const [goalRevision, setGoalRevision] = useState(0);
  const goalCounter = useRef(0);
  const goals = useMemo(() => goalStore.list(), [goalStore, goalRevision]);
  const changedGoals = () => setGoalRevision(value => value + 1);
  const reset = () => {
    setCorrections({}); setSource(demoMovements.map(m => ({ ...m })));
    goalStore.close(); setGoalStore(createDemoGoals()); setGoalRevision(0); goalCounter.current = 0;
  };
  return <Context.Provider value={{
    movements: applyDemoOverrides(source, corrections), corrections,
    correct: (id, fields) => setCorrections(current => ({ ...current, [id]: { ...current[id], ...fields } })),
    reload: () => setSource(demoMovements.map(m => ({ ...m }))), reset, goals,
    createGoal: input => { goalStore.createGoal({ ...input, id: `demo-goal-${++goalCounter.current}`, ownerSubject: demoGoalSubject, currency: 'BRL' }); changedGoals(); },
    allocateGoal: (id, cents, revision) => { goalStore.allocate(id, demoGoalRoot, cents, revision); changedGoals(); },
    deleteGoal: id => { goalStore.deleteGoal(id); changedGoals(); },
  }}>{children}</Context.Provider>;
}
export function useDemo() { const value = useContext(Context); if (!value) throw new Error('demo_provider_missing'); return value; }
