type Context = { source?: unknown };
type Reviver = (key: string, value: unknown, context?: Context) => unknown;
type Parser = (text: string, reviver: Reviver) => unknown;
const literals = new WeakMap<object, string>();
function unavailable(): never { throw Error('provider_json_unavailable'); }
function numericSource(value: unknown, context?: Context): unknown {
  if (typeof value !== 'number') return value;
  const source = context?.source;
  if (typeof source !== 'string' || source.length > 128 || !/^-?(?:0|[1-9][0-9]*)(?:\.[0-9]+)?(?:[eE][+-]?[0-9]+)?$/.test(source)) return unavailable();
  const cell = Object.freeze({}); literals.set(cell, source); return cell;
}
function checkBounds(text: string, maxBytes: number) {
  if (typeof text !== 'string' || text.length > maxBytes || new TextEncoder().encode(text).length > maxBytes) unavailable();
  let depth = 0, quoted = false, escaped = false;
  for (const char of text) {
    if (quoted) {
      if (escaped) escaped = false;
      else if (char === '\\') escaped = true;
      else if (char === '"') quoted = false;
    } else if (char === '"') quoted = true;
    else if (char === '[' || char === '{') { if (++depth > 64) unavailable(); }
    else if (char === ']' || char === '}') { if (--depth < 0) unavailable(); }
  }
  if (quoted || depth !== 0) unavailable();
}
/** Initialize before any provider read. Unsupported hosts have no lossy fallback. */
export function createExactJsonDecoder(parser: Parser = JSON.parse, profile: 'standard' | 'transactions' | 'investments' = 'standard'): (text: string) => unknown {
  if (profile !== 'standard' && profile !== 'transactions' && profile !== 'investments') return unavailable();
  const maxBytes = profile === 'standard' ? 131072 : 1048576;
  try {
    let proven = false;
    parser('9007199254740993', (_key, value, context) => { if (typeof value === 'number' && context?.source === '9007199254740993') proven = true; return value; });
    if (!proven) return unavailable();
  } catch { return unavailable(); }
  return text => {
    try { checkBounds(text, maxBytes); return parser(text, (_key, value, context) => numericSource(value, context)); }
    catch { return unavailable(); }
  };
}
/** Only values minted by the exact decoder possess a numeric source. */
export function exactNumberText(value: unknown): string {
  const literal = value !== null && typeof value === 'object' ? literals.get(value) : undefined;
  if (literal === undefined) return unavailable();
  return literal;
}
export function exactInteger(value: unknown, maximum: number, minimum = 0): number {
  if (!Number.isSafeInteger(minimum) || !Number.isSafeInteger(maximum) || minimum < 0 || maximum < minimum) return unavailable();
  const text = exactNumberText(value);
  if (!/^(?:0|[1-9][0-9]{0,15})$/.test(text)) return unavailable();
  const result = Number(text);
  if (!Number.isSafeInteger(result) || result < minimum || result > maximum) return unavailable();
  return result;
}
