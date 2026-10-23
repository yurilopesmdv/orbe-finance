import { Redirect, useRouter } from 'expo-router';
import { Action, Body, Card, Screen } from '@/components/ui';
import { useAuth } from '@/features/auth/provider';
export default function AccountScreen() {
  const auth = useAuth(), router = useRouter();
  if (auth.snapshot.state !== 'unlocked') return <Redirect href="/login" />;
  return <Screen title="Seu acesso está pronto" subtitle="Você entrou com sua conta do Orbe." demonstration={false}>
    <Card title="Suas conexões bancárias"><Body>Na primeira vez, abra Minhas conexões e toque em Preparar e ativar leitura. Depois atualize suas contas, movimentações e investimentos. Os dados demonstrativos ficam separados dos seus dados.</Body></Card>
    <Action title="Ver minhas contas" onPress={() => router.push('/my-accounts')} />
    <Action title="Ver meus investimentos" onPress={() => router.push('/my-investments')} />
    <Action title="Ver minhas movimentações" onPress={() => router.push('/my-movements')} />
    <Action title="Ver minhas conexões" onPress={() => router.push('/my-connections')} />
    <Action title="Explorar os dados demonstrativos" onPress={() => router.push('/(tabs)/overview')} />
    <Card title="Sua sessão"><Body>{auth.model?.hasRememberedAccess() ? 'Seu acesso será retomado automaticamente neste iPhone por até 30 dias, com internet. Sua senha não é salva. Ao ir para segundo plano, o conteúdo é bloqueado; ao voltar, o Orbe valida a sessão novamente.' : 'Seu acesso não está salvo neste iPhone. Ao sair do primeiro plano, entre novamente com sua senha. A senha não é salva pelo aplicativo.'}</Body><Body>Face ID não está disponível no Expo Go. Use Sair da conta para remover o acesso salvo deste aparelho.</Body>{auth.snapshot.error === 'secure_storage' && <Body>Não foi possível salvar o acesso no armazenamento seguro. Esta sessão funciona sem memorização.</Body>}</Card>
    <Action title="Sair da conta" secondary onPress={() => { void auth.model?.logout(); }} />
  </Screen>;
}
