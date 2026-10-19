import { createContext, useContext, useState, type ReactNode } from 'react';
import type { ClassificationFields } from '../../domain/classification';
import { demoMovements } from './scenario';
import { applyDemoOverrides } from './overrides';
const Context = createContext({ movements: [...demoMovements], corrections: {} as Record<string, ClassificationFields>, correct: (_id: string, _fields: ClassificationFields) => {}, reload: () => {}, reset: () => {} });
export function DemoProvider({ children }: { children: ReactNode }) {
  const [corrections, setCorrections] = useState<Record<string, ClassificationFields>>({});
  const [source, setSource] = useState(() => demoMovements.map(m => ({ ...m })));
  return <Context.Provider value={{ movements: applyDemoOverrides(source, corrections), corrections, correct: (id, fields) => setCorrections(current => ({ ...current, [id]: { ...current[id], ...fields } })), reload: () => setSource(demoMovements.map(m => ({ ...m }))), reset: () => { setCorrections({}); setSource(demoMovements.map(m => ({ ...m }))); } }}>{children}</Context.Provider>;
}
export const useDemo = () => useContext(Context);
