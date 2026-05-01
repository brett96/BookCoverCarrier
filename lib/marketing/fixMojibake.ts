/** Windows-1252 code point → single byte (inverse of single-byte decode). */
function buildUnicodeToByteMap(): Map<number, number> {
  const dec = new TextDecoder("windows-1252");
  const m = new Map<number, number>();
  for (let b = 0; b < 256; b++) {
    const cp = dec.decode(new Uint8Array([b])).codePointAt(0);
    if (cp !== undefined) m.set(cp, b);
  }
  m.set(0x178, 0x9f); // Ÿ ← UTF-8 0x9F (emoji continuation)
  m.set(0xa1, 0x9a); // ¡ ← 0x9A
  m.set(0x20ac, 0x80); // € ← UTF-8 0x80
  m.set(0x2019, 0x92); // ' ← 0x92
  return m;
}

const UNICODE_TO_BYTE = buildUnicodeToByteMap();

function tryUtf8BytesFromMojibake(chunk: string): string | null {
  const bytes: number[] = [];
  for (const c of chunk) {
    const cp = c.codePointAt(0)!;
    if (cp > 0xffff) return null;
    const b = UNICODE_TO_BYTE.get(cp);
    if (b === undefined) return null;
    bytes.push(b);
  }
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(new Uint8Array(bytes));
  } catch {
    return null;
  }
}

function isEmojiOrSymbolResult(t: string): boolean {
  for (const ch of t) {
    const p = ch.codePointAt(0)!;
    if (p >= 0x1f000 && p <= 0x1ffff) return true;
    if (p >= 0x2600 && p <= 0x27bf) return true;
    if (p === 0xfe0f) return true;
  }
  return false;
}

/** Replace UTF-8–as–mojibake clusters starting with ð (U+00F0). */
function replaceLeadingF0Clusters(html: string): string {
  let out = "";
  let i = 0;
  while (i < html.length) {
    const cp = html.codePointAt(i)!;
    if (cp !== 0xf0) {
      const unit = html[i]!;
      out += unit;
      i += unit.length;
      continue;
    }
    let replaced = false;
    const max = Math.min(20, html.length - i);
    for (let len = max; len >= 4; len--) {
      const chunk = html.slice(i, i + len);
      if (chunk.includes("<")) break;
      const t = tryUtf8BytesFromMojibake(chunk);
      if (t && isEmojiOrSymbolResult(t)) {
        out += t;
        i += len;
        replaced = true;
        break;
      }
    }
    if (!replaced) {
      out += html[i]!;
      i += html[i]!.length;
    }
  }
  return out;
}

/**
 * Fixes UTF-8 read as Windows-1252 / mixed mojibake in marketing HTML fragments.
 */
export function fixMojibake(html: string): string {
  let s = html;

  // Em / en dash (UTF-8 E2 80 94 / E2 80 93) — third char is U+201D / U+201C, not ASCII "
  s = s.replaceAll("\u00e2\u20ac\u201d", "\u2014");
  s = s.replaceAll("\u00e2\u20ac\u201c", "\u2013");

  s = s.replaceAll("\u00c3\u2014", "\u00d7");

  s = s.replaceAll("\u00e2\u0153\u201c", "\u2713");
  s = s.replaceAll("\u00e2\u0099\u2026", "\u2714");

  s = s.replaceAll("\u00c2\u00a9", "\u00a9");
  s = s.replaceAll("\u00c2\u00b7", "\u00b7");

  s = s.replaceAll("\u00e2\u20ac\u2122", "\u2019");

  s = s.replaceAll("\u00e2\u2013\u00bc", "\u25bc");
  s = s.replaceAll("\u00e2\u2013\u00b2", "\u25b2");
  s = s.replaceAll("\u00e2\u02c6\u2019", "\u2212");
  s = s.replaceAll("\u00e2\u0097\u008f", "\u25cf");
  s = s.replaceAll("\u00e2\u008f\u00b8", "\u23f8");
  s = s.replaceAll("\u00e2\u2020\u2018", "\u2191");
  s = s.replaceAll("\u00e2\u20ac\u00ba", "\u203a");

  s = replaceLeadingF0Clusters(s);

  return s;
}
