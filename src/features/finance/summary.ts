import type {LocalAsset} from '../../data/local/assets.ts';
import {sumCents} from '../../domain/money.ts';
/** Account subtotal and investment subtotal are separate until overlap is established. */
export function summarizeHome(accounts:readonly LocalAsset[],investments:readonly LocalAsset[],currency='BRL',accountsLoaded=false,investmentsLoaded=false){
 const unique=(rows:readonly LocalAsset[])=>{const map=new Map<string,LocalAsset>();for(const row of rows){const key=[row.connectionId,row.product,row.id].join(':');const old=map.get(key);if(old&&old.amountCents!==row.amountCents)throw Error('conflicting_home_asset');map.set(key,row);}return [...map.values()].filter(row=>row.currency===currency&&row.kind==='asset');};
 const balances=unique(accounts),positions=unique(investments),sum=(rows:readonly LocalAsset[],loaded:boolean)=>!loaded&&rows.length===0?null:rows.some(row=>row.amountCents===null)?null:sumCents(rows.map(row=>row.amountCents!));
 const accountsTotal=sum(balances,accountsLoaded),investmentsTotal=sum(positions,investmentsLoaded),distinct=positions.filter(row=>row.relation==='distinct');
 const consolidated=accountsTotal===null||distinct.some(row=>row.amountCents===null)?null:sumCents([accountsTotal,...distinct.map(row=>row.amountCents??0)]);
 return Object.freeze({accountsTotal,investmentsTotal,consolidated,overlapUnknown:positions.some(row=>row.relation==='unknown'),partial:accountsTotal===null||balances.some(row=>row.asOf===null)||positions.some(row=>row.relation==='unknown'||row.amountCents===null)||!accountsLoaded||!investmentsLoaded});
}
