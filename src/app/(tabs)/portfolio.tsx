import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Action, Body, Card, Screen } from '@/components/ui';
import { Money, usePrivacy } from '@/components/privacy';
import { demoAssetLabels, demoPortfolio } from '@/data/demo/scenario';
const sections = [{ id: 'account', label: 'Contas' }, { id: 'investment', label: 'Investimentos' }, { id: 'reserve', label: 'Reservas incluídas' }] as const;
export default function PortfolioScreen() {
  const router = useRouter();
  const [institution, setInstitution] = useState<'bradesco' | 'mercado-pago'>();
  const { components, summary } = demoPortfolio(institution);
  const privacy = usePrivacy();
  return <Screen title="Carteira" subtitle="Cenário inventado · reais (BRL) · nenhum banco conectado.">
    <Action title={privacy.hidden ? 'Mostrar valores demonstrativos' : 'Ocultar valores'} secondary onPress={privacy.toggle} />
    <Card title="Instituições">
      <Action title="Todas as instituições" secondary selected={institution === undefined} onPress={() => setInstitution(undefined)} />
      <Action title="Bradesco · exemplo" secondary selected={institution === 'bradesco'} onPress={() => setInstitution('bradesco')} />
      <Action title="Mercado Pago · exemplo" secondary selected={institution === 'mercado-pago'} onPress={() => setInstitution('mercado-pago')} />
    </Card>
    <Card title={summary.partial ? 'Subtotal de ativos · parcial' : 'Total dos ativos informados no exemplo'}>
      <Money cents={summary.subtotalCents} prominent />
      <Body>{summary.mixedDates ? 'Fontes com datas diferentes: 18 e 19/10/2026.' : 'Fonte inventada de 19/10/2026.'} {summary.partial ? 'Investimentos do Mercado Pago não informados; patrimônio incompleto.' : 'Total apenas dos componentes inventados selecionados.'}</Body>
      <Body>Reservas incluídas são detalhe do saldo, não dinheiro adicional. Rentabilidade e valor disponível não foram informados pela fonte deste exemplo.</Body>
    </Card>
    <Action title="Ver composição por instituição e classe" secondary onPress={() => router.push({ pathname: '/composition', params: { institution: institution ?? 'all' } })} />
    {sections.map(section => {
      const assets = components.filter(asset => demoAssetLabels[asset.id]?.section === section.id);
      return <Card key={section.id} title={section.label}>
        {assets.length === 0 ? <Body>Nenhum componente desta seção informado no exemplo selecionado. Isso não comprova saldo zero.</Body> : assets.map(asset => <Card key={asset.id} title={demoAssetLabels[asset.id]?.name ?? 'Componente não identificado'}>
          <Money cents={asset.amountCents} />
          <Body>{asset.asOf ? `Fonte inventada de ${asset.asOf.split('-').reverse().join('/')}.` : 'Valor e data não informados pela fonte.'}</Body>
          {asset.relation === 'included' && <Body>Já incluída na conta corrente Bradesco. Não acrescenta valor ao total.</Body>}
          {asset.relation === 'unknown' && <Body>Cobertura desconhecida; não é possível concluir ausência de investimentos ou cofrinhos.</Body>}
        </Card>)}
      </Card>;
    })}
    <Card title="Metas locais"><Body>Associe parte do exemplo a objetivos, sem transferir dinheiro ou aumentar o patrimônio.</Body><Action title="Ver metas demonstrativas" secondary onPress={() => router.push('/goals')} /></Card>
    <Card title="Cofrinhos do Mercado Pago"><Body>A cobertura real ainda não foi confirmada. Não estamos inferindo cofrinhos a partir do saldo ou do nome de uma transação.</Body></Card>
  </Screen>;
}
