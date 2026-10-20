import { AuthFailure } from './gateway.ts';
export interface SavedAccess { readonly origin: string; readonly refreshToken: string; readonly rememberUntil: number }
export interface RefreshVault { read(): Promise<SavedAccess | null>; write(value: SavedAccess): Promise<void>; clear(): Promise<void> }
interface NativeStore { get(): Promise<string | null>; set(value: string): Promise<void>; remove(): Promise<void> }
export const REMEMBER_MS = 30 * 24 * 60 * 60 * 1000;
/** The native adapter selects device-only Keychain protection. No password or access JWT. */
export function createRefreshVault(native: NativeStore, origin: string, now = Date.now): RefreshVault {
  if (!/^https:\/\/[a-z]{20}\.supabase\.co$/.test(origin)) throw new AuthFailure('invalid_configuration');
  const validate = (raw: unknown): SavedAccess => {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) throw new AuthFailure('invalid_credentials');
    const value = raw as Record<string, unknown>, time = now();
    if (!Number.isSafeInteger(time) || time < 0) throw new AuthFailure('invalid_credentials');
    if (Object.keys(value).sort().join(',') !== 'origin,refreshToken,rememberUntil' || value.origin !== origin || typeof value.refreshToken !== 'string' || !/^[A-Za-z0-9._~-]{8,512}$/.test(value.refreshToken) || typeof value.rememberUntil !== 'number' || !Number.isSafeInteger(value.rememberUntil) || value.rememberUntil <= time || value.rememberUntil > time + REMEMBER_MS) throw new AuthFailure('invalid_credentials');
    return Object.freeze({ origin, refreshToken: value.refreshToken, rememberUntil: value.rememberUntil });
  };
  return Object.freeze({
    async read() {
      let raw: string | null;
      try { raw = await native.get(); } catch { throw new AuthFailure('secure_storage'); }
      if (raw === null) return null;
      if (typeof raw !== 'string' || raw.length > 1024) throw new AuthFailure('invalid_credentials');
      try { return validate(JSON.parse(raw)); } catch (error) { throw error instanceof AuthFailure ? error : new AuthFailure('invalid_credentials'); }
    },
    async write(value: SavedAccess) {
      const safe = validate(value);
      try { await native.set(JSON.stringify(safe)); } catch { throw new AuthFailure('secure_storage'); }
    },
    async clear() { try { await native.remove(); } catch { throw new AuthFailure('secure_storage'); } },
  });
}
