import { resolveExecutionMode, type ExecutionPolicy } from './execution-mode.ts';

export interface MovementIdentityScope { ownerSubject: string; accountId: string }
type Result = Readonly<{ kind: 'id'; movementId: string }> | Readonly<{ kind: 'disabled' | 'unavailable' }>;
type Subtle = Pick<SubtleCrypto, 'importKey' | 'sign'>;
const uuid = (value: unknown): value is string => typeof value === 'string' && value.length === 36 && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(value);
const disabled: Result = Object.freeze({ kind: 'disabled' });
const unavailable: Result = Object.freeze({ kind: 'unavailable' });
const inert = (result: Result) => Object.freeze({ deriveMovement: async (_externalId: unknown): Promise<Result> => result, close() {} });

/** Server-only pseudonymization. The caller must authorize the account before constructing this port. */
export function createMovementIdentity(readKey: () => Uint8Array | Promise<Uint8Array>, scope: MovementIdentityScope, policy: ExecutionPolicy & { enabled?: boolean; subtle?: Subtle } = {}) {
  if (policy.enabled !== true || resolveExecutionMode(policy) === null) return inert(disabled);
  try {
    if (typeof readKey !== 'function' || typeof scope !== 'object' || scope === null || Array.isArray(scope) || !Object.hasOwn(scope, 'ownerSubject') || !Object.hasOwn(scope, 'accountId')) return inert(unavailable);
    const owner = scope.ownerSubject, account = scope.accountId;
    if (!uuid(owner) || !uuid(account)) return inert(unavailable);
    const subtle = policy.subtle ?? globalThis.crypto.subtle;
    let closed = false;
    let keyPromise: Promise<CryptoKey | null> | null = null;
    const key = () => {
      if (!keyPromise) keyPromise = (async () => {
        let copy: Uint8Array<ArrayBuffer> | null = null;
        try {
          const source = await readKey();
          if (closed || !(source instanceof Uint8Array) || source.byteLength !== 32 || !source.some(byte => byte !== 0)) return null;
          copy = new Uint8Array(32); copy.set(source);
          const imported = await subtle.importKey('raw', copy, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
          return closed ? null : imported;
        } catch { return null; }
        finally { copy?.fill(0); }
      })();
      return keyPromise;
    };
    return Object.freeze({
      async deriveMovement(externalId: unknown): Promise<Result> {
        if (closed || !uuid(externalId)) return unavailable;
        try {
          const imported = await key();
          if (closed || !imported) return unavailable;
          const message = new TextEncoder().encode(['orbe:movement:v1', owner, account, externalId].join('\0'));
          const signature = new Uint8Array(await subtle.sign('HMAC', imported, message));
          if (closed || signature.byteLength !== 32) return unavailable;
          const bytes = signature.slice(0, 16);
          bytes[6] = (bytes[6]! & 15) | 128;
          bytes[8] = (bytes[8]! & 63) | 128;
          const hex = Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');
          return Object.freeze({ kind: 'id', movementId: [hex.slice(0,8), hex.slice(8,12), hex.slice(12,16), hex.slice(16,20), hex.slice(20)].join('-') });
        } catch { return unavailable; }
      },
      close() { closed = true; keyPromise = null; },
    });
  } catch { return inert(unavailable); }
}
