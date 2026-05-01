/** Windows-1252 code point → single byte (inverse of single-byte decode). */
function buildUnicodeToByteMap(): Map<number, number> {
  const dec = new TextDecoder("windows-1252");
  const m = new Map<number, number>();
  for (let b = 0; b < 256; b++) {
    const cp = dec.decode(new Uint8Array([b])).codePointAt(0);
    if (cp !== undefined) m.set(cp, b);
  }
  m.set(0x178, 0x9f); // Ÿ ← UTF-8 0x9F (emoji continuation)
  m.set(0x20ac, 0x80); // € ← UTF-8 0x80
  m.set(0x2019, 0x92); // ' ← 0x92
  return m;
}

const UNICODE_TO_BYTE = buildUnicodeToByteMap();

/**
 * UTF-8 continuation bytes 0x80–0xBF are often saved as smart quotes / punctuation
 * instead of the raw C1 controls WHATWG windows-1252 gives for 0x80–0x9F.
 */
function byteFromMojibakeChar(cp: number, j: number, chars: string[]): number | undefined {
  const cp0 = chars[0]!.codePointAt(0)!;
  const cp1 = chars.length > 1 ? chars[1]!.codePointAt(0)! : 0;
  if (j === 2 && cp0 === 0xe2 && cp1 === 0x161 && cp === 0x20) return 0xa0;
  if (j < 2 || cp0 !== 0xf0 || cp1 !== 0x178) return undefined;
  const next = chars[j + 1];
  const nextCp = next ? next.codePointAt(0)! : 0;
  // 📦 U+1F4E6 uses byte 0x93; editors sometimes substitute ' (U+2019) for " (U+201C)
  if (j === 2 && cp === 0x2019 && nextCp === 0xa6) return 0x93;
  switch (cp) {
    case 0x2018:
      return 0x91;
    case 0x2019:
    case 0x27:
      return 0x92;
    case 0x201c:
      return 0x93;
    case 0x201d:
      return 0x94;
    case 0x2039:
      return 0x8b;
    case 0x203a:
      return 0x9b;
    // Latin letters / symbols substituted for C1 / continuation bytes in some exports
    case 0x17d:
      return 0x8e;
    case 0x17e:
      return 0x9e;
    case 0x160:
      return 0x8a;
    case 0x161:
      return 0x9a;
    case 0x2c6:
      return 0x88;
    default:
      return undefined;
  }
}

function tryUtf8BytesFromMojibake(chunk: string): string | null {
  const chars = [...chunk];
  const bytes: number[] = [];
  for (let j = 0; j < chars.length; j++) {
    const c = chars[j]!;
    const cp = c.codePointAt(0)!;
    if (cp > 0xffff) return null;
    const b = UNICODE_TO_BYTE.get(cp) ?? byteFromMojibakeChar(cp, j, chars);
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

function isRecoveredSymbolOrPunct(t: string): boolean {
  if (isEmojiOrSymbolResult(t)) return true;
  for (const ch of t) {
    const p = ch.codePointAt(0)!;
    if (p >= 0x2000 && p <= 0x206f) return true;
    if (p >= 0x20d0 && p <= 0x20ff) return true;
    if (p >= 0x2100 && p <= 0x2bff) return true;
    if (p === 0xa0) return true;
  }
  return false;
}

/** Avoid E2-cluster matching ASCII letters after a short punctuation decode (false positives). */
function isSafeE2Recovery(chunk: string, decoded: string): boolean {
  if (decoded.length > 6) return false;
  const last = decoded.codePointAt(decoded.length - 1)!;
  if (last >= 0x41 && last <= 0x5a) return false;
  if (last >= 0x61 && last <= 0x7a) return false;
  if (chunk.length > 6 && decoded.length <= 2) return false;
  return true;
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
    const max = Math.min(24, html.length - i);
    for (let len = max; len >= 4; len--) {
      const chunk = html.slice(i, i + len);
      if (chunk.includes("<")) continue;
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

/** Replace UTF-8–as–mojibake clusters starting with â (U+00E2). */
function replaceLeadingE2Clusters(html: string): string {
  let out = "";
  let i = 0;
  while (i < html.length) {
    const cp = html.codePointAt(i)!;
    if (cp !== 0xe2) {
      const unit = html[i]!;
      out += unit;
      i += unit.length;
      continue;
    }
    let replaced = false;
    const max = Math.min(12, html.length - i);
    for (let len = max; len >= 3; len--) {
      const chunk = html.slice(i, i + len);
      if (chunk.includes("<")) continue;
      const t = tryUtf8BytesFromMojibake(chunk);
      if (t && isRecoveredSymbolOrPunct(t) && isSafeE2Recovery(chunk, t)) {
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

  // Stray â before a real en dash (UTF-8 E2 80 93 only partially “repaired” in some exports)
  s = s.replaceAll("\u00e2\u2013", "\u2013");

  // Em / en dash (UTF-8 E2 80 94 / E2 80 93) — third char is U+201D / U+201C, not ASCII "
  s = s.replaceAll("\u00e2\u20ac\u201d", "\u2014");
  s = s.replaceAll("\u00e2\u20ac\u201c", "\u2013");
  s = s.replaceAll("\u00e2\u20ac\u0022", "\u2014");

  s = s.replaceAll("\u00c3\u2014", "\u00d7");

  s = s.replaceAll("\u00e2\u0153\u201c", "\u2713");
  s = s.replaceAll("\u00e2\u0153\u201d", "\u2714");
  s = s.replaceAll("\u00e2\u0153\u2026", "\u2705");

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

  // → (UTF-8 E2 86 92) misread as CP1252
  s = s.replaceAll("\u00e2\u2020\u2019", "\u2192");
  s = s.replaceAll("\u00e2\u2020\u201d", "\u2192");

  // Known broken 4-byte sequences in source HTML (wrong last byte / editor substitution)
  s = s.replaceAll("\u00f0\u0178\u201d\u0081", "\u{1F91D}");
  s = s.replaceAll("\u00f0\u0178\u201c\u00a3", "\u{1F4E2}");
  // 🏪 U+1F3EA: spurious space before feminine ordinal (byte AA) in some copies
  s = s.replaceAll("\u00f0\u0178\u0020\u00aa", "\u{1F3EA}");

  s = replaceLeadingE2Clusters(s);
  s = replaceLeadingF0Clusters(s);

  return s;
}
