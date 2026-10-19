import type { ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export const palette = { background: '#F6F8F3', surface: '#FFFFFF', ink: '#152F29', muted: '#52675D', line: '#DCE3DA', green: '#173F33' };
export function Screen({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  return <SafeAreaView style={ui.safe} edges={['top', 'left', 'right']}>
    <ScrollView contentContainerStyle={ui.page}>
      <Text style={ui.brand}>orbe</Text>
      <Text style={ui.badge}>DEMONSTRAÇÃO · DADOS INVENTADOS</Text>
      <Text accessibilityRole="header" style={ui.title}>{title}</Text>
      <Text style={ui.subtitle}>{subtitle}</Text>
      {children}
    </ScrollView>
  </SafeAreaView>;
}
export function Card({ title, children }: { title: string; children: ReactNode }) {
  return <View style={ui.card}><Text accessibilityRole="header" style={ui.cardTitle}>{title}</Text>{children}</View>;
}
export function Body({ children }: { children: ReactNode }) { return <Text style={ui.body}>{children}</Text>; }
export function Action({ title, onPress, secondary = false, selected }: { title: string; onPress: () => void; secondary?: boolean; selected?: boolean }) {
  return <Pressable accessibilityRole="button" accessibilityState={selected === undefined ? undefined : { selected }} onPress={onPress} style={({ pressed }) => [ui.button, secondary && ui.secondary, pressed && { opacity: 0.75 }]}>
    <Text style={[ui.buttonText, secondary && ui.secondaryText]}>{title}</Text>
  </Pressable>;
}
export type DataState = 'loading' | 'empty' | 'disconnected' | 'partial' | 'stale' | 'error' | 'locked';
const states: Record<DataState, { title: string; body: string }> = {
  loading: { title: 'Buscando dados', body: 'Aguarde a confirmação da fonte. Um saldo ainda não recebido não é zero.' },
  empty: { title: 'Nenhuma movimentação no período', body: 'A consulta terminou sem movimentos para os filtros escolhidos.' },
  disconnected: { title: 'Nenhum banco conectado', body: 'A conexão por Open Finance ainda não está disponível nesta demonstração.' },
  partial: { title: 'Dados parciais', body: 'Uma fonte está incompleta. O subtotal disponível não representa todo o seu patrimônio.' },
  stale: { title: 'Dados desatualizados', body: 'A última informação disponível pode ter mudado. Consulte a data da fonte antes de decidir.' },
  error: { title: 'Não foi possível buscar os dados', body: 'A consulta falhou. Isso não significa que sua conta está vazia.' },
  locked: { title: 'Acesso bloqueado', body: 'Em uma sessão privada, seria necessário entrar novamente antes de mostrar seus dados.' },
};
export function StateCard({ state }: { state: DataState }) {
  return <Card title={states[state].title}><Body>{states[state].body}</Body></Card>;
}
export const ui = StyleSheet.create({
  safe: { flex: 1, backgroundColor: palette.background },
  page: { padding: 24, paddingBottom: 32, maxWidth: 640, width: '100%', alignSelf: 'center', gap: 16 },
  brand: { fontSize: 28, fontWeight: '700', letterSpacing: -1, color: palette.green },
  badge: { fontSize: 11, fontWeight: '700', letterSpacing: 0.7, color: palette.green, backgroundColor: '#E1EBE2', padding: 10, borderRadius: 8, alignSelf: 'flex-start' },
  title: { fontSize: 32, lineHeight: 39, fontWeight: '600', letterSpacing: -0.8, color: palette.ink },
  subtitle: { fontSize: 16, lineHeight: 24, color: palette.muted, marginBottom: 8 },
  card: { backgroundColor: palette.surface, borderRadius: 20, borderWidth: 1, borderColor: palette.line, padding: 20, gap: 12 },
  cardTitle: { fontSize: 19, lineHeight: 26, color: palette.ink, fontWeight: '600' },
  body: { fontSize: 15, lineHeight: 23, color: palette.muted },
  button: { minHeight: 48, borderRadius: 12, paddingVertical: 14, paddingHorizontal: 16, backgroundColor: palette.green, justifyContent: 'center' },
  buttonText: { fontSize: 15, fontWeight: '600', textAlign: 'center', color: '#FFFFFF' },
  secondary: { backgroundColor: '#E1EBE2' },
  secondaryText: { color: palette.green },
});
