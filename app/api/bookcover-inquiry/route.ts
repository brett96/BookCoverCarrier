import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { z } from "zod";
import { getDb } from "@/lib/db/client";
import { events, leads } from "@/lib/db/schema";
import { sendLeadEmails } from "@/lib/email";
import {
  appendInquiryToSheet,
  type SheetInquiryPayload,
} from "@/lib/sheets/append-inquiry";

const PLACEHOLDER = "—";

const optionalString = (max: number) =>
  z
    .union([z.string(), z.null(), z.undefined()])
    .transform((v) => {
      const s = (v ?? "").toString().trim();
      if (s.length === 0) return null;
      return s.slice(0, max);
    });

const schema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Please enter your full name.")
    .max(255),
  email: z
    .string()
    .trim()
    .email("Please enter a valid work email.")
    .max(255),
  company: optionalString(255),
  phone: optionalString(64),
  role: optionalString(255),
  message: optionalString(4000),
  visitorId: optionalString(64),
  sessionId: optionalString(64),
  utm_source: optionalString(255),
  utm_medium: optionalString(255),
  utm_campaign: optionalString(255),
});

function splitName(full: string) {
  const parts = full.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return { firstName: PLACEHOLDER, lastName: PLACEHOLDER };
  }
  if (parts.length === 1) {
    return { firstName: parts[0]!, lastName: PLACEHOLDER };
  }
  return {
    firstName: parts[0]!,
    lastName: parts.slice(1).join(" "),
  };
}

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid request body." },
      { status: 400 }
    );
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0];
    return NextResponse.json(
      {
        ok: false,
        error:
          firstIssue?.message ??
          "Please enter your full name and a valid work email.",
      },
      { status: 400 }
    );
  }

  const data = parsed.data;
  const { firstName, lastName } = splitName(data.name);
  const submittedAt = new Date().toISOString();

  const h = await headers();
  const ip =
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    h.get("x-real-ip") ??
    null;
  const userAgent = h.get("user-agent");
  const referrer = h.get("referer");

  let leadId: string | null = null;
  let dbError: string | null = null;

  const db = getDb();
  if (!db) {
    dbError = "no DATABASE_URL configured";
    console.error("[bookcover-inquiry]", dbError);
  } else {
    try {
      const [lead] = await db
        .insert(leads)
        .values({
          firstName,
          lastName,
          title: data.role ?? PLACEHOLDER,
          organization: data.company ?? PLACEHOLDER,
          email: data.email,
          phone: data.phone,
          linesOfBusiness: [],
          memberCount: null,
          challenge: null,
          preferredDate: PLACEHOLDER,
          preferredTime: PLACEHOLDER,
          timezone: PLACEHOLDER,
          howHeard: null,
          alternateDate: null,
          additionalNotes: data.message,
          status: "new",
          ip: ip ?? undefined,
          userAgent: userAgent ?? undefined,
          utmSource: data.utm_source ?? undefined,
          utmMedium: data.utm_medium ?? undefined,
          utmCampaign: data.utm_campaign ?? undefined,
          referrer: referrer ?? undefined,
          visitorId: data.visitorId ?? undefined,
        })
        .returning();

      if (lead) {
        leadId = lead.id;

        const vid = (data.visitorId ?? "anon").slice(0, 64);
        const sid = (data.sessionId ?? vid).slice(0, 64);
        try {
          await db.insert(events).values({
            visitorId: vid,
            sessionId: sid,
            eventType: "form_submit",
            path: "/contact",
            referrer: referrer ?? null,
            utmSource: data.utm_source ?? undefined,
            utmMedium: data.utm_medium ?? undefined,
            utmCampaign: data.utm_campaign ?? undefined,
            properties: { leadId: lead.id, role: data.role ?? null },
          });
        } catch (eventErr) {
          console.error("[bookcover-inquiry] event insert", eventErr);
        }

        try {
          await sendLeadEmails(lead);
        } catch (emailErr) {
          console.error("[bookcover-inquiry] email send", emailErr);
        }
      } else {
        dbError = "lead insert returned no row";
        console.error("[bookcover-inquiry]", dbError);
      }
    } catch (err) {
      dbError = err instanceof Error ? err.message : String(err);
      console.error("[bookcover-inquiry] db", err);
    }
  }

  const sheetPayload: SheetInquiryPayload = {
    name: data.name,
    email: data.email,
    company: data.company ?? "",
    phone: data.phone ?? "",
    role: data.role ?? "",
    message: data.message ?? "",
    submittedAt,
    visitorId: data.visitorId,
    sessionId: data.sessionId,
    utmSource: data.utm_source,
    utmMedium: data.utm_medium,
    utmCampaign: data.utm_campaign,
    referrer: referrer ?? null,
    leadId,
  };
  const sheetResult = await appendInquiryToSheet(sheetPayload);

  const dbStored = leadId !== null;
  const sheetStored = sheetResult.ok && !("skipped" in sheetResult && sheetResult.skipped);

  if (!dbStored && !sheetStored) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "We couldn't save your submission right now. Please try again or email info@cercalabs.com.",
      },
      { status: 500 }
    );
  }

  return NextResponse.json({
    ok: true,
    storedInDatabase: dbStored,
    storedInSheet: sheetStored,
    ...(dbError ? { dbError } : {}),
    ...(sheetResult.ok === false ? { sheetError: sheetResult.error } : {}),
  });
}
