export type JsonResponse = Pick<Response,'headers'|'body'>;
function invalid(): never { throw new Error('invalid_json_response'); }
/** Bounds decoded bytes before JSON.parse. No unbounded text/json fallback. */
export async function readBoundedJson(response: JsonResponse, signal: AbortSignal, maxBytes = 131072): Promise<unknown> {
  let body: ReadableStream<Uint8Array> | null | undefined, reader: ReadableStreamDefaultReader<Uint8Array> | undefined;
  let stop: (() => void) | undefined;
  const cancel = () => {
    try { const work = reader ? reader.cancel() : body?.cancel(); void work?.catch(() => {}); } catch { /* No raw errors or logging. */ }
  };
  try {
    body = response.body;
    if (!Number.isSafeInteger(maxBytes) || maxBytes < 1 || maxBytes > 131072 || signal.aborted) return invalid();
    const mime = response.headers.get('content-type'), declared = response.headers.get('content-length');
    if (!/^application\/json(?:\s*;.*)?$/i.test(mime ?? '') || declared !== null && (!/^(?:0|[1-9]\d*)$/.test(declared) || !Number.isSafeInteger(Number(declared)) || Number(declared) > maxBytes) || !body || typeof body.getReader !== 'function') return invalid();
    reader = body.getReader();
    const interrupted = new Promise<never>((_resolve,reject) => {
      stop = () => { cancel(); reject(new Error('invalid_json_response')); };
      signal.addEventListener('abort',stop,{ once:true });
    });
    void interrupted.catch(() => {});
    const chunks: Uint8Array[] = []; let length = 0;
    while (true) {
      if (signal.aborted) return invalid();
      const { value,done } = await Promise.race([reader.read(),interrupted]);
      if (signal.aborted) return invalid();
      if (done) break;
      if (!(value instanceof Uint8Array)) return invalid();
      length += value.byteLength;
      if (length > maxBytes) return invalid();
      chunks.push(value);
    }
    const bytes = new Uint8Array(length); let offset = 0;
    for (const chunk of chunks) { bytes.set(chunk,offset); offset += chunk.byteLength; }
    return JSON.parse(new TextDecoder('utf-8',{ fatal:true }).decode(bytes));
  } catch { cancel(); return invalid(); }
  finally { if (stop) signal.removeEventListener('abort',stop); try { reader?.releaseLock(); } catch { /* A broken transport cannot publish an error payload. */ } }
}
