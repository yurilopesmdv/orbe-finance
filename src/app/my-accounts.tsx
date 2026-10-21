import { useCallback, useState, useSyncExternalStore } from 'react';
import { Redirect, useFocusEffect, useRouter } from 'expo-router';
import { fetch as expoFetch } from 'expo/fetch';
import { Action, Body, Card, Screen } from '@/components/ui';
import { Money, usePrivacy } from '@/components/privacy';
import { useAuth } from '@/features/auth/provider';
import { useScreenProtection, useScreenProtectionModel } from '@/features/privacy/provider';
import { createAccountsRuntime } from '@/features/accounts/runtime';
import { createAccountScopeId } from '@/features/accounts/native-scope';
import type { AccountsSnapshot } from '@/features/accounts/controller';
import type { ConnectionMetadata } from '@/features/connections/status';
import { institutionLabels, metadataDateLabel } from '@/features/connections/presentation';
import { publicAuthConfig } from '@/config/auth';
import { runtime } from '@/config/runtime';
type Client=Extract<ReturnType<typeof createAccountsRuntime>,{kind:'ready'}>;
const idle:Readonly<AccountsSnapshot>=Object.freeze({phase:'idle',notice:'none'}),idleSnapshot=()=>idle,idleSubscribe=()=>()=>{};
const notices:Record<AccountsSnapshot['notice'],string>={none:'',updated:'Saldos atualizados.',partial:'Leitura parcial: esta tela mostra apenas contas. Valores sem composição confirmada não formam um patrimônio total.',unavailable:'Não foi possível confirmar a leitura. Tente novamente mais tarde.',cooldown:'Aguarde o intervalo entre atualizações antes de tentar novamente.',busy:'Já existe uma leitura em andamento.',cancelled:'Leitura interrompida. Entre novamente para atualizar.'};
export default function MyAccountsScreen(){
 const auth=useAuth(),router=useRouter(),screen=useScreenProtection(),protection=useScreenProtectionModel(),privacy=usePrivacy();
 const[client,setClient]=useState<Client|null>(null),[connections,setConnections]=useState<readonly Readonly<ConnectionMetadata>[]>([]),[available,setAvailable]=useState(false),[listing,setListing]=useState(false);
 const snapshot=useSyncExternalStore(client?.controller.subscribe??idleSubscribe,client?.controller.getSnapshot??idleSnapshot,idleSnapshot);
 const enabled=runtime.accountReadsEnabled&&runtime.liveIntegrationEnabled&&runtime.privateFinancialDataApproved;
 useFocusEffect(useCallback(()=>{
  setConnections([]);setAvailable(false);setListing(false);setClient(null);
  if(!enabled||!auth.model||auth.snapshot.state!=='unlocked'||!protection||screen.snapshot.phase!=='ready'||!screen.snapshot.active)return;
  const instance=createAccountsRuntime(auth.model,protection,()=>publicAuthConfig,expoFetch,createAccountScopeId,runtime);if(instance.kind!=='ready')return;
  let active=true;const controller=new AbortController();setClient(instance);setListing(true);
  void instance.connections(controller.signal).then(result=>{if(!active)return;if(result.status==='complete'){setConnections(result.connections);setAvailable(true);}}).catch(()=>{}).finally(()=>{if(active)setListing(false);});
  return()=>{active=false;controller.abort();instance.close();};
 },[enabled,auth.model,auth.snapshot.state,protection,screen.snapshot.phase,screen.snapshot.active]));
 if(auth.snapshot.state!=='unlocked')return <Redirect href="/login"/>;
 let items:ReturnType<Client['controller']['query']>['items']=[];
 if(client&&snapshot.phase!=='closed'){try{items=client.controller.query().items;}catch{/* Closed caches are never displayed. */}}
 return <Screen title="Minhas contas" subtitle="Saldos em conta, com origem e data da informação." demonstration={false}>
  <Action title="Voltar ao meu acesso" secondary onPress={()=>router.replace('/account')}/>
  {!enabled?<Card title="Conexão bancária em preparação"><Body>Seu login está pronto. A leitura de contas ainda não foi ativada; nenhum saldo real é buscado por esta versão. A conexão com os bancos será configurada em uma etapa própria.</Body></Card>:<>
   <Body>Somente contas correntes e de pagamento. Movimentos, investimentos e cofrinhos não estão incluídos nesta leitura. Os dados desta tela são descartados ao sair do primeiro plano ou da sessão.</Body>
   <Action title={privacy.hidden?'Mostrar valores':'Ocultar valores'} secondary onPress={privacy.toggle}/>
   {!available&&<Body>{listing?'Consultando suas conexões…':'Não foi possível carregar a lista de conexões. Volte e tente novamente.'}</Body>}
   {available&&connections.length===0&&<Card title="Nenhuma conexão cadastrada"><Body>Não há contas vinculadas para leitura no Orbe. Isso não indica saldo zero ou ausência de contas nos bancos.</Body></Card>}
   {connections.map(connection=><Card key={connection.id} title={institutionLabels[connection.institution]}><Action title={snapshot.phase==='loading'?'Atualizando…':'Atualizar saldos desta conexão'} disabled={!client||snapshot.phase==='loading'||snapshot.phase==='closed'||connection.state!=='active'||connection.capabilities.accounts!==true} onPress={()=>{void client?.controller.refresh(connection.id);}}/></Card>)}
   {snapshot.notice!=='none'&&<Body>{notices[snapshot.notice]}</Body>}
   {items.map((item,index)=><Card key={item.id} title={`Conta ${index+1} · ${institutionLabels[item.institutionId as ConnectionMetadata['institution']]}`}><Money cents={item.amountCents} currency={item.currency}/><Body>Data do saldo: {metadataDateLabel(item.asOf)}</Body>{item.relation==='unknown'&&<Body>A composição deste saldo ainda não foi confirmada. Ele não deve ser somado automaticamente a investimentos ou reservas.</Body>}</Card>)}
  </>}
  <Action title="Ver minhas movimentações" secondary onPress={()=>router.push('/my-movements')}/>
  <Action title="Ver minhas conexões" secondary onPress={()=>router.push('/my-connections')}/>
 </Screen>;
}
