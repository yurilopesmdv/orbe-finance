import { PrivateScreen } from './private-screen';
import type { ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {palette} from './theme';
export {palette} from './theme';
export function Screen({ title, subtitle, children, demonstration = true }: { title: string; subtitle: string; children: ReactNode; demonstration?: boolean }) {
  const content = <SafeAreaView style={ui.safe} edges={['top', 'left', 'right']}>
    <ScrollView contentContainerStyle={ui.page}>
      <View style={ui.brandRow}><View style={ui.brandMark}/><Text style={ui.brand}>orbe<Text style={ui.brandSuffix}> / pessoal</Text></Text></View>
      <Text style={ui.badge}>{demonstration ? 'DEMONSTRAÇÃO · DADOS INVENTADOS' : 'SUA VIDA FINANCEIRA'}</Text>
      <Text accessibilityRole="header" style={ui.title}>{title}</Text>
      <Text style={ui.subtitle}>{subtitle}</Text>
      {children}
    </ScrollView>
  </SafeAreaView>;
  return demonstration ? content : <PrivateScreen>{content}</PrivateScreen>;
}
export function Card({ title, children }: { title: string; children: ReactNode }) {
  return <View style={ui.card}><Text accessibilityRole="header" style={ui.cardTitle}>{title}</Text>{children}</View>;
}
export function Body({ children }: { children: ReactNode }) { return <Text style={ui.body}>{children}</Text>; }
export function Action({ title, onPress, secondary = false, selected, disabled = false }: { title: string; onPress: () => void; secondary?: boolean; selected?: boolean; disabled?: boolean }) {
  return <Pressable accessibilityRole="button" accessibilityState={{ disabled, ...(selected === undefined ? {} : { selected }) }} disabled={disabled} onPress={onPress} style={({ pressed }) => [ui.button, secondary && ui.secondary, selected && ui.selected, (pressed || disabled) && { opacity: 0.65 }]}>
    <Text style={[ui.buttonText, secondary && ui.secondaryText, selected && ui.selectedText]}>{title}</Text>
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
  page: { padding: 22, paddingBottom: 32, maxWidth: 640, width: '100%', alignSelf: 'center', gap: 16 },
  brandRow: {flexDirection:'row',alignItems:'center',gap:10},
  brandMark: {width:18,height:18,borderRadius:9,borderWidth:5,borderColor:palette.accent},
  brandSuffix: {fontSize:13,fontWeight:'400',letterSpacing:0,color:palette.muted},
  brand: { fontSize: 26, fontWeight: '700', letterSpacing: -1, color: palette.accent },
  badge: { fontSize: 10, fontWeight: '600', letterSpacing: 1.5, color: palette.muted, alignSelf: 'flex-start' },
  title: { fontSize: 34, lineHeight: 39, fontWeight: '700', letterSpacing: -1.1, color: palette.ink },
  subtitle: { fontSize: 16, lineHeight: 24, color: palette.muted, marginBottom: 8 },
  card: { backgroundColor: palette.surface, borderRadius: 18, borderWidth: 1, borderColor: palette.line, padding: 20, gap: 12 },
  cardTitle: { fontSize: 19, lineHeight: 26, color: palette.ink, fontWeight: '600' },
  body: { fontSize: 15, lineHeight: 23, color: palette.muted },
  button: { minHeight: 48, borderRadius: 12, paddingVertical: 14, paddingHorizontal: 16, backgroundColor: palette.accent, justifyContent: 'center' },
  buttonText: { fontSize: 15, fontWeight: '600', textAlign: 'center', color: palette.onAccent },
  secondary: { backgroundColor: palette.accentSoft },
  secondaryText: { color: palette.accent },
  selected: {backgroundColor:palette.accent,borderWidth:1,borderColor:palette.accent},
  selectedText: {color:palette.onAccent},
});
