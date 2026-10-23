import {useState} from 'react';
import {Action,Body,Card} from '../../components/ui';
import {Money,usePrivacy} from '../../components/privacy';
import type {LocalMovement} from '../../data/local/query';
import {categories,categoryLabel,financialTypes,suggestCategory} from './classifications';
import {useFinance} from './provider';
import {institutionLabels,metadataDateLabel} from '../connections/presentation';
export function MovementCard({item}:{item:LocalMovement}){
 const {hub}=useFinance(),privacy=usePrivacy(),[editing,setEditing]=useState(false),[category,setCategory]=useState(item.categoryId),[type,setType]=useState(item.type),[saving,setSaving]=useState(false),[notice,setNotice]=useState('');
 const suggestion=suggestCategory(item.description);
 async function save(reset=false){setSaving(true);setNotice('');try{const ok=await hub?.classify(item,reset?null:{categoryId:category,type});setNotice(ok?'Salvo no cache protegido deste iPhone.':'Alteração não confirmada no armazenamento. Tente salvar novamente antes de fechar o app.');if(ok)setEditing(false);}catch{setNotice('Não foi possível salvar. Tente novamente na sessão desbloqueada.');}finally{setSaving(false);}}
 return <Card title={item.direction==='debit'?'Saída da conta':'Entrada na conta'}>
  <Money cents={item.amountCents} currency={item.currency}/><Body>{privacy.hidden?'Descrição protegida':item.description||'Sem descrição'}</Body>
  <Body>{metadataDateLabel(item.occurredAt)} · {institutionLabels[item.institutionId as keyof typeof institutionLabels]??'Banco'} · {item.status==='posted'?'Confirmado':item.status==='pending'?'Pendente':'Cancelado'}</Body>
  <Body>{privacy.hidden?'Classificação protegida':`${categoryLabel(item.categoryId)} · ${financialTypes.find(t=>t.id===item.type)?.label??'A revisar'}`}</Body>
  {!privacy.hidden&&<Action title={editing?'Fechar edição':'Editar categoria e tipo'} secondary onPress={()=>{setCategory(item.categoryId);setType(item.type);setEditing(!editing);setNotice('');}}/>}
  {editing&&!privacy.hidden&&<>
   <Body>Tipo: consumo entra no relatório de gastos. Transferência, aplicação e pagamento de fatura ficam separados.</Body>
   {financialTypes.map(t=><Action key={t.id} title={t.label} selected={type===t.id} secondary onPress={()=>setType(t.id)}/>)}
   <Body>Categoria</Body>
   {suggestion&&<Action title={`Sugestão local: ${categoryLabel(suggestion)}`} secondary onPress={()=>setCategory(suggestion)}/>}
   <Action title="Sem categoria" secondary selected={category===null} onPress={()=>setCategory(null)}/>
   {categories.map(c=><Action key={c.id} title={c.label} selected={category===c.id} secondary onPress={()=>setCategory(c.id)}/>)}
   <Action title={saving?'Salvando…':'Salvar classificação'} disabled={saving} onPress={()=>{void save();}}/>
   <Action title="Restaurar classificação da fonte" secondary disabled={saving} onPress={()=>{void save(true);}}/>
   <Body>Correção apenas neste iPhone. Sair da conta, apagar ou perder o cache remove suas classificações locais.</Body>
  </>}
  {!!notice&&<Body>{notice}</Body>}
 </Card>;
}
