import { createExactJsonDecoder } from './exact-json.ts';
export type AccountConfigurationName = 'ORBE_BRIDGE_ENABLED' | 'ORBE_ACCOUNT_READS_ENABLED' | 'ORBE_INVENTORY_DISCOVERY_ENABLED' | 'ORBE_PRIVATE_DATA_APPROVED' | 'SUPABASE_URL' | 'ORBE_PUBLISHABLE_KEY' | 'ORBE_BACKEND_SECRET_KEY' | 'PLUGGY_CLIENT_ID' | 'PLUGGY_CLIENT_SECRET';
export type AccountConfigurationReader = (name: AccountConfigurationName) => unknown;
/** Shared prepared configuration, not a live-data approval or entrypoint. */
export function readPreparedAccountConfiguration(read: AccountConfigurationReader, feature: 'ORBE_ACCOUNT_READS_ENABLED' | 'ORBE_INVENTORY_DISCOVERY_ENABLED') {
  try {
    if (!['ORBE_ACCOUNT_READS_ENABLED', 'ORBE_INVENTORY_DISCOVERY_ENABLED'].includes(feature) || read('ORBE_BRIDGE_ENABLED') !== 'true' || read(feature) !== 'true' || read('ORBE_PRIVATE_DATA_APPROVED') !== 'true') return null;
    createExactJsonDecoder();
    const origin = read('SUPABASE_URL'), publishableKey = read('ORBE_PUBLISHABLE_KEY'), secretKey = read('ORBE_BACKEND_SECRET_KEY'), clientId = read('PLUGGY_CLIENT_ID'), clientSecret = read('PLUGGY_CLIENT_SECRET');
    if (origin !== 'https://vvaufaoahotmaocrcyij.supabase.co' || typeof publishableKey !== 'string' || !/^sb_publishable_[A-Za-z0-9_-]+$/.test(publishableKey) || typeof secretKey !== 'string' || !/^sb_secret_[A-Za-z0-9_-]{1,512}$/.test(secretKey) || typeof clientId !== 'string' || !/^[A-Za-z0-9_-]{1,256}$/.test(clientId) || typeof clientSecret !== 'string' || !/^[A-Za-z0-9._~/-]{16,512}$/.test(clientSecret)) return null;
    return Object.freeze({ origin, publishableKey, secretKey, clientId, clientSecret });
  } catch { return null; }
}
