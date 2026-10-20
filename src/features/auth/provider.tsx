import { createContext, useContext, useEffect, useState, useSyncExternalStore, type ReactNode } from 'react';
import { fetch as expoFetch } from 'expo/fetch';
import { AppState } from 'react-native';
import { observeActivity } from './lifecycle';
import { publicAuthConfig } from '@/config/auth';
import { createAuthGateway } from './gateway';
import { runtime } from '@/config/runtime';
import { createNativeRefreshVault } from './native-vault';
import { SessionModel, type SessionSnapshot } from './session';
const Context = createContext<SessionModel | null>(null);
const locked: SessionSnapshot = Object.freeze({ state: 'locked', error: null });
const snapshot = () => locked;
const subscribe = () => () => {};
export function AuthProvider({ children }: { children: ReactNode }) {
  const [model] = useState(() => {
    if (!publicAuthConfig) return null;
    try { return new SessionModel(createAuthGateway(publicAuthConfig,expoFetch), Date.now, undefined, runtime.rememberedLoginEnabled ? createNativeRefreshVault(publicAuthConfig.origin) : undefined); } catch { return null; }
  });
  useEffect(() => {
    if (!model) return;
    const stop = observeActivity(AppState, active => model.setActive(active));
    return () => { stop(); model.setActive(false); };
  }, [model]);
  return <Context.Provider value={model}>{children}</Context.Provider>;
}
export function useAuth() {
  const model = useContext(Context);
  const state = useSyncExternalStore(model?.subscribe ?? subscribe, model?.getSnapshot ?? snapshot, snapshot);
  return { model, snapshot: state, configured: model !== null };
}
