import {
  and,
  count,
  countDistinct,
  desc,
  eq,
  gte,
  isNotNull,
  max,
} from "drizzle-orm";
import type { Db } from "@/lib/db/client";
import { events, leads } from "@/lib/db/schema";
import { formatPtDate, startOfPtDay } from "@/lib/format-date";

function since(days: number) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d;
}

export async function distinctVisitorsToday(db: Db) {
  const [row] = await db
    .select({ c: countDistinct(events.visitorId) })
    .from(events)
    .where(
      and(
        eq(events.eventType, "pageview"),
        gte(events.occurredAt, startOfPtDay())
      )
    );
  return Number(row?.c ?? 0);
}

export async function distinctVisitors(db: Db, days: number) {
  const [row] = await db
    .select({ c: countDistinct(events.visitorId) })
    .from(events)
    .where(
      and(eq(events.eventType, "pageview"), gte(events.occurredAt, since(days)))
    );
  return Number(row?.c ?? 0);
}

export async function pageviewsByDay(db: Db, days: number) {
  const rows = await db
    .select()
    .from(events)
    .where(
      and(eq(events.eventType, "pageview"), gte(events.occurredAt, since(days)))
    );
  const map = new Map<string, Set<string>>();
  for (const r of rows) {
    const d = formatPtDate(r.occurredAt);
    if (!map.has(d)) map.set(d, new Set());
    map.get(d)!.add(r.visitorId);
  }
  return [...map.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, set]) => ({ date, visitors: set.size }));
}

export async function leadsCountSince(db: Db, days: number) {
  const [row] = await db
    .select({ c: count() })
    .from(leads)
    .where(gte(leads.createdAt, since(days)));
  return Number(row?.c ?? 0);
}

export async function funnelCounts(db: Db, days: number) {
  const types = [
    "pageview",
    "cta_click",
    "form_start",
    "form_submit",
  ] as const;
  const out: Record<string, number> = {};
  for (const t of types) {
    const [row] = await db
      .select({ c: countDistinct(events.visitorId) })
      .from(events)
      .where(and(eq(events.eventType, t), gte(events.occurredAt, since(days))));
    out[t] = Number(row?.c ?? 0);
  }
  return out;
}

export async function topPaths(db: Db, days: number, limit = 10) {
  const c = count();
  return db
    .select({
      path: events.path,
      c,
    })
    .from(events)
    .where(
      and(
        eq(events.eventType, "pageview"),
        gte(events.occurredAt, since(days)),
        isNotNull(events.path)
      )
    )
    .groupBy(events.path)
    .orderBy(desc(c))
    .limit(limit);
}

export async function topReferrers(db: Db, days: number, limit = 10) {
  const c = count();
  return db
    .select({
      referrer: events.referrer,
      c,
    })
    .from(events)
    .where(
      and(
        eq(events.eventType, "pageview"),
        gte(events.occurredAt, since(days)),
        isNotNull(events.referrer)
      )
    )
    .groupBy(events.referrer)
    .orderBy(desc(c))
    .limit(limit);
}

export async function topCountries(db: Db, days: number, limit = 10) {
  const c = count();
  return db
    .select({
      country: events.country,
      c,
    })
    .from(events)
    .where(
      and(
        eq(events.eventType, "pageview"),
        gte(events.occurredAt, since(days)),
        isNotNull(events.country)
      )
    )
    .groupBy(events.country)
    .orderBy(desc(c))
    .limit(limit);
}

export async function topRegions(db: Db, days: number, limit = 12) {
  const c = count();
  return db
    .select({
      region: events.region,
      country: events.country,
      c,
    })
    .from(events)
    .where(
      and(
        eq(events.eventType, "pageview"),
        gte(events.occurredAt, since(days)),
        isNotNull(events.region)
      )
    )
    .groupBy(events.region, events.country)
    .orderBy(desc(c))
    .limit(limit);
}

export async function topCities(db: Db, days: number, limit = 12) {
  const c = count();
  return db
    .select({
      city: events.city,
      region: events.region,
      country: events.country,
      c,
    })
    .from(events)
    .where(
      and(
        eq(events.eventType, "pageview"),
        gte(events.occurredAt, since(days)),
        isNotNull(events.city)
      )
    )
    .groupBy(events.city, events.region, events.country)
    .orderBy(desc(c))
    .limit(limit);
}

