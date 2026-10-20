import { randomUUID } from 'expo-crypto';
/** Random local cache namespace; never derived from Auth or bank identity. */
export function createAccountScopeId(): string { return randomUUID(); }
