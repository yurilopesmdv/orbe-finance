import {createContext,useContext,useEffect,useState,useSyncExternalStore,type ReactNode} from 'react';
import {fetch as expoFetch} from 'expo/fetch';
import {useAuth} from '../auth/provider';
import {useScreenProtection,useScreenProtectionModel} from '../privacy/provider';
import {createAccountsRuntime} from '../accounts/runtime';
import {createMovementsRuntime} from '../movements/runtime';
import {createInvestmentsRuntime} from '../investments/runtime';
import {createConnectionStatusReader} from '../connections/status';
import {createAccountScopeId} from '../accounts/native-scope';
import {publicAuthConfig} from '../../config/auth';
import {runtime} from '../../config/runtime';
import {createFinanceHub,type FinanceHub,type FinanceSnapshot} from './hub';
const Context=createContext<FinanceHub|null>(null),idle:Readonly<FinanceSnapshot>=Object.freeze({phase:'idle',connections:[],progress:'',completedAt:null,nextAt:null,revision:0}),idleSnapshot=()=>idle,idleSubscribe=()=>()=>{};
export function FinanceProvider({children}:{children:ReactNode}){
 const auth=useAuth(),protection=useScreenProtectionModel(),screen=useScreenProtection(),[hub,setHub]=useState<FinanceHub|null>(null);
 useEffect(()=>{
  setHub(null);if(!runtime.liveIntegrationEnabled||!runtime.privateFinancialDataApproved||!auth.model||auth.snapshot.state!=='unlocked'||!protection||screen.snapshot.phase!=='ready'||!screen.snapshot.active)return;
  const config=()=>publicAuthConfig,accounts=createAccountsRuntime(auth.model,protection,config,expoFetch,createAccountScopeId,runtime),movements=createMovementsRuntime(auth.model,protection,config,expoFetch,createAccountScopeId,runtime),investments=createInvestmentsRuntime(auth.model,protection,config,expoFetch,createAccountScopeId,runtime);
  if(accounts.kind!=='ready'||movements.kind!=='ready'||investments.kind!=='ready'){for(const client of [accounts,movements,investments])if(client.kind==='ready')client.close();return;}
  const reader=createConnectionStatusReader(auth.model,config,expoFetch,{enabled:true});
  const current=createFinanceHub(auth.model,protection,{clients:{accounts,movements,investments},status:signal=>reader.read(signal)});setHub(current);void current.synchronize();return()=>current.close();
 },[auth.model,auth.snapshot.state,protection,screen.snapshot.phase,screen.snapshot.active]);
 return <Context.Provider value={hub}>{children}</Context.Provider>;
}
export function useFinance(){const hub=useContext(Context),snapshot=useSyncExternalStore(hub?.subscribe??idleSubscribe,hub?.getSnapshot??idleSnapshot,idleSnapshot);return {hub,snapshot};}
