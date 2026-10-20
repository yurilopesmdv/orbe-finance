import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useScreenProtection } from '@/features/privacy/provider';
export function PrivateScreen({ children }: { children: ReactNode }) {
  const { snapshot, retry } = useScreenProtection(), router = useRouter();
  if (snapshot.phase === 'ready' && snapshot.active) return children;
  const failed = snapshot.phase === 'unavailable' || snapshot.phase === 'closed';
  return <SafeAreaView style={styles.safe}><View style={styles.page}>
    <Text style={styles.title}>{failed ? 'Acesso protegido indisponível' : snapshot.active ? 'Protegendo seu acesso…' : 'Seu acesso está protegido'}</Text>
    <Text style={styles.body}>{failed ? 'Não foi possível ativar a proteção de tela neste aparelho. Tente novamente. Seus dados de acesso permanecem ocultos.' : snapshot.active ? 'Aguarde enquanto o Orbe prepara a proteção de tela.' : 'Volte ao aplicativo para continuar.'}</Text>
    {failed && <><Pressable accessibilityRole="button" onPress={retry} style={styles.button}><Text style={styles.buttonText}>Tentar novamente</Text></Pressable><Pressable accessibilityRole="button" onPress={() => router.replace('/(tabs)/overview')} style={styles.button}><Text style={styles.buttonText}>Explorar demonstração</Text></Pressable></>}
  </View></SafeAreaView>;
}
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F6F8F3' }, page: { flex: 1, justifyContent: 'center', padding: 28, gap: 18 },
  title: { color: '#152F29', fontSize: 24, fontWeight: '600' }, body: { color: '#52675D', fontSize: 16, lineHeight: 24 },
  button: { backgroundColor: '#173F33', padding: 16, borderRadius: 12, minHeight: 48 }, buttonText: { color: '#FFFFFF', textAlign: 'center', fontWeight: '600' },
});
