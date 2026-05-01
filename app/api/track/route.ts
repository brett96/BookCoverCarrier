import { NextResponse } from "next/server";
import { UAParser } from "ua-parser-js";
import { getDb } from "@/lib/db/client";
import { events } from "@/lib/db/schema";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      visitorId?: string;
      sessionId?: string;
      eventType?: string;
      path?: string;
      referrer?: string | null;
      utm_source?: string;
      utm_medium?: string;
      utm_campaign?: string;
      properties?: Record<string, unknown>;
    };
    const visitorId = body.visitorId?.slice(0, 64) ?? "anon";
    const sessionId = body.sessionId?.slice(0, 64) ?? visitorId;
    const eventType = body.eventType?.slice(0, 32) ?? "unknown";
    const path = body.path?.slice(0, 2048) ?? "";
    const uaStr = req.headers.get("user-agent") ?? "";
    const ua = new UAParser(uaStr).getResult();
    const deviceType = ua.device.type ?? "desktop";
    const browser = ua.browser.name ?? "";
    const os = ua.os.name ?? "";
    const country = req.headers.get("x-vercel-ip-country") ?? undefined;
    const region = req.headers.get("x-vercel-ip-country-region") ?? undefined;
    const city = req.headers.get("x-vercel-ip-city") ?? undefined;

    const db = getDb();
    if (db) {
      await db.insert(events).values({
        visitorId,
        sessionId,
        eventType,
        path,
        referrer: body.referrer ?? null,
        utmSource: body.utm_source,
        utmMedium: body.utm_medium,
        utmCampaign: body.utm_campaign,
        country,
        region,
        city,
        deviceType,
        browser,
        os,
        properties: body.properties ?? {},
      });
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("track", e);
    return NextResponse.json({ ok: false }, { status: 400 });
  }
}
