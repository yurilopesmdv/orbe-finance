/** ExpoFetch iOS forwards headers, but does not forward RequestInit.cache.
 * HTTP directives protect conforming caches; they do not certify the host runtime.
 */
export const privateRequestHeaders = Object.freeze({ 'Cache-Control': 'no-store, no-cache', Pragma: 'no-cache' } as const);
