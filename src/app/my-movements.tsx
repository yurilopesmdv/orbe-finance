import { useCallback, useState, useSyncExternalStore } from 'react';
import { Redirect, useFocusEffect, useRouter } from 'expo-router';
import { fetch as expoFetch } from 'expo/fetch';
import { Action, Body, Card, Screen } from '@/components/ui';
import { Money, usePrivacy } from '@/components/privacy';
import { useAuth } from '@/features/auth/provider';
import { useScreenProtection, useScreenProtectionModel } from '@/features/privacy/provider';
import { createMovementsRuntime } from '@/features/movements/runtime';
import { createAccountScopeId } from '@/features/accounts/native-scope';
import type { MovementsSnapshot } from '@/features/movements/controller';
import type { ConnectionMetadata } from '@/features/connections/status';
import { institutionLabels, metadataDateLabel } from '@/features/connections/presentation';
import { occurrenceMonth } from '@/domain/money';
import { publicAuthConfig } from '@/config/auth';
import { runtime } from '@/config/runtime';
type Client=Extract<ReturnType<typeof createMovementsRuntime>,{kind:'ready'}>;
const idle:Readonly<MovementsSnapshot>=Object.freeze({phase:'idle',notice:'none'}),idleSnapshot=()=>idle,idleSubscribe=()=>()=>{};
const notices:Record<MovementsSnapshot['notice'],string>={none:'',updated:'Leitura concluída.',partial:'Leitura parcial. Os movimentos recebidos podem não representar todo o histórico do banco. Tipos e categorias ainda podem precisar de confirmação.',unavailable:'Não foi possível confirmar a leitura. Os dados anteriores desta sessão foram preservados quando válidos.',cooldown:'Aguarde o intervalo entre atualizações antes de tentar novamente.',busy:'Já existe uma leitura em andamento.',cancelled:'Leitura interrompida. Entre novamente para atualizar.'};
const monthLabel=(month:string)=>new Intl.DateTimeFormat('pt-BR',{timeZone:'America/Sao_Paulo',month:'long',year:'numeric'}).format(new Date(month+'-15T12:00:00Z'));
function shiftMonth(month:string,delta:-1|1){const date=new Date(month+'-15T12:00:00Z');date.setUTCMonth(date.getUTCMonth()+delta);return date.toISOString().slice(0,7);}
export default function MyMovementsScreen(){
 const auth=useAuth(),router=useRouter(),screen=useScreenProtection(),protection=useScreenProtectionModel(),privacy=usePrivacy();
 const[client,setClient]=useState<Client|null>(null),[connections,setConnections]=useState<readonly Readonly<ConnectionMetadata>[]>([]),[available,setAvailable]=useState(false),[listing,setListing]=useState(false);
 const[month,setMonth]=useState(()=>occurrenceMonth(new Date().toISOString())),[currency,setCurrency]=useState('BRL'),[institution,setInstitution]=useState<string>(),[offset,setOffset]=useState(0);
 const snapshot=useSyncExternalStore(client?.controller.subscribe??idleSubscribe,client?.controller.getSnapshot??idleSnapshot,idleSnapshot);
 const enabled=runtime.movementReadsEnabled&&runtime.liveIntegrationEnabled&&runtime.privateFinancialDataApproved;
 useFocusEffect(useCallback(()=>{
  setConnections([]);setAvailable(false);setListing(false);setClient(null);setOffset(0);
  if(!enabled||!auth.model||auth.snapshot.state!=='unlocked'||!protection||screen.snapshot.phase!=='ready'||!screen.snapshot.active)return;
  const instance=createMovementsRuntime(auth.model,protection,()=>publicAuthConfig,expoFetch,createAccountScopeId,runtime);if(instance.kind!=='ready')return;
  let active=true;const controller=new AbortController();setClient(instance);setListing(true);
  void instance.connections(controller.signal).then(result=>{if(!active)return;if(result.status==='complete'){setConnections(result.connections);setAvailable(true);}}).catch(()=>{}).finally(()=>{if(active)setListing(false);});
  return()=>{active=false;controller.abort();instance.close();};
 },[enabled,auth.model,auth.snapshot.state,protection,screen.snapshot.phase,screen.snapshot.active]));
 if(auth.snapshot.state!=='unlocked')return <Redirect href="/login"/>;
 let result:ReturnType<Client['controller']['query']>|null=null;
 const protectedNow=screen.snapshot.phase==='ready'&&screen.snapshot.active;
 if(enabled&&protectedNow&&client&&snapshot.phase!=='closed'){try{result=client.controller.query({month,currency,institutionId:institution,offset,limit:20});}catch{/* Closed caches never render financial content. */}}
 return <Screen title="Minhas movimentações" subtitle="Movimentos das contas, por período e banco." demonstration={false}>
  <Action title="Voltar ao meu acesso" secondary onPress={()=>router.replace('/account')}/>
  {!enabled?<Card title="Movimentações em preparação"><Body>Seu acesso está pronto. A leitura de movimentos ainda não foi ativada nesta versão. Nenhum extrato real é consultado por esta tela.</Body></Card>:!protectedNow?<Card title="Acesso protegido"><Body>Aguarde a proteção de tela ficar pronta para consultar seus movimentos.</Body></Card>:<>
   <Body>Somente movimentos de contas correntes e de pagamento. Compras de cartão, investimentos e cofrinhos não fazem parte desta leitura. Os dados são descartados ao sair do primeiro plano ou da sessão.</Body>
   <Action title={privacy.hidden?'Mostrar valores e descrições':'Ocultar valores e descrições'} secondary onPress={privacy.toggle}/>
   <Card title="Período"><Body>{monthLabel(month)}</Body><Action title="Mês anterior" secondary disabled={month<='2000-01'||snapshot.phase==='loading'} onPress={()=>{setMonth(shiftMonth(month,-1));setOffset(0);}}/><Action title="Mês seguinte" secondary disabled={month>='2099-12'||snapshot.phase==='loading'} onPress={()=>{setMonth(shiftMonth(month,1));setOffset(0);}}/></Card>
   <Card title="Filtros"><Body>Moeda: {currency}. Cada moeda é apresentada separadamente.</Body>{['BRL','USD','EUR'].map(value=><Action key={value} title={value} secondary selected={currency===value} onPress={()=>{setCurrency(value);setOffset(0);}}/>)}<Action title="Todos os bancos" secondary selected={institution===undefined} onPress={()=>{setInstitution(undefined);setOffset(0);}}/>{[...new Set(connections.map(row=>row.institution))].map(value=><Action key={value} title={institutionLabels[value]} secondary selected={institution===value} onPress={()=>{setInstitution(value);setOffset(0);}}/>)}</Card>
   {!available&&<Body>{listing?'Consultando suas conexões…':'Não foi possível carregar as conexões. Volte e tente novamente.'}</Body>}
   {available&&connections.length===0&&<Card title="Nenhuma conexão cadastrada"><Body>Não há conexões disponíveis nesta sessão. Isso não significa ausência de contas ou movimentos no banco.</Body></Card>}
   {connections.map(connection=><Card key={connection.id} title={institutionLabels[connection.institution]}><Action title={snapshot.phase==='loading'?'Atualizando…':`Atualizar ${monthLabel(month)}`} disabled={!client||snapshot.phase==='loading'||snapshot.phase==='closed'||connection.state!=='active'||connection.capabilities.transactions!==true} onPress={()=>{setOffset(0);void client?.controller.refresh(connection.id,month);}}/></Card>)}
   {snapshot.notice!=='none'&&<Body>{notices[snapshot.notice]}</Body>}
   {result&&result.totalCount===0&&<Card title="Sem movimentos disponíveis nesta consulta"><Body>Atualize a conexão para o período desejado. Uma lista vazia pode indicar que ainda não houve leitura, filtros sem resultados ou cobertura parcial; ela não confirma movimentação zero.</Body></Card>}
   {result&&result.totalCount>0&&<Body>{result.totalCount} movimento(s) disponível(is) nesta sessão e nestes filtros. Cobertura parcial.</Body>}
   {result?.items.map(item=><Card key={JSON.stringify([item.source,item.accountId,item.externalId])} title={item.direction==='debit'?'Saída da conta':'Entrada na conta'}><Money cents={item.amountCents} currency={item.currency}/><Body>{privacy.hidden?'Descrição oculta':item.description||'Sem descrição disponível'}</Body><Body>{metadataDateLabel(item.occurredAt)} · {institutionLabels[item.institutionId as ConnectionMetadata['institution']]} · {item.status==='posted'?'Confirmado':'Pendente'}</Body><Body>Tipo financeiro e categoria ainda não confirmados. Uma saída não significa necessariamente consumo.</Body></Card>)}
   {offset>0&&<Action title="Página anterior" secondary onPress={()=>setOffset(value=>Math.max(0,value-20))}/>}
   {result?.nextOffset!==null&&result?.nextOffset!==undefined&&<Action title="Próxima página" secondary onPress={()=>setOffset(result.nextOffset!)}/>}
  </>}
  <Action title="Ver minhas contas" secondary onPress={()=>router.push('/my-accounts')}/>
  <Action title="Ver minhas conexões" secondary onPress={()=>router.push('/my-connections')}/>
 </Screen>;
}
