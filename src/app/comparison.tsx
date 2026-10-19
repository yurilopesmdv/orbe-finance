import { useLocalSearchParams, useRouter } from 'expo-router';
import { Action, Body, Card, Screen } from '@/components/ui';
import { Money, usePrivacy } from '@/components/privacy';
import { comparisonReasons, percentageLabel } from '@/components/comparison-label';
import { demoComparisonFilters, demoMonthComparison } from '@/data/demo/comparison';
import { filterSummary } from '@/data/demo/filters';
import { useDemo } from '@/data/demo/store';

const monthLabel = (month: string) => `${month.slice(5)}/${month.slice(0, 4)}`;
export default function ComparisonScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const privacy = usePrivacy();
  const demo = useDemo();
  const filters = demoComparisonFilters(params);
  const back = () => router.canGoBack() ? router.back() : router.replace('/reports');
  if (!filters) return <Screen title="Comparação indisponível" subtitle="Os filtros deste exemplo não são válidos."><Action title="Voltar ao relatório" onPress={back} /></Screen>;
  const result = demoMonthComparison(demo.movements, filters);
  return <Screen title="Comparar meses" subtitle="Gastos líquidos nos mesmos filtros · cenário inventado · BRL.">
    <Action title="Voltar ao relatório" secondary onPress={back} />
    <Action title={privacy.hidden ? 'Mostrar valores demonstrativos' : 'Ocultar valores'} secondary onPress={privacy.toggle} />
    <Card title="Filtros preservados"><Body>{filterSummary(filters)}</Body></Card>
    {[{ label: 'Mês selecionado', value: result.current }, { label: 'Mês anterior', value: result.previous }].map(item => <Card key={item.value.month} title={`${item.label} · ${monthLabel(item.value.month)}`}>
      <Money cents={item.value.netCents} />
      <Body>{item.value.coverage === 'missing' ? 'Sem histórico disponível neste cenário.' : item.value.coverage === 'partial' ? 'Período parcial: valor observado até a data informada.' : 'Período encerrado, com cobertura completa apenas do cenário inventado.'}</Body>
      <Body>{item.value.observedAt ? `Observação inventada de ${item.value.observedAt.split('-').reverse().join('/')}.` : 'Sem data de observação disponível.'}</Body>
    </Card>)}
    <Card title="Diferença observada"><Money cents={result.deltaCents} /><Body>Mês selecionado menos o anterior. {result.partial ? 'Comparação parcial; não é projeção do fechamento do mês.' : 'Somente os dois períodos e filtros informados.'}</Body></Card>
    <Card title="Variação percentual"><Body>{percentageLabel(result.percentageBasisPoints, privacy.hidden)}</Body><Body>{privacy.hidden ? 'Mostre os valores para ver a explicação da comparação.' : result.percentageUnavailableReason ? comparisonReasons[result.percentageUnavailableReason] : 'Base anterior positiva, dois meses encerrados e cobertura completa do cenário.'}</Body></Card>
    <Card title="Como interpretar"><Body>Despesas efetivadas menos estornos vinculados; transferências próprias, aportes e pagamento de fatura não são novos gastos. O exemplo usa movimentações de conta, sem detalhar compras de cartão. Nenhum histórico foi gerado além dos períodos definidos do cenário. Esta comparação não calcula rentabilidade.</Body></Card>
  </Screen>;
}
