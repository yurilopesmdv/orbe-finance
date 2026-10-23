import { createActivationRuntime } from '@/features/connections/activation-runtime';
import type { ActivationSnapshot } from '@/features/connections/activation-controller';
import { useScreenProtection, useScreenProtectionModel } from '@/features/privacy/provider';
import { useCallback, useEffect, useState, useSyncExternalStore } from 'react';
import { Modal, View } from 'react-native';
import { Redirect, useFocusEffect, useRouter } from 'expo-router';
import { fetch as expoFetch } from 'expo/fetch';
import { Action, Body, Card, Screen } from '@/components/ui';
import { useAuth } from '@/features/auth/provider';
import { publicAuthConfig } from '@/config/auth';
import { runtime } from '@/config/runtime';
import { createConnectionCommands } from '@/features/connections/commands';
import { createConnectionStatusReader, type ConnectionMetadata } from '@/features/connections/status';
import { createConnectionsController, type ConnectionsSnapshot } from '@/features/connections/controller';
import { capabilityLabel, connectionStateLabel, institutionLabels, metadataDateLabel } from '@/features/connections/presentation';
type Controller = ReturnType<typeof createConnectionsController>;
type Selection = { connectionId: string; revision: number; institution: ConnectionMetadata['institution'] };
const initial: Readonly<ConnectionsSnapshot> = Object.freeze({ phase: 'idle', connections: Object.freeze([]), notice: 'none' });
const idleSnapshot = () => initial, idleSubscribe = () => () => {};
const notices: Record<ConnectionsSnapshot['notice'], string> = {
  none: '', updated: 'Status atualizado.', paused: 'Pausa confirmada no Orbe.', removed: 'Conexão removida do Orbe. Isso não revoga o consentimento no banco nem apaga dados no fornecedor.',
  not_confirmed: 'A alteração não foi confirmada. Atualize o status. Para remover, pode ser necessário entrar novamente com sua senha e escolher a conexão de novo.',
  unavailable: 'Não foi possível confirmar o status. Tente atualizar quando a conexão estiver disponível.',
  rate_limited: 'Muitas solicitações. Aguarde um pouco antes de atualizar.',
  uncertain: 'Não foi possível confirmar o resultado. A alteração pode ter ocorrido no servidor. Atualize o status antes de tentar outra ação.',
};
type ActivationClient=Extract<ReturnType<typeof createActivationRuntime>,{kind:'ready'}>;
const activationIdle:Readonly<ActivationSnapshot>=Object.freeze({phase:'idle',notice:'none'}),activationSnapshot=()=>activationIdle;
const activationNotices:Record<ActivationSnapshot['notice'],string>={none:'',preparing:'Preparando suas contas. Aguarde a conclusão nesta tela.',verifying:'Contas preparadas. Verificando o consentimento e ativando a leitura…',preparation_unavailable:'Não foi possível concluir a preparação das contas. A conexão continua pendente; nenhuma ativação foi confirmada.',activated:'Conexão ativada e status confirmado. Abra Minhas contas para atualizar seus dados.',origin_unconfirmed:'A origem e o consentimento desta conexão ainda não puderam ser associados com segurança. A leitura continua bloqueada.',uncertain:'A ativação pode ter ocorrido, mas não foi possível confirmar o status. Atualize antes de tentar novamente.',unavailable:'O servidor não confirmou a ativação. A conexão continua em preparação; nenhuma leitura foi liberada.',cooldown:'Aguarde antes de tentar novamente.',cancelled:'Ativação interrompida. Atualize o status ao voltar.'};
export default function MyConnectionsScreen() {
  const auth = useAuth(), router = useRouter(), screen = useScreenProtection(), protection = useScreenProtectionModel();
  const [activation,setActivation]=useState<ActivationClient|null>(null);
  const activationState=useSyncExternalStore(activation?.controller.subscribe??idleSubscribe,activation?.controller.getSnapshot??activationSnapshot,activationSnapshot);
  const activationEnabled=runtime.connectionActivationEnabled&&runtime.liveIntegrationEnabled&&runtime.privateFinancialDataApproved;
  const discoveryEnabled = runtime.inventoryDiscoveryEnabled && runtime.liveIntegrationEnabled && runtime.privateFinancialDataApproved;
  const [controller, setController] = useState<Controller | null>(null);
  const [selection, setSelection] = useState<Selection | null>(null);
  const snapshot = useSyncExternalStore(controller?.subscribe ?? idleSubscribe, controller?.getSnapshot ?? idleSnapshot, idleSnapshot);
  useFocusEffect(useCallback(() => {
    setSelection(null);
    if (!auth.model || auth.snapshot.state !== 'unlocked' || !runtime.metadataStatusEnabled || screen.snapshot.phase !== 'ready' || !screen.snapshot.active) { setController(null); return; }
    // Metadata-only operations. No financial cache/adapter is created here.
    const reader = createConnectionStatusReader(auth.model, () => publicAuthConfig, expoFetch, { enabled: true });
    const commands = createConnectionCommands(auth.model, () => publicAuthConfig, expoFetch, { enabled: true, privateDataApproved: true });
    const instance = createConnectionsController(auth.model, reader, commands, { enabled: true });
    setController(instance); void instance.refresh();
    return () => { instance.close(); setSelection(null); };
  }, [auth.model, auth.snapshot.state, screen.snapshot.phase, screen.snapshot.active]));
  useFocusEffect(useCallback(()=>{
    setActivation(null);
    if(!activationEnabled||!auth.model||auth.snapshot.state!=='unlocked'||!protection||screen.snapshot.phase!=='ready'||!screen.snapshot.active)return;
    const instance=createActivationRuntime(auth.model,protection,()=>publicAuthConfig,expoFetch,runtime);if(instance.kind!=='ready')return;
    setActivation(instance);return()=>instance.close();
  },[activationEnabled,auth.model,auth.snapshot.state,protection,screen.snapshot.phase,screen.snapshot.active]));
  useEffect(() => { if (snapshot.phase !== 'ready' || auth.snapshot.state !== 'unlocked') setSelection(null); }, [snapshot.phase, auth.snapshot.state]);
  if (auth.snapshot.state !== 'unlocked') return <Redirect href="/login" />;
  const busy = snapshot.phase === 'loading' || snapshot.phase === 'working' || activationState.phase === 'loading' || !controller;
  return <Screen title="Minhas conexões" subtitle={discoveryEnabled ? "Prepare suas conexões e acompanhe a disponibilidade dos dados." : "Status das conexões cadastradas no Orbe. Nenhum saldo ou movimento é consultado nesta tela."} demonstration={false}>
    <Action title="Adicionar banco pelo Meu Pluggy" onPress={()=>router.push('/add-bank')}/>
    <Action title="Voltar à visão geral" secondary onPress={() => router.replace('/account')} />
    {discoveryEnabled ? <Card title="Prepare sua conexão"><Body>As conexões já autorizadas são preparadas automaticamente na home. Para adicionar outro banco, use Adicionar banco pelo Meu Pluggy; não precisa copiar identificadores.</Body></Card> : <Card title="Coleta financeira em preparação"><Body>Esta versão consulta apenas o status no Orbe. Autorizar um banco, buscar dados financeiros, retomar uma conexão ou revogar consentimento na origem ainda não está disponível.</Body></Card>}
    <Action title={snapshot.phase === 'working' ? 'Confirmando alteração…' : snapshot.phase === 'loading' ? 'Consultando status…' : 'Atualizar status'} disabled={busy || !runtime.metadataStatusEnabled} onPress={() => { void controller?.refresh(); }} />
    {snapshot.notice !== 'none' && <Body>{notices[snapshot.notice]}</Body>}
    {activationEnabled&&activationState.notice!=='none'&&<Body>{activationNotices[activationState.notice]}</Body>}
    {snapshot.phase === 'ready' && snapshot.connections.length === 0 && <Card title="Nenhuma conexão cadastrada"><Body>A consulta ao Orbe foi concluída. Nenhum banco foi conectado por esta versão; isso não informa saldo ou existência de contas no banco.</Body></Card>}
    {snapshot.phase === 'ready' && snapshot.connections.map(connection => <Card key={connection.id} title={institutionLabels[connection.institution]}>
      <Body>{connectionStateLabel(connection, Date.now())}</Body>
      <Body>Autorização do serviço: {metadataDateLabel(connection.proxyConsentExpiresAt)}</Body>
      <Body>Autorização do banco: {connection.bankConsentExpiresAt===null&&connection.openFinanceVerifiedAt!==null?'Prazo indeterminado':metadataDateLabel(connection.bankConsentExpiresAt)}</Body>
      <Body>Última informação da fonte: {metadataDateLabel(connection.sourceUpdatedAt)}</Body>
      <Body>Última leitura concluída no Orbe: {metadataDateLabel(connection.lastReadAt)}</Body>
      <Body>Contas: {capabilityLabel(connection.capabilities.accounts)}. Movimentos: {capabilityLabel(connection.capabilities.transactions)}.</Body>
      <Body>Investimentos: {capabilityLabel(connection.capabilities.investments)}. Cofrinhos: {capabilityLabel(connection.capabilities.reserves)}.</Body>
      <Body>Cada banco pode fornecer produtos e históricos diferentes. Cofrinhos só aparecem quando a fonte comprovar essa relação.</Body>

      {activationEnabled&&connection.state==='pending'&&<Action title={activationState.phase==='loading'?(activationState.notice==='preparing'?'Preparando contas…':'Verificando ativação…'):'Preparar e ativar leitura'} disabled={busy||!activation||activationState.phase==='closed'} onPress={()=>{void activation?.controller.run(connection.id).then(()=>controller?.refresh());}}/>}
      {activationEnabled&&connection.state==='pending'&&activationState.notice!=='none'&&<Body>{activationNotices[activationState.notice]}</Body>}
      {connection.state === 'active' && <Action title="Pausar buscas no Orbe" secondary disabled={busy} onPress={() => { void controller?.pause({ connectionId: connection.id, revision: connection.revision }); }} />}
      <Action title="Remover conexão do Orbe" secondary disabled={busy} onPress={() => setSelection({ connectionId: connection.id, revision: connection.revision, institution: connection.institution })} />
    </Card>)}
    {(snapshot.phase === 'uncertain' || snapshot.phase === 'error') && <Action title="Entrar novamente com minha senha" secondary onPress={() => { setSelection(null); controller?.close(); auth.model?.requirePassword(); router.replace('/login'); }} />}
    <Card title="Sobre pausa e remoção"><Body>Pausar impede novas buscas pelo Orbe. Remover apaga o vínculo e os metadados da conexão no Orbe. Nenhuma dessas ações revoga sozinha o consentimento no banco ou elimina os dados mantidos pelo fornecedor.</Body><Body>Para remover, o servidor exige um login recente com senha. Se não confirmar, atualize o status e, se necessário, entre novamente. O aplicativo não repete a remoção sozinho.</Body></Card>
    <Modal visible={selection !== null && snapshot.phase === 'ready'} animationType="slide" onRequestClose={() => setSelection(null)}>
      <Screen title="Remover esta conexão?" subtitle={selection ? institutionLabels[selection.institution] : 'Conexão do Orbe'} demonstration={false}>
        <View accessibilityViewIsModal>
          <Card title="Confira antes de remover"><Body>O vínculo e os metadados desta conexão serão removidos do Orbe. O consentimento no banco e os dados no Meu Pluggy continuam sob as regras de cada serviço.</Body><Body>Essa ação não movimenta dinheiro e não pode ser desfeita pelo aplicativo nesta versão.</Body></Card>
          <Action title="Confirmar remoção do Orbe" onPress={() => { const chosen = selection; setSelection(null); if (chosen) void controller?.remove({ connectionId: chosen.connectionId, revision: chosen.revision }); }} />
          <Action title="Cancelar e manter conexão" secondary onPress={() => setSelection(null)} />
        </View>
      </Screen>
    </Modal>
  </Screen>;
}
