import { useRouter } from 'expo-router';
import { Action, Body, Card, Screen } from '@/components/ui';
import { Money, usePrivacy } from '@/components/privacy';
import { useDemo } from '@/data/demo/store';
import { queryMovements } from '@/data/local/query';
import { demoOverview, demoSourceDate } from '@/data/demo/scenario';
export default function OverviewScreen() {
  const router = useRouter();
  const privacy = usePrivacy();
  const { portfolio } = demoOverview();
  const demo = useDemo();
  const expenses = queryMovements(demo.movements, { month: '2026-10' }, true).summary;
  return <Screen title="Sua visão geral" subtitle="Outubro de 2026 · cenário inventado, sem bancos conectados.">
    <Action title={privacy.hidden ? 'Mostrar valores demonstrativos' : 'Ocultar valores'} secondary onPress={privacy.toggle} />
    <Card title="Subtotal de ativos · parcial">
      <Money cents={portfolio.subtotalCents} prominent />
      <Body>Exemplos Bradesco + Mercado Pago · fontes de 18 e {demoSourceDate}. Investimentos do Mercado Pago não informados neste cenário.</Body>
      <Body>Reservas já incluídas nas contas não são somadas novamente. Este subtotal não representa patrimônio completo.</Body>
      <Action title="Entender a carteira" secondary onPress={() => router.navigate('/(tabs)/portfolio')} />
    </Card>
    <Card title="Gastos líquidos de outubro">
      <Money cents={expenses.netCents} />
      <Body>Despesas efetivadas menos estornos vinculados. Transferências próprias ficam fora. Base: movimentações inventadas de conta; compras de cartão não integradas.</Body>
      <Body>Exemplos Bradesco + Mercado Pago · dados até {demoSourceDate}. Cobertura de consumo parcial sem compras de cartão.</Body>
      <Action title="Ver movimentações do período" onPress={() => router.navigate('/(tabs)/movements')} />
    </Card>
    <Card title="Conexões"><Body>Nenhum banco conectado. Os números acima são inventados para explorar o produto.</Body><Action title="Segurança e conexões" secondary onPress={() => router.navigate('/(tabs)/settings')} /></Card>
  </Screen>;
}
