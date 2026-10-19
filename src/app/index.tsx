import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { runtime } from '@/config/runtime';
import { useRouter } from 'expo-router';
import { useAuth } from '@/features/auth/provider';
import { Action } from '@/components/ui';

export default function WelcomeScreen() {
  const router = useRouter();
  const auth = useAuth();
  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.page}>
        <Text style={styles.wordmark}>orbe</Text>
        <View style={styles.badge} accessibilityRole="text">
          <Text style={styles.badgeText}>AMBIENTE DE DEMONSTRAÇÃO</Text>
        </View>
        <Text accessibilityRole="header" style={styles.title}>Suas finanças,{'\n'}com clareza.</Text>
        <Text style={styles.description}>Contas, gastos e investimentos em uma visão simples, com os detalhes que você precisa.</Text>
        <View style={styles.card}>
          <Text accessibilityRole="header" style={styles.cardTitle}>Estamos preparando seu Orbe</Text>
          <Text style={styles.body}>Explore a estrutura do aplicativo com dados demonstrativos. Login, relatórios e conexão por Open Finance continuam em desenvolvimento.</Text>
          <View style={styles.divider} />
          <Text style={styles.body}>Nenhum banco conectado. A demonstração não solicita senhas bancárias nem dados financeiros.</Text>
        </View>
        {auth.configured && <Action title="Entrar no Orbe" onPress={() => router.push('/login')} />}
        <View style={{ height: 12 }} />
        <Action title="Explorar demonstração" onPress={() => router.replace('/(tabs)/overview')} />
        <Text style={styles.footnote}>Orbe Finance · 0.1.0 · {runtime.dataMode === 'synthetic' ? 'Dados demonstrativos' : ''}</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F6F8F3' },
  page: { padding: 28, paddingTop: 36, flexGrow: 1, maxWidth: 600, width: '100%', alignSelf: 'center' },
  wordmark: { fontSize: 32, fontWeight: '700', letterSpacing: -1.5, color: '#173F33', marginBottom: 48 },
  badge: { backgroundColor: '#E1EBE2', paddingHorizontal: 12, paddingVertical: 10, borderRadius: 10, alignSelf: 'flex-start', marginBottom: 24 },
  badgeText: { fontSize: 11, fontWeight: '700', letterSpacing: 1, color: '#234F3D' },
  title: { fontSize: 38, lineHeight: 44, letterSpacing: -1.3, fontWeight: '600', color: '#152F29', marginBottom: 18 },
  description: { fontSize: 17, lineHeight: 26, color: '#52675D', marginBottom: 32 },
  card: { backgroundColor: '#FFFFFF', borderRadius: 22, borderWidth: 1, borderColor: '#DCE3DA', padding: 22, marginBottom: 32 },
  cardTitle: { fontSize: 20, lineHeight: 27, fontWeight: '600', color: '#173F33', marginBottom: 12 },
  body: { fontSize: 15, lineHeight: 24, color: '#52675D' },
  divider: { height: 1, backgroundColor: '#E5EAE2', marginVertical: 18 },
  footnote: { fontSize: 12, lineHeight: 20, color: '#52675D', marginTop: 'auto' },
});
