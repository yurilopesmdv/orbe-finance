import { demoAccounts, filterSummary } from '@/data/demo/filters';
import { categoryOptions } from '@/data/demo/overrides';
import type { FinancialType } from '@/domain/expenses';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { Action, Body, Card, Screen, StateCard } from '@/components/ui';
import { Money, usePrivacy } from '@/components/privacy';
import { useDemo } from '@/data/demo/store';
import { spendingReport } from '@/data/local/reports';
import { categoryLabel, financialTypes, institutionLabel, institutionSourceDate } from '@/data/demo/labels';
export default function ReportsScreen() {
  const router = useRouter();
  const privacy = usePrivacy();
  const demo = useDemo();
  const [month, setMonth] = useState('2026-10');
  const [institution, setInstitution] = useState<string>();
  const [account, setAccount] = useState<string>();
  const [type, setType] = useState<FinancialType>();
  const [category, setCategory] = useState<string | null>();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [explain, setExplain] = useState(false);
  const result = spendingReport(demo.movements, { month, institutionId: institution, accountId: account, type, categoryId: category }, true);
  return <Screen title="Relatório de gastos" subtitle={`${month === '2026-10' ? 'Outubro' : 'Setembro'} de 2026 · ${institutionLabel(institution)} · BRL · dados inventados.`}>
    <Action title="Voltar à visão geral" secondary onPress={() => router.back()} />
    <Action title={privacy.hidden ? 'Mostrar valores demonstrativos' : 'Ocultar valores'} secondary onPress={privacy.toggle} />
    <Card title="Filtros atuais"><Body>{filterSummary({ month, institutionId: institution, accountId: account, type, categoryId: category })}</Body></Card>
    <Action title={filtersOpen ? 'Fechar filtros do relatório' : 'Escolher filtros do relatório'} secondary onPress={() => setFiltersOpen(value => !value)} />
    {filtersOpen && <Card title="Período e instituição">
      <Action title={month === '2026-10' ? 'Ver setembro de 2026' : 'Ver outubro de 2026'} secondary onPress={() => setMonth(month === '2026-10' ? '2026-09' : '2026-10')} />
      {[{ id: undefined, label: 'Todas as instituições' }, { id: 'bradesco', label: 'Bradesco' }, { id: 'mercado-pago', label: 'Mercado Pago' }].map(item => <Action key={item.label} title={item.label} selected={institution === item.id} secondary onPress={() => { setInstitution(item.id); if (item.id && demoAccounts.find(a => a.id === account)?.institution !== item.id) setAccount(undefined); }} />)}
      <Body>Conta</Body>
      <Action title="Todas as contas" secondary selected={account === undefined} onPress={() => setAccount(undefined)} />
      {demoAccounts.filter(a => institution === undefined || a.institution === institution).map(item => <Action key={item.id} title={item.label} secondary selected={account === item.id} onPress={() => setAccount(item.id)} />)}
      <Body>Tipo financeiro</Body>
      <Action title="Todos os tipos" secondary selected={type === undefined} onPress={() => setType(undefined)} />
      {financialTypes.map(item => <Action key={item.id} title={item.label} secondary selected={type === item.id} onPress={() => setType(item.id)} />)}
      <Body>Categoria</Body>
      {[{ id: undefined, label: 'Todas as categorias' }, ...categoryOptions, { id: null, label: 'Sem categoria' }].map(item => <Action key={item.label} title={item.label} secondary selected={category === item.id} onPress={() => setCategory(item.id)} />)}
      <Action title="Limpar filtros e manter o mês" secondary onPress={() => { setInstitution(undefined); setAccount(undefined); setType(undefined); setCategory(undefined); }} />
    </Card>}
    <Action title="Comparar com o mês anterior" secondary onPress={() => router.push({ pathname: '/comparison', params: { month, institution: institution ?? 'all', account: account ?? 'all', type: type ?? 'all', category: category === undefined ? 'all' : category ?? 'uncategorized' } })} />
    <Card title="Gastos líquidos do período"><Money cents={result.summary.netCents} prominent /><Body>Base: movimentações inventadas de conta, sem compras de cartão. Cobertura do consumo parcial. Fonte inventada de {institutionSourceDate(institution)}; setembro é um exemplo de período sem movimentos.</Body>{result.summary.partial && <Body>Subtotal parcial: há valores, classificação ou vínculo de estorno pendentes.</Body>}<Action title={explain ? 'Fechar explicação do cálculo' : 'Como este valor foi calculado'} secondary onPress={() => setExplain(value => !value)} />{explain && <Body>Despesas efetivadas menos estornos vinculados, nos filtros escolhidos. Transferências próprias, aportes, resgates e pagamento de fatura não são novos gastos. Pendentes/cancelados não entram no total. Sem categoria permanece no cálculo. A fonte de conta não detalha compras do cartão.</Body>}</Card>
    {result.totalCount === 0 && <StateCard state="empty" />}
    <Card title="Por categoria">{result.categories.map(group => <Card key={group.categoryId ?? 'uncategorized'} title={categoryLabel(group.categoryId)}><Money cents={group.summary.netCents} /><Body>{group.count} movimentos; gasto líquido após estornos vinculados. {group.summary.partial ? 'Subtotal parcial.' : ''}</Body><Action title={`Ver movimentos: ${categoryLabel(group.categoryId)}`} secondary onPress={() => router.push({ pathname: '/report-detail', params: { month, institution: institution ?? 'all', category: group.categoryId ?? 'uncategorized', account: account ?? 'all', type: type ?? 'all', scopeCategory: category === undefined ? 'all' : category ?? 'uncategorized' } })} /></Card>)}</Card>
    <Card title="Tipos financeiros, sem misturar">{result.types.map(group => <Card key={group.type} title={financialTypes.find(t => t.id === group.type)?.label ?? 'Desconhecido'}><Body>Entradas efetivadas</Body><Money cents={group.creditCents} /><Body>Saídas efetivadas</Body><Money cents={group.debitCents} /><Body>{group.postedCount} efetivados · {group.pendingCount} pendentes · {group.cancelledCount} cancelados. {group.missingAmountCount > 0 ? 'Há valores não informados; subtotal parcial.' : ''}</Body></Card>)}</Card>
  </Screen>;
}
