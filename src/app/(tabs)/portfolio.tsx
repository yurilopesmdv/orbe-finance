import { Body, Card, Screen, StateCard } from '@/components/ui';
export default function PortfolioScreen() {
  return <Screen title="Carteira" subtitle="Contas, investimentos e reservas, sem contar o mesmo dinheiro duas vezes.">
    <StateCard state="disconnected" />
    <Card title="Contas e investimentos"><Body>Os valores aparecerão com a data e a instituição de origem. Moedas diferentes ficarão separadas.</Body></Card>
    <Card title="Cofrinhos e reservas"><Body>Uma reserva incluída no saldo da conta não será somada novamente. Quando a fonte não informar o cofrinho, a ausência ficará explícita.</Body></Card>
  </Screen>;
}
