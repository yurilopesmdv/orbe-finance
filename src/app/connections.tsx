import { useAuth } from '@/features/auth/provider';
import { useRouter } from 'expo-router';
import { Action, Body, Card, Screen } from '@/components/ui';

export default function ConnectionsScreen() {
  const router = useRouter();
  const auth = useAuth();
  return <Screen title="Conexões" subtitle="Seus bancos em um só lugar. A integração ainda está em preparação.">
    {auth.snapshot.state === 'unlocked' && <Action title="Ver minhas conexões cadastradas" onPress={() => router.push('/my-connections')} />}
    <Card title="Nenhum banco conectado">
      <Body>Você está explorando dados inventados. Esta tela não abre uma conexão, consulta contas nem pede credenciais bancárias.</Body>
    </Card>
    {['Bradesco PF', 'Mercado Pago PF'].map(institution => <Card key={institution} title={institution}>
      <Body>Não conectado · instituição prioritária.</Body>
      <Body>Contas, gastos, investimentos e cofrinhos: cobertura ainda não homologada. Nenhuma autorização ou data de atualização bancária disponível.</Body>
    </Card>)}
    <Card title="Como vai funcionar">
      <Body>1. A conexão será pelo Meu Pluggy, com autorização por Open Finance. A origem e os produtos de cada banco precisam ser confirmados antes de habilitar o acesso.</Body>
      <Body>2. O Orbe usará sua própria conta e senha. A senha do banco não será solicitada no aplicativo.</Body>
      <Body>3. A fonte será atualizada conforme os limites do serviço. Abrir o Orbe permitirá buscar os dados já disponíveis; isso não força uma nova atualização bancária nem garante tempo real.</Body>
      <Body>4. Cada produto mostrará sua fonte e data. Informação ausente continuará desconhecida, sem virar saldo zero.</Body>
    </Card>
    <Card title="Você controla o acesso">
      <Body>Pausar interrompe novas buscas pelo Orbe. Desvincular remove a conexão do aplicativo. Revogar a autorização no banco ou no provedor encerra o compartilhamento na origem. São ações diferentes, ainda indisponíveis nesta demonstração.</Body>
      <Body>A revogação e os limites de exclusão serão explicados por instituição antes da primeira conexão.</Body>
    </Card>
    <Card title="Próximas instituições"><Body>Inter e Nubank estão previstos para uma etapa posterior. A disponibilidade será confirmada separadamente.</Body></Card>
    <Action title="Voltar aos ajustes" secondary onPress={() => router.back()} />
  </Screen>;
}
