import {AESEncryptionKey,AESSealedData,aesEncryptAsync,aesDecryptAsync} from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';
import {File,Paths} from 'expo-file-system';
import {Platform} from 'react-native';
import {createCacheVault} from './vault';
const instances=new Map<string,ReturnType<typeof createCacheVault>>();
export function nativeWalletCache(origin:string){
 if(Platform.OS!=='ios'||!/^https:\/\/[a-z]{20}\.supabase\.co$/.test(origin))return null;
 const existing=instances.get(origin);if(existing)return existing;
 const suffix=origin.slice(8,28),keyName='orbe.wallet.key.v1.'+suffix,options={keychainService:'orbe.wallet.cache.v1',keychainAccessible:SecureStore.WHEN_PASSCODE_SET_THIS_DEVICE_ONLY,requireAuthentication:false};
 const slotKey=keyName+'.slot',file=(slot:string)=>new File(Paths.cache,'orbe-wallet-'+suffix+'.'+slot+'.enc'),pending=()=>new File(Paths.cache,'orbe-wallet-'+suffix+'.next');
 const key=async(create:boolean)=>{let hex=await SecureStore.getItemAsync(keyName,options);if(!hex&&create){const fresh=await AESEncryptionKey.generate(256);hex=await fresh.encoded('hex');await SecureStore.setItemAsync(keyName,hex,options);return fresh;}if(!hex||! /^[0-9a-f]{64}$/i.test(hex))throw Error('cache_key_unavailable');return AESEncryptionKey.import(hex,'hex');};
 const vault=createCacheVault(origin,{
  async read(){const slot=await SecureStore.getItemAsync(slotKey,options);if(slot!=='0'&&slot!=='1')return null;const f=file(slot);if(!f.exists)return null;if(f.size>4*1024*1024+128)throw Error('cache_size');return f.bytes();},
  async write(bytes){const active=await SecureStore.getItemAsync(slotKey,options),next=active==='0'?'1':'0',tmp=pending();await tmp.create({overwrite:true});await tmp.write(bytes);await tmp.move(file(next),{overwrite:true});await SecureStore.setItemAsync(slotKey,next,options);},
  async remove(){await SecureStore.deleteItemAsync(keyName,options);await SecureStore.deleteItemAsync(slotKey,options);for(const f of [file('0'),file('1'),pending()])if(f.exists)await f.delete();},
  async encrypt(bytes,context){const sealed=await aesEncryptAsync(bytes,await key(true),{additionalData:new TextEncoder().encode(context)});return sealed.combined();},
  async decrypt(bytes,context){return aesDecryptAsync(AESSealedData.fromCombined(bytes),await key(false),{additionalData:new TextEncoder().encode(context)});}
 });instances.set(origin,vault);return vault;
}
