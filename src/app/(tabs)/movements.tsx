import { useState } from 'react';
import { Modal, TextInput, View } from 'react-native';
import { Action, Body, Card, Screen, StateCard, palette } from '@/components/ui';
import { Money } from '@/components/privacy';
import { useDemo } from '@/data/demo/store';
import { categoryOptions, movementKey } from '@/data/demo/overrides';
import { queryMovements } from '@/data/local/query';
import type { FinancialType } from '@/domain/expenses';
const types: { id: FinancialType; label: string }[] = [
  { id: 'expense', label: 'Despesa' }, { id: 'income', label: 'Receita' }, { id: 'own_transfer', label: 'Transferência própria' },
  { id: 'contribution', label: 'Aporte' }, { id: 'redemption', label: 'Resgate' }, { id: 'yield', label: 'Rendimento' },
  { id: 'refund', label: 'Estorno' }, { id: 'card_settlement', label: 'Pagamento de fatura' }, { id: 'unknown', label: 'Desconhecido' },
];
const categoryLabel = (id: string | null) => categoryOptions.find(c => c.id === id)?.label ?? 'Sem categoria';
export default function MovementsScreen() {
  const demo = useDemo();
  const [month, setMonth] = useState('2026-10');
  const [institution, setInstitution] = useState<string>();
  const [category, setCategory] = useState<string | null>();
  const [type, setType] = useState<FinancialType>();
  const [search, setSearch] = useState('');
  const [offset, setOffset] = useState(0);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const result = queryMovements(demo.movements, { month, institutionId: institution, categoryId: category, type, search, offset, limit: 3 }, true);
  const detail = demo.movements.find(m => movementKey(m) === selected);
  const resetPage = (action: () => void) => { setOffset(0); action(); };
  return <Screen title="Movimentações" subtitle="Exemplos inventados · movimentações de conta, sem compras de cartão.">
    <Card title="Período"><Body>{month === '2026-10' ? 'Outubro de 2026' : 'Setembro de 2026'}</Body><Action title={month === '2026-10' ? 'Ver setembro' : 'Ver outubro'} secondary onPress={() => resetPage(() => setMonth(month === '2026-10' ? '2026-09' : '2026-10'))} /></Card>
    <Action title={filtersOpen ? 'Fechar filtros' : 'Filtrar movimentos'} secondary onPress={() => setFiltersOpen(v => !v)} />
    {filtersOpen && <Card title="Filtros ativos">
      <Body>Banco: {institution === 'bradesco' ? 'Bradesco' : institution === 'mercado-pago' ? 'Mercado Pago' : 'Todos'}. Categoria: {category === undefined ? 'Todas' : categoryLabel(category)}. Tipo: {types.find(t => t.id === type)?.label ?? 'Todos'}.</Body>
      <TextInput accessibilityLabel="Buscar na descrição dos exemplos" placeholder="Buscar descrição" placeholderTextColor={palette.muted} value={search} onChangeText={value => resetPage(() => setSearch(value))} style={{ borderWidth: 1, borderColor: palette.line, borderRadius: 10, padding: 14, minHeight: 48, fontSize: 16, color: palette.ink }} autoCorrect={false} />
      {[{ id: undefined, label: 'Todos os bancos' }, { id: 'bradesco', label: 'Bradesco' }, { id: 'mercado-pago', label: 'Mercado Pago' }].map(item => <Action key={item.label} title={item.label} selected={institution === item.id} secondary onPress={() => resetPage(() => setInstitution(item.id))} />)}
      {[{ id: undefined, label: 'Todas as categorias' }, ...categoryOptions, { id: null, label: 'Sem categoria' }].map(item => <Action key={item.label} title={item.label} selected={category === item.id} secondary onPress={() => resetPage(() => setCategory(item.id))} />)}
      <Action title="Todos os tipos" selected={type === undefined} secondary onPress={() => resetPage(() => setType(undefined))} />
      {types.map(item => <Action key={item.id} title={item.label} selected={type === item.id} secondary onPress={() => resetPage(() => setType(item.id))} />)}
      <Action title="Limpar filtros" onPress={() => resetPage(() => { setInstitution(undefined); setCategory(undefined); setType(undefined); setSearch(''); })} />
    </Card>}
    <Card title="Gastos líquidos · filtros atuais"><Money cents={result.summary.netCents} /><Body>{result.totalCount} movimentos encontrados. Total considera despesas efetivadas menos estornos vinculados em todo o filtro, não só nesta página. Transferências próprias ficam fora.</Body>{result.summary.partial && <Body>Subtotal parcial: há classificação ou vínculo pendente de revisão.</Body>}</Card>
    {result.items.length === 0 && <StateCard state="empty" />}
    {result.items.map(movement => <Card key={movementKey(movement)} title={movement.description}>
      <Money cents={movement.amountCents} /><Body>{movement.occurredAt.split('-').reverse().join('/')} · {movement.institutionId === 'bradesco' ? 'Bradesco' : 'Mercado Pago'} · {types.find(t => t.id === movement.type)?.label} · {categoryLabel(movement.categoryId)}</Body>
      <Action title={`Detalhes de ${movement.description}`} secondary onPress={() => setSelected(movementKey(movement))} />
    </Card>)}
    {offset > 0 && <Action title="Página anterior" secondary onPress={() => setOffset(Math.max(0, offset - 3))} />}
    {result.nextOffset !== null && <Action title="Próxima página" secondary onPress={() => setOffset(result.nextOffset ?? 0)} />}
    <Action title="Recarregar lote demonstrativo" secondary onPress={demo.reload} />
    <Body>Correções dos exemplos duram nesta sessão. Não há sincronização bancária nem gravação de dados financeiros.</Body>
    <Modal visible={detail !== undefined} animationType="slide" onRequestClose={() => setSelected(null)}>
      {detail ? <Screen title="Detalhe do exemplo" subtitle="Correção local demonstrativa; o lançamento de origem não é alterado.">
        <Action title="Voltar para a lista" secondary onPress={() => setSelected(null)} />
        <Card title={detail.description}><Money cents={detail.amountCents} /><Body>Data: {detail.occurredAt}. Origem: {detail.institutionId === 'bradesco' ? 'Bradesco' : 'Mercado Pago'} (inventada). Estado: efetivado. Direção: {detail.direction === 'debit' ? 'saída' : 'entrada'}.</Body><Body>Categoria: {categoryLabel(detail.categoryId)}. Tipo: {types.find(t => t.id === detail.type)?.label}. {demo.corrections[movementKey(detail)] ? 'Há correção manual neste exemplo.' : 'Classificação da fonte demonstrativa.'}</Body></Card>
        <Card title="Revisar categoria">{[...categoryOptions, { id: null, label: 'Sem categoria' }].map(item => <Action key={item.label} title={item.label} secondary selected={detail.categoryId === item.id} onPress={() => demo.correct(movementKey(detail), { categoryId: item.id })} />)}</Card>
        <Card title="Revisar tipo"><Body>Confirme transferência própria somente quando souber que as duas contas são suas. O exemplo permite explorar essa decisão.</Body>{types.map(item => <Action key={item.id} title={item.label} secondary selected={detail.type === item.id} onPress={() => demo.correct(movementKey(detail), { type: item.id })} />)}</Card>
        <Action title="Concluir revisão do exemplo" onPress={() => setSelected(null)} />
      </Screen> : <View />}
    </Modal>
  </Screen>;
}
