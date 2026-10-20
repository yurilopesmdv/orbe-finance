type Network = (url: string, init: RequestInit) => Promise<Response>;
const SUPABASE = 'https://vvaufaoahotmaocrcyij.supabase.co';
const PLUGGY = 'https://api.pluggy.ai';
const UUID = '[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}';
const forbidden = (): never => { throw Error('account_network_unavailable'); };
/** Prepared network boundary only; not imported by the deployed entrypoint. */
export function createAccountNetworkTransport(options: { enabled?: boolean; privateDataApproved?: boolean; network?: Network } = {}): Network {
  if (options.enabled !== true || options.privateDataApproved !== true) return async () => forbidden();
  const network = options.network ?? ((url: string, init: RequestInit) => globalThis.fetch(url, init));
  return async (raw, input) => {
    let response: Response | undefined;
    try {
      if (typeof raw !== 'string' || !input || !(input.signal instanceof AbortSignal) || input.signal.aborted) return forbidden();
      const url = new URL(raw);
      if (url.href !== raw || url.username || url.password || url.hash) return forbidden();
      let kind: 'user' | 'session' | 'rpc' | 'provider-auth' | 'provider-read';
      if (raw === SUPABASE + '/auth/v1/user') kind = 'user';
      else if (raw === SUPABASE + '/rest/v1/rpc/orbe_has_session') kind = 'session';
      else if (['orbe_begin_connection_read', 'orbe_check_connection_read', 'orbe_finish_connection_read', 'orbe_resolve_account_read', 'orbe_resolve_pending_inventory', 'orbe_stage_account_bindings'].some(name => raw === SUPABASE + '/rest/v1/rpc/' + name)) kind = 'rpc';
      else if (raw === PLUGGY + '/auth') kind = 'provider-auth';
      else if (url.origin === PLUGGY && (new RegExp('^/items/' + UUID + '$').test(url.pathname) && url.search === '' || url.pathname === '/accounts' && url.search.startsWith('?itemId=') && new RegExp('^' + UUID + '$').test(url.search.slice(8)))) kind = 'provider-read';
      else return forbidden();
      const get = kind === 'user' || kind === 'provider-read';
      if (input.method !== (get ? 'GET' : 'POST')) return forbidden();
      if (get ? input.body != null : typeof input.body !== 'string' || new TextEncoder().encode(input.body).length > (raw === SUPABASE + '/rest/v1/rpc/orbe_stage_account_bindings' ? 131072 : 16384)) return forbidden();
      const headers = new Headers(input.headers);
      if (headers.has('cache-control') && headers.get('cache-control') !== 'no-store') return forbidden();
      const allowed = ['accept', 'cache-control', ...(get ? [] : ['content-type']), ...(kind === 'provider-read' ? ['x-api-key'] : kind === 'provider-auth' ? [] : kind === 'rpc' ? ['apikey'] : ['apikey', 'authorization'])];
      if ([...headers.keys()].some(name => !allowed.includes(name)) || headers.get('accept') !== 'application/json' || !get && headers.get('content-type') !== 'application/json') return forbidden();
      if (kind === 'user' || kind === 'session') {
        if (!/^sb_publishable_[A-Za-z0-9_-]+$/.test(headers.get('apikey') ?? '') || !/^Bearer [A-Za-z0-9._~-]{1,8192}$/.test(headers.get('authorization') ?? '')) return forbidden();
      } else if (kind === 'rpc') {
        if (!/^sb_secret_[A-Za-z0-9_-]{1,512}$/.test(headers.get('apikey') ?? '')) return forbidden();
      } else if (kind === 'provider-read' && !/^[A-Za-z0-9._~-]{16,4000}$/.test(headers.get('x-api-key') ?? '')) return forbidden();
      if (input.signal.aborted) return forbidden();
      response = await network(raw, { method: input.method, headers, ...(get ? {} : { body: input.body }), signal: input.signal,
        redirect: 'error', credentials: 'omit', cache: 'no-store', referrerPolicy: 'no-referrer' });
      if (input.signal.aborted || response.redirected || response.status >= 300 && response.status < 400 || response.url && response.url !== raw) return forbidden();
      return response;
    } catch {
      try { void response?.body?.cancel().catch(() => {}); } catch { /* No raw output. */ }
      return forbidden();
    }
  };
}
