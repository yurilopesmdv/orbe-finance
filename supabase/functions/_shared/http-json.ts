function unavailable(): never { throw new Error('bridge_upstream_unavailable'); }
function active(signal: AbortSignal): void { if (signal.aborted) unavailable(); }

export async function readJsonResponse(response: Response, signal: AbortSignal, maxBytes = 131072): Promise<unknown> {
  if (!Number.isSafeInteger(maxBytes) || maxBytes < 1 || maxBytes > 131072) unavailable();
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
    try { return JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes)); } catch { return unavailable(); }
  } finally { signal.removeEventListener('abort', cancel); reader.releaseLock(); }
}
