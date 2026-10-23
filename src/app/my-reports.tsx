import {useState} from 'react';
import {View} from 'react-native';
import {Redirect,useRouter} from 'expo-router';
import {Action,Body,Card,Screen,palette} from '@/components/ui';
import {Money,usePrivacy} from '@/components/privacy';
import {useAuth} from '@/features/auth/provider';
import {useFinance} from '@/features/finance/provider';
import {categoryLabel} from '@/features/finance/classifications';
import {MovementCard} from '@/features/finance/movement-card';
import {institutionLabels} from '@/features/connections/presentation';
import {occurrenceMonth} from '@/domain/money';
export default function MyReports(){
 const auth=useAuth(),finance=useFinance(),router=useRouter(),privacy=usePrivacy();
 const [month,setMonth]=useState(()=>occurrenceMonth(new Date().toISOString())),[currency,setCurrency]=useState('BRL'),[institution,setInstitution]=useState<string>(),[category,setCategory]=useState<string|null|undefined>(),[offset,setOffset]=useState(0),[filters,setFilters]=useState(false),[review,setReview]=useState(false);
 if(auth.snapshot.state!=='unlocked')return <Redirect href="/login"/>;
 const hub=finance.hub;
 let report:ReturnType<NonNullable<typeof hub>['spendingReport']>|null=null,details:ReturnType<NonNullable<typeof hub>['queryMovements']>|null=null;
 try{report=hub?.spendingReport({month,currency,institutionId:institution})??null;details=hub?.queryMovements({month,currency,institutionId:institution,categoryId:category,type:review?'unknown':undefined,offset,limit:20})??null;}catch{}
 const groups=report?.categories.filter(g=>g.summary.netCents!==0).sort((a,b)=>b.summary.netCents-a.summary.netCents)??[],max=Math.max(1,...groups.map(g=>Math.abs(g.summary.netCents)));
 const unknown=report?.types.find(t=>t.type==='unknown'),reviewCount=(unknown?.postedCount??0)+(unknown?.pendingCount??0);
 const shift=(delta:number)=>{const date=new Date(month+'-15T12:00:00Z');date.setUTCMonth(date.getUTCMonth()+delta);setMonth(date.toISOString().slice(0,7));setOffset(0);};
 return <Screen title="Gastos e análises" subtitle={`${month} · ${currency} · ${institution?institutionLabels[institution as keyof typeof institutionLabels]:'Todos os bancos'}`} demonstration={false}>
  <Action title="Voltar à visão geral" secondary onPress={()=>router.back()}/>
  <Action title={privacy.hidden?'Mostrar valores':'Ocultar valores'} secondary onPress={privacy.toggle}/>
  <Card title="Consumo identificado"><Money cents={report?.totalCount?report.summary.netCents:null} currency={currency} prominent/><Body>Subtotal dos movimentos recebidos e classificados. Cobertura parcial: compras do cartão ainda não estão integradas. Mês atual pode estar em andamento.</Body></Card>
  <Action title={filters?'Fechar filtros':'Período, moeda e banco'} secondary onPress={()=>setFilters(!filters)}/>
  {filters&&<Card title="Filtros"><Body>{month}</Body><Action title="Mês anterior" secondary disabled={month<='2000-01'} onPress={()=>shift(-1)}/><Action title="Mês seguinte" secondary disabled={month>=occurrenceMonth(new Date().toISOString())} onPress={()=>shift(1)}/>{['BRL','USD','EUR'].map(c=><Action key={c} title={c} selected={currency===c} secondary onPress={()=>{setCurrency(c);setOffset(0);}}/>)}<Action title="Todos os bancos" secondary selected={!institution} onPress={()=>{setInstitution(undefined);setOffset(0);}}/>{[...new Set(finance.snapshot.connections.map(c=>c.institution))].map(c=><Action key={c} title={institutionLabels[c]} secondary selected={institution===c} onPress={()=>{setInstitution(c);setOffset(0);}}/>)}</Card>}
  {!report?.totalCount&&<Card title="Sem dados disponíveis neste filtro"><Body>Isso não confirma gasto zero. Carregue o mês desejado em Minhas movimentações.</Body><Action title="Consultar movimentações deste mês" onPress={()=>router.push({pathname:'/my-movements',params:{month}})}/></Card>}
  <Card title="Gastos por categoria">
   {privacy.hidden?<Body>Gráfico e categorias protegidos. Mostre os valores para consultar.</Body>:groups.length?groups.map(g=><View key={g.categoryId??'none'} style={{gap:8}}><Body>{categoryLabel(g.categoryId)}</Body><Money cents={g.summary.netCents} currency={currency}/><View accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={{height:8,backgroundColor:palette.raised,borderRadius:4}}><View style={{height:8,borderRadius:4,width:`${Math.abs(g.summary.netCents)/max*100}%`,backgroundColor:g.summary.netCents<0?palette.positive:palette.accent}}/></View><Action title={`Ver ${categoryLabel(g.categoryId)}`} secondary onPress={()=>{setCategory(g.categoryId);setReview(false);setOffset(0);}}/></View>):<Body>Classifique os gastos para começar. Saídas desconhecidas não são tratadas automaticamente como consumo.</Body>}
  </Card>
  <Card title="Leituras da sua carteira"><Body>Análises calculadas neste dispositivo, sem enviar seus dados a serviços de IA.</Body>{privacy.hidden?<Body>Análises protegidas.</Body>:<><Body>{reviewCount} movimentos com tipo a revisar no período.</Body>{groups[0]&&groups[0].summary.netCents>0&&<Body>Maior categoria de consumo identificado: {categoryLabel(groups[0].categoryId)}. A comparação considera apenas o subtotal recebido.</Body>}<Action title="Revisar movimentos sem tipo" secondary onPress={()=>{setReview(true);setCategory(undefined);setOffset(0);}}/></>}<Body>Despesas confirmadas menos estornos vinculados. Transferências próprias, aplicações, resgates e pagamentos de fatura ficam fora do consumo. Estorno sem vínculo exige revisão. Sem histórico completo, não há previsão ou percentual de crescimento.</Body></Card>
  <Card title="Movimentos que explicam o relatório"><Body>{privacy.hidden?'Filtro de classificação protegido':review?'Tipo a revisar':category===undefined?'Todas as categorias':categoryLabel(category)}</Body><Action title="Mostrar todos os movimentos do período" secondary onPress={()=>{setCategory(undefined);setReview(false);setOffset(0);}}/></Card>
  {details?.items.map(item=><MovementCard key={JSON.stringify([item.source,item.accountId,item.externalId])} item={item}/>)}
  {details?.totalCount===0&&<Body>Nenhum movimento recebido para este filtro.</Body>}
  {offset>0&&<Action title="Página anterior" secondary onPress={()=>setOffset(Math.max(0,offset-20))}/>}
  {details?.nextOffset!=null&&<Action title="Próxima página" secondary onPress={()=>setOffset(details!.nextOffset!)}/>}
 </Screen>;
}
