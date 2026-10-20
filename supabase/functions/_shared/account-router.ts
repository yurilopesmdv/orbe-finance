import { createAccountReadHandler, type AccountReadPorts } from './account-read.ts';
import { createReadLeaseHandler } from './read-lease-handler.ts';
import type { LeasePorts } from './lease-rest.ts';
import type { BridgeClock } from './bridge.ts';
/** Internal fixture composition. Deployed bridge remains disabled. */
export function createAccountRouter(ports: AccountReadPorts & Pick<LeasePorts,'acquire'|'finish'>, options: {enabled?:boolean;fixtureOnly?:boolean;clock?:BridgeClock}={}) {
 const read=createAccountReadHandler(ports,options),lease=createReadLeaseHandler(ports,options);
 if(options.enabled!==true||options.fixtureOnly!==true)return read;
 return async(request:Request)=>{try{return new URL(request.url).pathname==='/accounts/read'?read(request):lease(request);}catch{return new Response(JSON.stringify({error:'unavailable'}),{status:503,headers:{'Content-Type':'application/json','Cache-Control':'no-store'}});}};
}
