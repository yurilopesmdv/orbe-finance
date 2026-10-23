import type {ConnectionMetadata} from '../connections/status.ts';
import type {ProductReadState,FinanceProduct} from './hub.ts';
export const personalBanks=['mercado-pago','bradesco','nubank'] as const;
export function productCoverage(connection:Readonly<ConnectionMetadata>|undefined,product:FinanceProduct,reads:readonly Readonly<ProductReadState>[]){
 if(!connection)return 'unlinked' as const;
 if(connection.state!=='active')return 'inactive' as const;
 if(connection.capabilities[product]===null)return 'unconfirmed' as const;
 if(connection.capabilities[product]!==true)return 'unsupported' as const;
 const read=reads.find(row=>row.connectionId===connection.id&&row.revision===connection.revision&&row.product===product);
 if(!read)return 'waiting' as const;
 if(read.status==='loading')return 'loading' as const;
 if(read.status!=='complete')return read.status;
 return read.cachedItems===0?'empty' as const:'received' as const;
}
export const coverageLabels={unlinked:'Ainda não vinculado ao Orbe',inactive:'Conexão precisa de atenção',unconfirmed:'Disponibilidade ainda não confirmada',unsupported:'Não disponibilizado pela fonte',waiting:'Aguardando leitura automática',loading:'Atualizando',unavailable:'Não foi possível atualizar',cooldown:'Aguardando intervalo',empty:'Leitura concluída · sem posições recebidas',received:'Posições recebidas'} as const;
