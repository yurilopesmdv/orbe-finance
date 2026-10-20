import { Redirect, useRouter } from 'expo-router';
import { Action, Body, Card, Screen } from '@/components/ui';
import { useAuth } from '@/features/auth/provider';
export default function AccountScreen() {
  const auth = useAuth(), router = useRouter();
  if (auth.snapshot.state !== 'unlocked') return <Redirect href="/login" />;
  return <Screen title="Seu acesso está pronto" subtitle="Você entrou com sua conta do Orbe." demonstration={false}>
    <Card title="Bancos ainda desconectados"><Body>Seu acesso foi confirmado. A integração bancária continua em preparação; nenhum saldo ou movimento real será buscado nesta versão.</Body></Card>
    <Action title="Ver minhas conexões" onPress={() => router.push('/my-connections')} />
    <Action title="Explorar os dados demonstrativos" onPress={() => router.push('/(tabs)/overview')} />
    <Card title="Sua sessão"><Body>A senha não é salva no aplicativo. Ao sair do primeiro plano, sua sessão é bloqueada. Ao voltar, entre novamente. O acesso exige conexão e a senha não é salva pelo aplicativo.</Body></Card>
    <Action title="Sair da conta" secondary onPress={() => { void auth.model?.logout(); }} />
  </Screen>;
}
