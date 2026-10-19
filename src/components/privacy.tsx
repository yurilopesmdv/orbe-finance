import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { AppState, Text } from 'react-native';
import { palette } from './ui';
const Context = createContext<{ hidden: boolean; toggle: () => void }>({ hidden: true, toggle: () => {} });
export function PrivacyProvider({ children }: { children: ReactNode }) {
  const [hidden, setHidden] = useState(true);
  useEffect(() => {
    const subscription = AppState.addEventListener('change', state => { if (state !== 'active') setHidden(true); });
    return () => subscription.remove();
  }, []);
  return <Context.Provider value={{ hidden, toggle: () => setHidden(value => !value) }}>{children}</Context.Provider>;
}
export const usePrivacy = () => useContext(Context);
export function Money({ cents, prominent = false }: { cents: number | null; prominent?: boolean }) {
  const { hidden } = usePrivacy();
  const text = hidden ? 'Valor oculto' : cents === null ? 'Não informado' : new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cents / 100);
  return <Text style={{ fontSize: prominent ? 32 : 22, fontWeight: '600', color: palette.ink }} accessibilityLabel={text}>{text}</Text>;
}
