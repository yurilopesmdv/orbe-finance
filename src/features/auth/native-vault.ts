import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { createRefreshVault, type RefreshVault } from './refresh-vault';
/** SDK58 adapter: device passcode required; no FaceID or plaintext fallback. */
export function createNativeRefreshVault(origin: string): RefreshVault | undefined {
  if (Platform.OS !== 'ios' || !/^https:\/\/[a-z]{20}\.supabase\.co$/.test(origin)) return undefined;
  const key = 'orbe.auth.refresh.v1.' + origin.slice(8, 28);
  const options = { keychainService: 'orbe.auth.session.v1',
    keychainAccessible: SecureStore.WHEN_PASSCODE_SET_THIS_DEVICE_ONLY, requireAuthentication: false };
  return createRefreshVault({
    get: () => SecureStore.getItemAsync(key, options),
    set: value => SecureStore.setItemAsync(key, value, options),
    remove: () => SecureStore.deleteItemAsync(key, options),
  }, origin);
}
