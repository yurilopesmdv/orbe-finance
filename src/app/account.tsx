import { Redirect, useRouter } from 'expo-router';
import { Action, Body, Card, Screen } from '@/components/ui';
import { useAuth } from '@/features/auth/provider';
export default function AccountScreen() {
  const auth = useAuth(), router = useRouter();
  if (auth.snapshot.state !== 'unlocked') return <Redirect href="/login" />;
  return <Screen title="Seu acesso está pronto" subtitle="Você entrou com sua conta do Orbe." demonstration={false}>
    <Card title="Bancos ainda desconectados"><Body>Seu acesso foi confirmado. A integração bancária continua em preparação; nenhum saldo ou movimento real será buscado nesta versão.</Body></Card>
    <Action title="Explorar os dados demonstrativos" onPress={() => router.push('/(tabs)/overview')} />
    <Card title="Sua sessão"><Body>A senha não é salva no aplicativo. Esta versão exige conexão para confirmar seu acesso e mantém a sessão somente enquanto o app está aberto.</Body></Card>
    <Action title="Sair da conta" secondary onPress={() => { void auth.model?.logout(); }} />
  </Screen>;
}
