import { useLocalSearchParams, useRouter } from 'expo-router';
import { Action, Body, Card, Screen } from '@/components/ui';
import { Money, usePrivacy } from '@/components/privacy';
import { percentageLabel } from '@/components/comparison-label';
import { demoComposition, demoCompositionInstitution } from '@/data/demo/composition';
const institutions: Record<string, string> = { bradesco: 'Bradesco', 'mercado-pago': 'Mercado Pago', inter: 'Inter', nubank: 'Nubank', unclassified: 'Instituição não classificada' };
const classes: Record<string, string> = { account: 'Contas', investment: 'Investimentos', other: 'Outros ativos', unclassified: 'Classe não informada' };
export default function CompositionScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const privacy = usePrivacy();
  const institution = demoCompositionInstitution(params.institution);
  const back = () => router.canGoBack() ? router.back() : router.replace('/(tabs)/portfolio');
  if (institution === null || Object.keys(params).some(key => key !== 'institution')) return <Screen title="Composição indisponível" subtitle="Os filtros deste exemplo não são válidos."><Action title="Voltar à carteira" onPress={back} /></Screen>;
  const result = demoComposition(institution);
  return <Screen title="Composição da carteira" subtitle={`${institution ? institutions[institution] : 'Todas as instituições do exemplo'} · dados inventados · BRL.`}>
    <Action title="Voltar à carteira" secondary onPress={back} />
    <Action title={privacy.hidden ? 'Mostrar valores demonstrativos' : 'Ocultar valores'} secondary onPress={privacy.toggle} />
    <Card title="Subtotal conhecido"><Money cents={result.subtotalCents} prominent /><Body>{result.partial ? 'Composição parcial: este subtotal não representa todo o patrimônio.' : 'Somente os ativos informados neste cenário.'} Percentuais abaixo se referem apenas ao subtotal conhecido.</Body><Body>{result.mixedDates ? 'Fontes inventadas com datas diferentes.' : 'Fonte inventada.'} {result.asOfDates.map(date => date.split('-').reverse().join('/')).join(' e ')}.</Body></Card>
    {[{ title: 'Por instituição', groups: result.institutions, labels: institutions }, { title: 'Por classe', groups: result.classes, labels: classes }].map(section => <Card key={section.title} title={section.title}>
      {section.groups.length === 0 ? <Body>Nenhum componente conhecido para compor o subtotal.</Body> : section.groups.map(group => <Card key={group.id} title={section.labels[group.id] ?? 'Não classificado'}><Money cents={group.amountCents} /><Body>{percentageLabel(group.shareBasisPoints, privacy.hidden)}</Body></Card>)}
    </Card>)}
    <Card title="Sem contar duas vezes"><Body>Reservas já incluídas continuam dentro do ativo de origem. Metas e limites de crédito não acrescentam valor. Classificação por conta ou investimento não indica dinheiro livre para gastar.</Body></Card>
    <Card title="Evolução ainda indisponível"><Body>Não há dois snapshots completos de carteira neste cenário para mostrar evolução. Não estimamos histórico nem rentabilidade a partir desta composição.</Body></Card>
  </Screen>;
}
