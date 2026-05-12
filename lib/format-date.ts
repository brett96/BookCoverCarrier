/**
 * Date / time helpers that render in America/Los_Angeles (Pacific Time).
 *
 * The browser and the database both store timestamps in UTC. The admin UI
 * displays them in Pacific time, with the "PT / PDT / PST" abbreviation that
 * Intl.DateTimeFormat picks automatically based on DST for the given instant.
 */

export const PT_TIMEZONE = "America/Los_Angeles";

function toDate(value: Date | string | number | null | undefined): Date | null {
  if (value === null || value === undefined) return null;
  const d = value instanceof Date ? value : new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function partOf(parts: Intl.DateTimeFormatPart[], type: Intl.DateTimeFormatPartTypes) {
  return parts.find((p) => p.type === type)?.value ?? "";
}

/**
 * Returns "YYYY-MM-DD HH:MM:SS PDT" (or PST during winter) for the supplied
 * timestamp. Pacific-local clock time + the live timezone abbreviation.
 */
export function formatPtDateTime(value: Date | string | number | null | undefined): string {
  const d = toDate(value);
  if (!d) return "—";
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: PT_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
    timeZoneName: "short",
  }).formatToParts(d);
  let hour = partOf(parts, "hour");
  if (hour === "24") hour = "00";
  return `${partOf(parts, "year")}-${partOf(parts, "month")}-${partOf(parts, "day")} ${hour}:${partOf(parts, "minute")}:${partOf(parts, "second")} ${partOf(parts, "timeZoneName")}`;
}

/**
 * Returns "YYYY-MM-DD" for the supplied timestamp, in Pacific Time. Used for
 * day bucketing in charts so a visit at 11:00 PT shows up on the same calendar
 * day as a visit at 23:00 PT (instead of being split across UTC midnight).
 */
export function formatPtDate(value: Date | string | number | null | undefined): string {
  const d = toDate(value);
  if (!d) return "";
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: PT_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(d);
  return `${partOf(parts, "year")}-${partOf(parts, "month")}-${partOf(parts, "day")}`;
}

/**
 * Compact relative-time string ("11s ago", "3m ago", "2h ago", "4d ago").
 * Timezone-independent — only the elapsed wall-clock matters.
 */
export function formatRelative(value: Date | string | number | null | undefined): string {
  const d = toDate(value);
  if (!d) return "—";
  const diffMs = Date.now() - d.getTime();
  if (diffMs < 0) return "in the future";
  const sec = Math.round(diffMs / 1000);
  if (sec < 60) return `${sec}s ago`;
  const min = Math.round(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.round(min / 60);
  if (hr < 48) return `${hr}h ago`;
  const day = Math.round(hr / 24);
  return `${day}d ago`;
}

/**
 * Pacific offset (in minutes east of UTC) at the given instant. PDT is -420,
 * PST is -480. Used internally for `startOfPtDay`.
 */
function ptOffsetMinutes(at: Date): number {
  const offsetPart = new Intl.DateTimeFormat("en-US", {
    timeZone: PT_TIMEZONE,
    timeZoneName: "longOffset",
  })
    .formatToParts(at)
    .find((p) => p.type === "timeZoneName")?.value ?? "GMT";
  const m = /GMT([+-])(\d{1,2}):?(\d{2})?/.exec(offsetPart);
  if (!m) return 0;
  const sign = m[1] === "-" ? -1 : 1;
  const hours = parseInt(m[2]!, 10);
  const mins = m[3] ? parseInt(m[3], 10) : 0;
  return sign * (hours * 60 + mins);
}

/**
 * Returns a Date whose UTC instant equals midnight in Pacific Time for
 * "today" (PT). Used by queries that want "since the start of today (PT)".
 */
export function startOfPtDay(): Date {
  const ptDateStr = formatPtDate(new Date());
  if (!ptDateStr) return new Date();
  const naiveMidnightUtc = new Date(`${ptDateStr}T00:00:00Z`);
  const offsetMin = ptOffsetMinutes(naiveMidnightUtc);
  return new Date(naiveMidnightUtc.getTime() - offsetMin * 60_000);
}

/**
 * Defensively percent-decodes a city/region value. Vercel injects URL-encoded
 * geo headers (e.g. "San%20Jose"); the track route already decodes new rows,
 * but legacy rows may still be encoded — so we decode again at display time.
 */
export function decodeGeo(value: string | null | undefined): string | null {
  if (!value) return value ?? null;
  if (!value.includes("%")) return value;
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}
