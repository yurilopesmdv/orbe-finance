import { createContext, useContext, useEffect, useState, useSyncExternalStore, type ReactNode } from 'react';
import { AppState } from 'react-native';
import { observeActivity } from '@/features/auth/lifecycle';
import { ScreenProtectionModel, type ScreenSnapshot } from './screen-protection';
import { createNativeScreenPorts } from './native-screen';
const pending: ScreenSnapshot = Object.freeze({ phase: 'preparing', active: false });
const Context = createContext<ScreenProtectionModel | null>(null);
const snapshot = () => pending, subscribe = () => () => {};
export function ScreenProtectionProvider({ children }: { children: ReactNode }) {
  const [model, setModel] = useState<ScreenProtectionModel | null>(null);
  useEffect(() => {
    // Each effect lifetime owns a separate native key, including StrictMode remounts.
    const current = new ScreenProtectionModel(createNativeScreenPorts()); setModel(current);
    const stop = observeActivity(AppState, active => current.setActive(active));
    void current.start();
    return () => { stop(); current.close(); };
  }, []);
  return <Context.Provider value={model}>{children}</Context.Provider>;
}
export function useScreenProtection() {
  const model = useContext(Context);
  const state = useSyncExternalStore(model?.subscribe ?? subscribe, model?.getSnapshot ?? snapshot, snapshot);
  return { snapshot: state, retry: () => { void model?.start(); } };
}
