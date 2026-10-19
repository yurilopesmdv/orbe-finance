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
  const demo = useDemo();
  const privacy = usePrivacy();
  const [example, setExample] = useState<DataState>('disconnected');
  return <Screen title="Ajustes" subtitle="Entenda o que está disponível nesta versão.">
    <Card title="Sua privacidade"><Body>Esta versão usa apenas demonstrações. Não solicita senha, não conecta bancos e não envia informações financeiras.</Body></Card>
    <Card title="Acesso ao Orbe"><Body>Login por senha ainda não está integrado. Face ID exige uma versão própria compatível e não está habilitado no Expo Go.</Body></Card>
    <Card title="Open Finance"><Body>Bradesco e Mercado Pago PF são as primeiras instituições planejadas. A disponibilidade de contas, investimentos e cofrinhos ainda precisa ser confirmada por instituição.</Body></Card>
    <Card title="Prévia dos estados da interface"><Body>Escolha um exemplo. Estes controles mostram mensagens demonstrativas; não iniciam uma consulta.</Body>{examples.map(item => <Action key={item.state} title={item.label} secondary selected={example === item.state} onPress={() => setExample(item.state)} />)}</Card>
    <StateCard state={example} />
    <Action title="Sair da demonstração" secondary onPress={() => { demo.reset(); if (!privacy.hidden) privacy.toggle(); router.replace('/'); }} />
    <Body>Orbe Finance · 0.1.0 · Ambiente demonstrativo</Body>
  </Screen>;
}
