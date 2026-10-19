import { useEffect, useState } from 'react';
import { AccessibilityInfo, Alert, AppState, StyleSheet, Text, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { Action, Body, Card, Screen, palette } from '@/components/ui';
import { Money, usePrivacy } from '@/components/privacy';
import { parseGoalAmount, parseGoalDeadline } from '@/components/goal-input';
import { observeActivity } from '@/features/auth/lifecycle';
import { useDemo } from '@/data/demo/store';
import { sumCents } from '@/domain/money';
const messages: Record<string, string> = {
  invalid_goal_amount: 'Informe um valor como 500,00, sem separador de milhar.',
  invalid_money: 'O valor informado não é válido.', money_overflow: 'O valor é maior que o limite suportado.',
  invalid_goal_deadline: 'Informe um prazo válido no formato DD/MM/AAAA.',
  invalid_goal: 'Informe um título e um alvo maior que zero.',
  allocation_exceeds_budget: 'Essa associação ultrapassa o orçamento conhecido. Reduza o valor.',
  allocation_unavailable: 'Faltam dados para confirmar o orçamento. Só é possível reduzir ou desvincular.',
  stale_goal_budget: 'O orçamento mudou. Confira os valores antes de tentar novamente.',
};
export default function GoalsScreen() {
  const demo = useDemo(), router = useRouter(), privacy = usePrivacy();
  const [formOpen, setFormOpen] = useState(false);
  const [title, setTitle] = useState(''), [target, setTarget] = useState(''), [deadline, setDeadline] = useState('');
  const [amounts, setAmounts] = useState<Record<string, string>>({});
  const [error, setError] = useState('');
  const [errorGoalId, setErrorGoalId] = useState<string | null>(null);
  const budget = demo.goals.budgets[0];
  const remaining = budget && !budget.unavailable && budget.allocatableCents !== null ? sumCents([budget.allocatableCents, -budget.assignedCents]) : null;
  const act = (operation: () => void, goalId: string | null = null) => {
    try { operation(); setError(''); setErrorGoalId(null); }
    catch (failure) {
      const message = failure instanceof Error ? messages[failure.message] ?? 'Não foi possível alterar a meta. Tente novamente.' : 'Não foi possível alterar a meta.';
      setError(message); setErrorGoalId(goalId); AccessibilityInfo.announceForAccessibility(message);
    }
  };
  useEffect(() => observeActivity(AppState, active => { if (!active) { setTitle(''); setTarget(''); setDeadline(''); setAmounts({}); setError(''); setErrorGoalId(null); setFormOpen(false); } }), []);
  return <Screen title="Metas locais" subtitle="Objetivos com valores inventados · apenas organização nesta sessão.">
    <Action title="Voltar à carteira" secondary onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)/portfolio')} />
    <Action title={privacy.hidden ? 'Mostrar valores demonstrativos' : 'Ocultar valores'} secondary onPress={privacy.toggle} />
    <Card title={remaining !== null && remaining < 0 ? 'Excesso de associações a rever' : 'Ainda pode ser associado a metas'}>
      <Money cents={remaining !== null && remaining < 0 ? -remaining : remaining} prominent />
      <Body>Exemplo Bradesco · 19/10/2026 · orçamento não reservado explicitamente informado no cenário. Reservas já existentes da fonte ficam fora deste orçamento.</Body>
      <Body>Associar aqui não cria cofrinho no banco, não transfere dinheiro e não altera seu patrimônio. As metas desta demonstração duram até sair dela.</Body>
      {budget?.unavailable && <Body>Dados insuficientes para novas associações.</Body>}
    </Card>
    {error !== '' && errorGoalId === null && <Text style={styles.error} accessibilityLiveRegion="polite">{error}</Text>}
    <Action title={formOpen ? 'Fechar nova meta' : 'Criar meta demonstrativa'} secondary onPress={() => setFormOpen(value => !value)} />
    {formOpen && <Card title="Nova meta · use informações inventadas">
      <Text style={styles.label}>Nome da meta</Text><TextInput accessibilityLabel="Nome da meta demonstrativa" style={styles.input} value={title} onChangeText={setTitle} maxLength={120} placeholder="Ex.: Viagem de exemplo" placeholderTextColor={palette.muted} />
      <Text style={styles.label}>Valor-alvo em reais</Text><TextInput accessibilityLabel="Valor-alvo da meta em reais" style={styles.input} value={target} onChangeText={setTarget} keyboardType="decimal-pad" placeholder="500,00" placeholderTextColor={palette.muted} />
      <Text style={styles.label}>Prazo opcional</Text><TextInput accessibilityLabel="Prazo opcional da meta, dia mês ano" style={styles.input} value={deadline} onChangeText={setDeadline} keyboardType="numbers-and-punctuation" maxLength={10} placeholder="DD/MM/AAAA" placeholderTextColor={palette.muted} />
      <Action title="Criar meta local" disabled={!title.trim() || !target.trim()} onPress={() => act(() => { demo.createGoal({ title, targetCents: parseGoalAmount(target), deadline: parseGoalDeadline(deadline) }); setTitle(''); setTarget(''); setDeadline(''); setFormOpen(false); })} />
    </Card>}
    {demo.goals.goals.length === 0 && <Card title="Nenhuma meta local"><Body>Você pode criar um objetivo demonstrativo. Isso não muda sua conta ou seus investimentos.</Body></Card>}
    {demo.goals.goals.map(goal => <Card key={goal.id} title={privacy.hidden ? 'Meta local' : goal.title}>
      <Body>Valor associado localmente</Body><Money cents={goal.allocatedCents} />
      <Body>Valor-alvo</Body><Money cents={goal.targetCents} />
      <Body>{goal.deadline ? `Prazo: ${goal.deadline.split('-').reverse().join('/')}.` : 'Sem prazo definido.'} {goal.partial ? 'Associação requer revisão por dados incompletos ou orçamento reduzido.' : ''}</Body>
      {error !== '' && errorGoalId === goal.id && <Text style={styles.error} accessibilityLiveRegion="polite">{error}</Text>}
      <Text style={styles.label}>Novo total associado a esta meta</Text>
      <TextInput accessibilityLabel={privacy.hidden ? 'Novo total associado à meta local, em reais' : `Novo total associado à meta ${goal.title}, em reais`} style={styles.input} value={amounts[goal.id] ?? ''} onChangeText={value => setAmounts(current => ({ ...current, [goal.id]: value }))} keyboardType="decimal-pad" placeholder="Ex.: 100,00" placeholderTextColor={palette.muted} />
      <Action title="Atualizar associação local" disabled={!budget || !(amounts[goal.id] ?? '').trim()} onPress={() => act(() => { demo.allocateGoal(goal.id, parseGoalAmount(amounts[goal.id] ?? ''), budget!.revision); setAmounts(current => ({ ...current, [goal.id]: '' })); }, goal.id)} />
      {goal.allocatedCents > 0 && <Action title="Desvincular valor da meta" secondary onPress={() => act(() => demo.allocateGoal(goal.id, 0, budget!.revision), goal.id)} />}
      <Action title="Excluir meta demonstrativa" secondary onPress={() => Alert.alert('Excluir meta local?', 'Isso remove apenas a organização da demonstração. Nenhum dinheiro será transferido ou resgatado.', [{ text: 'Cancelar', style: 'cancel' }, { text: 'Excluir meta', style: 'destructive', onPress: () => act(() => demo.deleteGoal(goal.id), goal.id) }])} />
    </Card>)}
  </Screen>;
}
const styles = StyleSheet.create({ label: { fontSize: 15, color: palette.ink, fontWeight: '600' }, input: { borderWidth: 1, borderColor: palette.line, borderRadius: 10, padding: 14, minHeight: 48, color: palette.ink, fontSize: 16 }, error: { fontSize: 15, lineHeight: 23, color: '#8B2424' } });
