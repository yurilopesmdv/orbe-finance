import { useAuth } from '@/features/auth/provider';
import { useDemo } from '@/data/demo/store';
import { usePrivacy } from '@/components/privacy';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { Action, Body, Card, Screen, StateCard, type DataState } from '@/components/ui';
const examples: { state: DataState; label: string }[] = [
  { state: 'loading', label: 'Carregando' }, { state: 'empty', label: 'Período vazio' },
  { state: 'disconnected', label: 'Sem conexão' }, { state: 'partial', label: 'Dados parciais' },
  { state: 'stale', label: 'Desatualizado' }, { state: 'error', label: 'Erro de consulta' },
  { state: 'locked', label: 'Acesso bloqueado' },
];
export default function SettingsScreen() {
  const router = useRouter();
  const auth = useAuth();
  const demo = useDemo();
  const privacy = usePrivacy();
  const [example, setExample] = useState<DataState>('disconnected');
  return <Screen title="Ajustes" subtitle="Entenda o que está disponível nesta versão.">
    <Card title="Sua privacidade"><Body>As telas financeiras usam apenas dados inventados. Nenhum banco está conectado. Seu acesso ao Orbe é separado da demonstração e não usa senha bancária.</Body></Card>
    <Card title="Acesso ao Orbe">
      <Body>{auth.configured ? (auth.snapshot.state === 'unlocked' ? 'Seu acesso por senha está ativo. Os dados financeiros continuam demonstrativos.' : 'Entre com a conta e a senha do proprietário. A demonstração pode ser explorada separadamente.') : 'O login ainda não foi configurado neste ambiente. A demonstração continua disponível.'}</Body>
      <Body>Face ID não está habilitado no Expo Go. Ao sair do aplicativo, a sessão de acesso é bloqueada e pede sua senha novamente.</Body>
      {auth.configured && <Action title={auth.snapshot.state === 'unlocked' ? 'Ver meu acesso ao Orbe' : 'Entrar no Orbe'} secondary onPress={() => router.push(auth.snapshot.state === 'unlocked' ? '/account' : '/login')} />}
    </Card>
    <Card title="Open Finance"><Body>Bradesco e Mercado Pago PF são prioritários. Entenda como será a conexão e o que ainda precisa ser confirmado.</Body><Action title="Ver conexões e funcionamento" secondary onPress={() => router.push('/connections')} /></Card>
    <Card title="Prévia dos estados da interface"><Body>Escolha um exemplo. Estes controles mostram mensagens demonstrativas; não iniciam uma consulta.</Body>{examples.map(item => <Action key={item.state} title={item.label} secondary selected={example === item.state} onPress={() => setExample(item.state)} />)}</Card>
    <StateCard state={example} />
    <Action title="Sair da demonstração" secondary onPress={() => { demo.reset(); if (!privacy.hidden) privacy.toggle(); router.replace('/'); }} />
    <Body>Orbe Finance · 0.1.0 · Ambiente demonstrativo</Body>
  </Screen>;
}
