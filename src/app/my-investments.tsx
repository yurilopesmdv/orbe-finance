import {productCoverage,coverageLabels} from '@/features/finance/coverage';
import { useFinance } from '@/features/finance/provider';
import {useState,useSyncExternalStore} from 'react';
import {Redirect,useRouter} from 'expo-router';
import {fetch as expoFetch} from 'expo/fetch';
import {Action,Body,Card,Screen} from '@/components/ui';
import {Money,usePrivacy} from '@/components/privacy';
import {useAuth} from '@/features/auth/provider';
import {useScreenProtection,useScreenProtectionModel} from '@/features/privacy/provider';
import {createInvestmentsRuntime} from '@/features/investments/runtime';
import {createAccountScopeId} from '@/features/accounts/native-scope';
import type {InvestmentsSnapshot} from '@/features/investments/controller';
import type {ConnectionMetadata} from '@/features/connections/status';
import {institutionLabels,metadataDateLabel} from '@/features/connections/presentation';
import {publicAuthConfig} from '@/config/auth';
import {runtime} from '@/config/runtime';
type Client=Extract<ReturnType<typeof createInvestmentsRuntime>,{kind:'ready'}>;
const idle:Readonly<InvestmentsSnapshot>=Object.freeze({phase:'idle',notice:'none'}),idleSnapshot=()=>idle,idleSubscribe=()=>()=>{};
const classes={fixed_income:'Renda fixa',fund:'Fundo',equity:'Renda variável',other:'Outro investimento',unknown:'Classe não confirmada'};
const notices:Record<InvestmentsSnapshot['notice'],string>={none:'',updated:'Leitura concluída.',partial:'Cobertura parcial. Os valores recebidos podem não representar todos os investimentos do banco.',unavailable:'Não foi possível confirmar a atualização. Valores anteriores válidos desta sessão foram preservados.',cooldown:'Aguarde o intervalo entre atualizações.',busy:'Já há uma atualização em andamento.',cancelled:'Leitura interrompida. Entre novamente para atualizar.'};
export default function MyInvestmentsScreen(){
 const auth=useAuth(),router=useRouter(),screen=useScreenProtection(),protection=useScreenProtectionModel(),privacy=usePrivacy();
 const finance=useFinance(),client=finance.hub?.clients.investments??null,connections=finance.snapshot.connections,available=finance.snapshot.phase!=='idle',listing=finance.snapshot.phase==='syncing';
 const[currency,setCurrency]=useState('BRL'),[institution,setInstitution]=useState<string>(),[offset,setOffset]=useState(0);
 const snapshot=useSyncExternalStore(client?.controller.subscribe??idleSubscribe,client?.controller.getSnapshot??idleSnapshot,idleSnapshot);
 const enabled=runtime.investmentReadsEnabled&&runtime.liveIntegrationEnabled&&runtime.privateFinancialDataApproved,protectedNow=screen.snapshot.phase==='ready'&&screen.snapshot.active;

 if(auth.snapshot.state!=='unlocked')return <Redirect href="/login"/>;
 let result:ReturnType<Client['controller']['query']>|null=null;
 if(enabled&&protectedNow&&client&&snapshot.phase!=='closed'){try{result=client.controller.query({currency,institutionId:institution});}catch{}}
 const items=result?.items.filter(row=>row.product==='investment')??[];
 return <Screen title="Meus investimentos" subtitle="Posições recebidas dos bancos, separadas por moeda." demonstration={false}>
  <Action title="Voltar à visão geral" secondary onPress={()=>router.replace('/account')}/>
  {!enabled?<Card title="Investimentos em preparação"><Body>A tela está pronta, mas a leitura bancária ainda não foi ativada nesta versão. Nenhuma posição real é consultada aqui.</Body></Card>:!protectedNow?<Card title="Acesso protegido"><Body>Aguarde a proteção de tela para consultar.</Body></Card>:<>
   <Body>Os dados ficam apenas na memória desta sessão. Uma posição com relação desconhecida ao saldo da conta não compõe um total consolidado, para evitar contagem duplicada.</Body>
   <Action title={privacy.hidden?'Mostrar valores':'Ocultar valores'} secondary onPress={privacy.toggle}/>
   <Card title="Filtros">{['BRL','USD','EUR'].map(value=><Action key={value} title={value} secondary selected={currency===value} onPress={()=>{setCurrency(value);setOffset(0);}}/>)}<Action title="Todos os bancos" secondary selected={institution===undefined} onPress={()=>{setInstitution(undefined);setOffset(0);}}/>{[...new Set(connections.map(row=>row.institution))].map(value=><Action key={value} title={institutionLabels[value]} secondary selected={institution===value} onPress={()=>{setInstitution(value);setOffset(0);}}/>)}</Card>
   {!available&&<Body>As conexões ainda não estão disponíveis. Volte e abra esta tela novamente para tentar.</Body>}
   {available&&connections.length===0&&<Body>Nenhuma conexão disponível nesta sessão. Isso não confirma ausência de investimentos.</Body>}
   {connections.map(row=><Card key={row.id} title={institutionLabels[row.institution]}><Body>{coverageLabels[productCoverage(row,'investments',finance.snapshot.reads)]}</Body><Action title={snapshot.phase==='loading'?'Atualizando…':'Atualizar investimentos'} disabled={!client||finance.snapshot.phase==='syncing'||snapshot.phase==='loading'||snapshot.phase==='closed'||row.state!=='active'||row.capabilities.investments!==true} onPress={()=>{setOffset(0);void finance.hub?.synchronize(true,{connectionId:row.id,product:'investments'});}}/></Card>)}
   {snapshot.notice!=='none'&&<Body>{notices[snapshot.notice]}</Body>}
   {items.length===0&&<Card title="Nenhuma posição disponível nesta consulta"><Body>A sincronização é automática. Confira acima o resultado de cada banco: uma leitura concluída sem posições significa que a fonte não retornou investimentos utilizáveis, não que você não tenha dinheiro investido. Os filtros também podem ocultar posições.</Body></Card>}
   {items.slice(offset,offset+20).map(row=><Card key={row.id} title={classes[row.assetClass??'unknown']}><Body>{institutionLabels[row.institutionId as ConnectionMetadata['institution']]}</Body><Body>Valor líquido</Body><Money cents={row.netCents??null} currency={row.currency}/>{row.netCents==null&&<Body>Líquido não informado pela fonte.</Body>}<Body>Valor bruto</Body><Money cents={row.grossCents??null} currency={row.currency}/>{row.grossCents==null&&<Body>Bruto não informado pela fonte.</Body>}<Body>Data da posição: {row.asOf?metadataDateLabel(row.asOf):'Não informada'}</Body><Body>Relação com saldo da conta não confirmada. Fora do total consolidado.</Body></Card>)}
   {offset>0&&<Action title="Página anterior" secondary onPress={()=>setOffset(n=>Math.max(0,n-20))}/>}
   {offset+20<items.length&&<Action title="Próxima página" secondary onPress={()=>setOffset(n=>n+20)}/>}
  </>}
  <Card title="Cofrinhos e reservas"><Body>O Meu Pluggy não disponibilizou os cofrinhos do Mercado Pago nesta integração. Eles não são incluídos por estimativa. Consulte o app do banco para ver os valores não recebidos aqui.</Body></Card>
  <Action title="Ver minhas contas" secondary onPress={()=>router.push('/my-accounts')}/>
 </Screen>;
}
