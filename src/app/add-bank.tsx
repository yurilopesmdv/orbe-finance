import {useEffect,useRef,useState} from 'react';
import {Redirect,useRouter} from 'expo-router';
import {View,Text,Pressable,StyleSheet} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {WebView} from 'react-native-webview';
import {fetch as expoFetch} from 'expo/fetch';
import {PrivateScreen} from '@/components/private-screen';
import {palette} from '@/components/theme';
import {useAuth} from '@/features/auth/provider';
import {useFinance} from '@/features/finance/provider';
import {createSessionJsonClient} from '@/lib/session-json';
import {publicAuthConfig} from '@/config/auth';
import {connectUrl,connectLocation,widgetMessage,allowedConnectNavigation} from '@/features/connections/connect-protocol';
export default function AddBank(){
 const auth=useAuth(),finance=useFinance(),router=useRouter(),main=useRef<WebView<object>>(null),claimed=useRef(false),activeRequest=useRef<AbortController|null>(null);
 const [flow,setFlow]=useState<{flowId:string;connectToken:string}|null>(null),[pendingItem,setPendingItem]=useState<string|null>(null),[oauth,setOauth]=useState<string|null>(null),[notice,setNotice]=useState('Abrindo sua carteira Meu Pluggy…'),[retry,setRetry]=useState(0);
 useEffect(()=>{
  if(!auth.model||auth.snapshot.state!=='unlocked')return;
  const controller=new AbortController();activeRequest.current=controller;claimed.current=false;
  const request=createSessionJsonClient(auth.model,()=>publicAuthConfig,expoFetch);
  void request('connectToken',{},controller.signal).then(raw=>{if(controller.signal.aborted)return;const v=raw as {flowId:string;connectToken:string};if(!v||! /^[0-9a-f-]{36}$/.test(v.flowId))throw Error();connectUrl(v.connectToken);setFlow(v);setNotice('Selecione o banco já conectado no Meu Pluggy. O Orbe faz o restante.');}).catch(()=>{if(!controller.signal.aborted)setNotice('Não foi possível abrir a conexão. Tente novamente.');});
  return()=>{controller.abort();setFlow(null);setOauth(null);};
 },[auth.model,auth.snapshot.state,retry]);
 if(auth.snapshot.state!=='unlocked')return <Redirect href="/login"/>;
 const complete=async(raw:string)=>{const id=connectLocation(raw);if(!id||!flow||!auth.model||claimed.current)return;claimed.current=true;setPendingItem(id);setOauth(null);setNotice('Validando a conexão e preparando seus dados…');
  try{const signal=activeRequest.current?.signal;if(!signal||signal.aborted)return;const request=createSessionJsonClient(auth.model,()=>publicAuthConfig,expoFetch);const result=await request('importConnection',{flowId:flow.flowId,itemId:id},signal) as {status?:string};if(signal.aborted)return;if(result?.status!=='registered')throw Error();setFlow(null);void finance.hub?.synchronize(false);router.replace('/account');}catch{if(activeRequest.current?.signal.aborted)return;claimed.current=false;setNotice('A conexão ainda não pôde ser confirmada. Aguarde a conclusão no Meu Pluggy e tente novamente.');}
 };
 return <PrivateScreen><SafeAreaView style={styles.page} edges={['top','bottom']}>
  <View style={styles.header}><Text style={styles.title}>Adicionar banco</Text><Pressable accessibilityRole="button" onPress={()=>router.back()}><Text style={styles.link}>Fechar</Text></Pressable></View>
  <Text style={styles.body}>{notice}</Text>
  {flow&&<View style={{flex:oauth?0:1}}><WebView<object> ref={main} source={{uri:connectUrl(flow.connectToken)}} style={{flex:1,backgroundColor:palette.background}} originWhitelist={['https://*']} sharedCookiesEnabled={false} thirdPartyCookiesEnabled={false} webviewDebuggingEnabled={false} allowsBackForwardNavigationGestures={false} setSupportMultipleWindows={false} onShouldStartLoadWithRequest={r=>allowedConnectNavigation(r.url)} onNavigationStateChange={s=>{void complete(s.url);}} onMessage={event=>{const message=widgetMessage(event.nativeEvent.data,event.nativeEvent.url);if(message?.type==='location')void complete(message.url);else if(message?.type==='oauth')setOauth(message.url);}} onError={()=>setNotice('Não foi possível carregar o Meu Pluggy. Tente novamente.')}/></View>}
  {oauth&&<WebView<object> source={{uri:oauth}} style={{flex:1}} originWhitelist={['https://*']} sharedCookiesEnabled={false} thirdPartyCookiesEnabled={false} webviewDebuggingEnabled={false} onShouldStartLoadWithRequest={r=>allowedConnectNavigation(r.url,true)} injectedJavaScriptBeforeContentLoaded={`window.opener={postMessage:function(message){window.ReactNativeWebView.postMessage(JSON.stringify({type:'OAUTH_CALLBACK',message:message}));}};true;`} onMessage={event=>{try{if(event.nativeEvent.data.length>16384)return;const v=JSON.parse(event.nativeEvent.data);if(v.type!=='OAUTH_CALLBACK'||!v.message||typeof v.message!=='object')return;main.current?.injectJavaScript('document.dispatchEvent(new MessageEvent("message",{data:'+JSON.stringify({...v.message,source:'connector-oauth-login'})+'}));true;');setOauth(null);}catch{}}} onNavigationStateChange={s=>{if(s.url.startsWith('https://api.pluggy.ai/connectors/200/oauth/callback')||s.url.startsWith('https://connect.pluggy.ai/oauthCallback.html'))setOauth(null);}} onError={()=>setNotice('Não foi possível concluir o acesso ao Meu Pluggy.')}/>}
  {pendingItem&&flow&&<Pressable accessibilityRole="button" onPress={()=>{void complete('https://connect.pluggy.ai/?events=SUCCESS&item_id='+pendingItem);}}><Text style={styles.link}>Tentar concluir conexão</Text></Pressable>}
  <Pressable accessibilityRole="button" onPress={()=>{setPendingItem(null);setFlow(null);setOauth(null);setRetry(v=>v+1);}}><Text style={styles.link}>Reabrir conexão</Text></Pressable>
 </SafeAreaView></PrivateScreen>;
}
const styles=StyleSheet.create({page:{flex:1,backgroundColor:palette.background,padding:16,gap:12},header:{flexDirection:'row',alignItems:'center',justifyContent:'space-between'},title:{fontSize:22,fontWeight:'700',color:palette.ink},body:{fontSize:14,lineHeight:21,color:palette.muted},link:{fontSize:15,color:palette.accent,paddingVertical:12}});
