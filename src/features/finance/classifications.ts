import type {LocalMovement} from '../../data/local/query.ts';
import type {FinancialType} from '../../domain/expenses.ts';
export const categories=[{id:'food',label:'Alimentação'},{id:'housing',label:'Moradia'},{id:'transport',label:'Transporte'},{id:'health',label:'Saúde'},{id:'education',label:'Educação'},{id:'leisure',label:'Lazer'},{id:'shopping',label:'Compras'},{id:'subscriptions',label:'Assinaturas'},{id:'taxes',label:'Impostos e taxas'},{id:'other',label:'Outros'}] as const;
export const financialTypes:readonly {id:FinancialType;label:string}[]=[{id:'expense',label:'Gasto de consumo'},{id:'income',label:'Receita'},{id:'own_transfer',label:'Transferência entre minhas contas'},{id:'contribution',label:'Aplicação'},{id:'redemption',label:'Resgate'},{id:'yield',label:'Rendimento'},{id:'card_settlement',label:'Pagamento de fatura'},{id:'refund',label:'Estorno'},{id:'unknown',label:'A revisar'}];
export const categoryLabel=(id:string|null)=>categories.find(c=>c.id===id)?.label??'Sem categoria';
export const movementKey=(m:Pick<LocalMovement,'source'|'accountId'|'externalId'>)=>JSON.stringify([m.source,m.accountId,m.externalId]);
export interface Correction {source:string;accountId:string;externalId:string;revision:number;categoryId:string|null;type:FinancialType}
export function validateCorrections(raw:unknown):Correction[]{
 if(!Array.isArray(raw)||raw.length>10000)throw Error('invalid_corrections');
 const seen=new Set<string>();return raw.map(value=>{
  if(!value||typeof value!=='object'||![value.source,value.accountId,value.externalId].every(v=>typeof v==='string'&&v.length>0&&v.length<=256)||!Number.isSafeInteger(value.revision)||value.revision<1||!financialTypes.some(t=>t.id===value.type)||value.categoryId!==null&&!categories.some(c=>c.id===value.categoryId))throw Error('invalid_corrections');
  const row:Correction={source:value.source,accountId:value.accountId,externalId:value.externalId,revision:value.revision,type:value.type,categoryId:value.categoryId};const key=movementKey(row);if(seen.has(key))throw Error('duplicate_correction');seen.add(key);return row;
 });
}
export function applyCorrections(rows:readonly LocalMovement[],corrections:readonly Correction[],connections:readonly {id:string;revision:number}[]):LocalMovement[]{
 const valid=new Map(corrections.filter(c=>connections.some(b=>c.source==='connection:'+b.id&&c.revision===b.revision)).map(c=>[movementKey(c),c]));
 return rows.map(row=>{const correction=valid.get(movementKey(row));return {...row,...(correction?{categoryId:correction.categoryId,type:correction.type}:{})};});
}
/** Suggestion only. Never automatically labels transfers or turns a debit into consumption. */
export function suggestCategory(description:string):string|null{
 const words=description.normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().split(/[^a-z0-9]+/);
 const rules:readonly [string,readonly string[]][]=[['food',['restaurante','padaria','supermercado','ifood']],['transport',['uber','99app','combustivel','estacionamento']],['health',['farmacia','drogaria']],['education',['escola','faculdade']],['subscriptions',['netflix','spotify']]];
 return rules.find(([,terms])=>terms.some(term=>words.includes(term)))?.[0]??null;
}
