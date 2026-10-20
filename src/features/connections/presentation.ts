import type { ConnectionMetadata } from './status.ts';
export const institutionLabels: Readonly<Record<ConnectionMetadata['institution'], string>> = Object.freeze({ bradesco: 'Bradesco PF', 'mercado-pago': 'Mercado Pago PF', inter: 'Inter PF', nubank: 'Nubank PF' });
const states = { pending: 'Em preparação', active: 'Conexão cadastrada', paused: 'Buscas pausadas', renewal_required: 'Autorização precisa ser renovada', revoked: 'Autorização revogada', error: 'Conexão precisa de atenção' } as const;
export function connectionStateLabel(connection: Readonly<ConnectionMetadata>, now: number): string {
  if (connection.state !== 'active') return states[connection.state];
  if (!Number.isFinite(now)) return 'Autorização ainda não confirmada';
  if (connection.authorizationExpiresAt !== null && Date.parse(connection.authorizationExpiresAt) <= now) return 'Autorização vencida';
  if (connection.proxyConsentExpiresAt === null) return 'Prazo de autorização ainda não confirmado';
  return states.active;
}
export const capabilityLabel = (value: boolean | null): string => value === true ? 'Informado como disponível pela fonte' : value === false ? 'Indisponível na fonte' : 'Ainda não confirmado';
export function metadataDateLabel(value: string | null): string {
  if (value === null) return 'Não informada';
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return 'Não informada';
  return new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo', day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(date) + ' · Brasília';
}
