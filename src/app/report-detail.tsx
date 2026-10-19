import { filterSummary } from '@/data/demo/filters';
import { useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Action, Body, Card, Screen, StateCard } from '@/components/ui';
import { Money, usePrivacy } from '@/components/privacy';
import { useDemo } from '@/data/demo/store';
import { demoReportFilters } from '@/data/demo/report-route';
import { categoryLabel, financialTypes, institutionLabel, institutionSourceDate } from '@/data/demo/labels';
import { spendingReport } from '@/data/local/reports';
import { queryMovements } from '@/data/local/query';
import { movementKey } from '@/data/demo/overrides';
export default function ReportDetailScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const demo = useDemo();
  const privacy = usePrivacy();
  const [offset, setOffset] = useState(0);
  const filters = demoReportFilters(params);
  const back = () => router.canGoBack() ? router.back() : router.replace('/reports');
  if (!filters) return <Screen title="Detalhe indisponível" subtitle="Os filtros deste exemplo não são válidos."><Action title="Voltar ao relatório" onPress={back} /></Screen>;
  const { scopeCategoryId, ...movementFilters } = filters;
  const result = queryMovements(demo.movements, { ...movementFilters, offset, limit: 3 }, true);
  const globalPartial = spendingReport(demo.movements, { ...movementFilters, categoryId: scopeCategoryId }, true).summary.partial;
  return <Screen title={categoryLabel(filters.categoryId)} subtitle={`${filters.month === '2026-10' ? 'Outubro' : 'Setembro'} de 2026 · ${institutionLabel(filters.institutionId)} · BRL · dados inventados.`}>
    <Action title="Voltar ao relatório" secondary onPress={back} />
    <Action title={privacy.hidden ? 'Mostrar valores demonstrativos' : 'Ocultar valores'} secondary onPress={privacy.toggle} />
    <Card title="Filtros preservados"><Body>{filterSummary(filters)}</Body></Card>
    <Card title="Gasto líquido desta categoria"><Money cents={result.summary.netCents} prominent /><Body>Mesmos filtros do relatório, com a categoria selecionada. Base de conta, sem compras de cartão; cobertura do consumo parcial. Fonte inventada de {institutionSourceDate(filters.institutionId)}.</Body>{(result.summary.partial || globalPartial) && <Body>Subtotal parcial: há dados ou classificações pendentes.</Body>}</Card>
    {result.items.length === 0 && <StateCard state="empty" />}
    {result.items.map(m => <Card key={movementKey(m)} title={m.description}><Money cents={m.amountCents} /><Body>{m.occurredAt.split('-').reverse().join('/')} · {institutionLabel(m.institutionId)} · {financialTypes.find(t => t.id === m.type)?.label} · {m.status === 'posted' ? 'Efetivado' : m.status === 'pending' ? 'Pendente' : 'Cancelado'} · {m.direction === 'debit' ? 'Saída' : 'Entrada'}</Body></Card>)}
    {offset > 0 && <Action title="Página anterior" secondary onPress={() => setOffset(Math.max(0, offset - 3))} />}
    {result.nextOffset !== null && <Action title="Próxima página" secondary onPress={() => setOffset(result.nextOffset ?? 0)} />}
    <Body>Transferências podem aparecer na lista, mas não entram como consumo. Correções de tipo/categoria ficam na aba Movimentações.</Body>
  </Screen>;
}