export async function topIps(db: Db, days: number, limit = 20) {
  const c = count();
  return db
    .select({
      ip: events.ip,
      city: events.city,
      region: events.region,
      country: events.country,
      visits: c,
      lastSeen: max(events.occurredAt),
    })
    .from(events)
    .where(
      and(
        eq(events.eventType, "pageview"),
        gte(events.occurredAt, since(days)),
        isNotNull(events.ip)
      )
    )
    .groupBy(events.ip, events.city, events.region, events.country)
    .orderBy(desc(c))
    .limit(limit);
}

export async function recentVisits(db: Db, limit = 30) {
  return db
    .select({
      occurredAt: events.occurredAt,
      visitorId: events.visitorId,
      sessionId: events.sessionId,
      ip: events.ip,
      city: events.city,
      region: events.region,
      country: events.country,
      path: events.path,
      referrer: events.referrer,
      deviceType: events.deviceType,
      browser: events.browser,
      os: events.os,
      userAgent: events.userAgent,
    })
    .from(events)
    .where(eq(events.eventType, "pageview"))
    .orderBy(desc(events.occurredAt))
    .limit(limit);
}

export async function deviceBreakdown(db: Db, days: number) {
  const rows = await db
    .select()
    .from(events)
    .where(
      and(eq(events.eventType, "pageview"), gte(events.occurredAt, since(days)))
    );
  const map = new Map<string, number>();
  for (const r of rows) {
    const d = r.deviceType ?? "unknown";
    map.set(d, (map.get(d) ?? 0) + 1);
  }
  return [...map.entries()].sort((a, b) => b[1] - a[1]);
}

export async function ctaLeaderboard(db: Db, days: number) {
  const rows = await db
    .select()
    .from(events)
    .where(
      and(eq(events.eventType, "cta_click"), gte(events.occurredAt, since(days)))
    );
  const map = new Map<string, number>();
  for (const r of rows) {
    const loc = (r.properties as { location?: string })?.location ?? "unknown";
    map.set(loc, (map.get(loc) ?? 0) + 1);
  }
  return [...map.entries()].sort((a, b) => b[1] - a[1]);
}

export async function tabViews(db: Db, days: number, context: string) {
  const rows = await db
    .select()
    .from(events)
    .where(
      and(eq(events.eventType, "tab_view"), gte(events.occurredAt, since(days)))
    );
  const map = new Map<string, number>();
  for (const r of rows) {
    const p = r.properties as { context?: string; tab?: string };
    if (p.context !== context) continue;
    const key = p.tab ?? "unknown";
    map.set(key, (map.get(key) ?? 0) + 1);
  }
  return [...map.entries()].sort((a, b) => b[1] - a[1]);
}

export async function scrollDepthAvg(db: Db, days: number) {
  const rows = await db
    .select()
    .from(events)
    .where(
      and(eq(events.eventType, "scroll_depth"), gte(events.occurredAt, since(days)))
    );
  if (!rows.length) return 0;
  const sum = rows.reduce(
    (acc, r) => acc + Number((r.properties as { percent?: number })?.percent ?? 0),
    0
  );
  return Math.round(sum / rows.length);
}

export async function recentLeads(db: Db, limit = 8) {
  return db.select().from(leads).orderBy(desc(leads.createdAt)).limit(limit);
}

export async function utmFunnel(db: Db, days: number) {
  const rows = await db
    .select()
    .from(events)
    .where(
      and(eq(events.eventType, "pageview"), gte(events.occurredAt, since(days)))
    );
  const map = new Map<string, { pageviews: number; submits: number }>();
  for (const r of rows) {
    const key =
      [r.utmSource, r.utmMedium].filter(Boolean).join(" / ") || "(direct / none)";
    if (!map.has(key)) map.set(key, { pageviews: 0, submits: 0 });
    map.get(key)!.pageviews += 1;
  }
  const subs = await db
    .select()
    .from(events)
    .where(
      and(eq(events.eventType, "form_submit"), gte(events.occurredAt, since(days)))
    );
  for (const r of subs) {
    const key =
      [r.utmSource, r.utmMedium].filter(Boolean).join(" / ") || "(direct / none)";
    if (!map.has(key)) map.set(key, { pageviews: 0, submits: 0 });
    map.get(key)!.submits += 1;
  }
  return [...map.entries()].map(([source, v]) => ({
    source,
    ...v,
    rate: v.pageviews ? ((v.submits / v.pageviews) * 100).toFixed(1) : "0",
  }));
}
