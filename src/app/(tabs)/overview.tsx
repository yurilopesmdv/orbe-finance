import { useRouter } from 'expo-router';
import { Action, Body, Card, Screen, StateCard } from '@/components/ui';

export default function OverviewScreen() {
  const router = useRouter();
  return <Screen title="Sua visão geral" subtitle="Um lugar para entender suas contas, gastos e investimentos.">
    <StateCard state="disconnected" />
    <Card title="Clareza antes dos números"><Body>Saldo, fonte e data ficarão juntos. Quando faltar informação, você verá um subtotal identificado, sem tratar ausência como zero.</Body></Card>
    <Card title="Seus gastos, em contexto"><Body>Veja o que foi consumo, transferência ou investimento, com categorias que você pode revisar.</Body><Action title="Ver movimentações" onPress={() => router.navigate('/(tabs)/movements')} /></Card>
    <Action title="Segurança e conexões" secondary onPress={() => router.navigate('/(tabs)/settings')} />
  </Screen>;
}
