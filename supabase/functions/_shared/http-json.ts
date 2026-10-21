function unavailable(): never { throw new Error('bridge_upstream_unavailable'); }
function active(signal: AbortSignal): void { if (signal.aborted) unavailable(); }

export async function readJsonResponse(response: Response, signal: AbortSignal, maxBytes = 131072, decode: (text: string) => unknown = JSON.parse): Promise<unknown> {
  if (!Number.isSafeInteger(maxBytes) || maxBytes < 1 || maxBytes > 131072) unavailable();
  return readBounded(response, signal, maxBytes, decode);
}
/** Transaction pages only. Prepare a source-preserving decoder before issuing the provider request. */
export async function readTransactionJsonResponse(response: Response, signal: AbortSignal, decode: (text: string) => unknown): Promise<unknown> {
  if (typeof decode !== 'function') unavailable();
  return readBounded(response, signal, 1048576, decode);
}
async function readBounded(response: Response, signal: AbortSignal, maxBytes: number, decode: (text: string) => unknown): Promise<unknown> {
  if (!/^application\/json(?:\s*;.*)?$/i.test(response.headers.get('content-type') ?? '') || !response.body) unavailable();
  const reader = response.body.getReader(); const chunks: Uint8Array[] = []; let length = 0;
  const cancel = () => { void reader.cancel().catch(() => {}); };
  signal.addEventListener('abort', cancel, { once: true });
  try {
    active(signal);
    while (true) {
      const { value, done } = await reader.read(); active(signal); if (done) break;
      length += value.byteLength;
      if (length > maxBytes) { cancel(); unavailable(); }
      chunks.push(value);
    }
    const bytes = new Uint8Array(length); let offset = 0;
    for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
    try { const result = decode(new TextDecoder('utf-8', { fatal: true }).decode(bytes)); active(signal); return result; } catch { return unavailable(); }
  } finally { signal.removeEventListener('abort', cancel); reader.releaseLock(); }
}
