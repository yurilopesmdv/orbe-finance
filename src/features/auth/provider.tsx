import { createContext, useContext, useEffect, useState, useSyncExternalStore, type ReactNode } from 'react';
import { publicAuthConfig } from '@/config/auth';
import { createAuthGateway } from './gateway';
import { SessionModel, type SessionSnapshot } from './session';
const Context = createContext<SessionModel | null>(null);
const locked: SessionSnapshot = Object.freeze({ state: 'locked', error: null });
const snapshot = () => locked;
const subscribe = () => () => {};
export function AuthProvider({ children }: { children: ReactNode }) {
  const [model] = useState(() => {
    if (!publicAuthConfig) return null;
    try { return new SessionModel(createAuthGateway(publicAuthConfig)); } catch { return null; }
  });
  useEffect(() => () => model?.lock(), [model]);
  return <Context.Provider value={model}>{children}</Context.Provider>;
}
export function useAuth() {
  const model = useContext(Context);
  const state = useSyncExternalStore(model?.subscribe ?? subscribe, model?.getSnapshot ?? snapshot, snapshot);
  return { model, snapshot: state, configured: model !== null };
}
