import { Body, Card, Screen, StateCard } from '@/components/ui';
export default function MovementsScreen() {
  return <Screen title="Movimentações" subtitle="Gastos e receitas com tipo, categoria e origem claros.">
    <StateCard state="disconnected" />
    <Card title="Você tem a última palavra"><Body>Suas correções de categoria terão prioridade sobre sugestões do banco. Transferências entre suas contas não serão confundidas com consumo.</Body></Card>
    <Card title="Filtros e detalhes"><Body>Período, instituição, tipo e categoria serão adicionados com os dados demonstrativos na próxima etapa da lista.</Body></Card>
  </Screen>;
}
