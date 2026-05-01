"use server";

import { headers } from "next/headers";
import { z } from "zod";
import { getDb } from "@/lib/db/client";
import { events, leads } from "@/lib/db/schema";
import { sendLeadEmails } from "@/lib/email";

const schema = z.object({
  firstName: z.string().min(1).max(120),
  lastName: z.string().min(1).max(120),
  title: z.string().min(1).max(255),
  organization: z.string().min(1).max(255),
  email: z.string().email().max(255),
  phone: z.string().max(64).optional().nullable(),
  linesOfBusiness: z.array(z.string()).default([]),
  memberCount: z.string().max(64).optional().nullable(),
  challenge: z.string().optional().nullable(),
  preferredDate: z.string().min(1),
  preferredTime: z.string().min(1),
  timezone: z.string().min(1),
  howHeard: z.string().max(255).optional().nullable(),
  alternateDate: z.string().max(32).optional().nullable(),
  additionalNotes: z.string().optional().nullable(),
  visitorId: z.string().max(64).optional().nullable(),
  sessionId: z.string().max(64).optional().nullable(),
  utmSource: z.string().max(255).optional().nullable(),
  utmMedium: z.string().max(255).optional().nullable(),
  utmCampaign: z.string().max(255).optional().nullable(),
});

export type SubmitLeadState =
  | { ok: true }
  | { ok: false; message: string; fieldErrors?: Record<string, string[]> };

export async function submitLead(
  _prev: SubmitLeadState | undefined,
  formData: FormData
): Promise<SubmitLeadState> {
  const lobRaw = formData.getAll("lob") as string[];
  const raw = {
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    title: formData.get("title"),
    organization: formData.get("organization"),
    email: formData.get("email"),
    phone: (formData.get("phone") as string) || null,
    linesOfBusiness: lobRaw.filter(Boolean),
    memberCount: (formData.get("memberCount") as string) || null,
    challenge: (formData.get("challenge") as string) || null,
    preferredDate: formData.get("preferredDate"),
    preferredTime: formData.get("preferredTime"),
    timezone: formData.get("timezone"),
    howHeard: (formData.get("howHeard") as string) || null,
    alternateDate: (formData.get("alternateDate") as string) || null,
    additionalNotes: (formData.get("additionalNotes") as string) || null,
    visitorId: (formData.get("visitorId") as string) || null,
    sessionId: (formData.get("sessionId") as string) || null,
    utmSource: (formData.get("utm_source") as string) || null,
    utmMedium: (formData.get("utm_medium") as string) || null,
    utmCampaign: (formData.get("utm_campaign") as string) || null,
  };

  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    const fe = parsed.error.flatten().fieldErrors;
    return { ok: false, message: "Please fix the highlighted fields.", fieldErrors: fe };
  }

  const h = await headers();
  const ip =
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    h.get("x-real-ip") ??
    null;
  const userAgent = h.get("user-agent");
  const referrer = h.get("referer");

  const db = getDb();
  if (!db) {
    return { ok: false, message: "Database is not configured." };
  }

  const [lead] = await db
    .insert(leads)
    .values({
      firstName: parsed.data.firstName,
      lastName: parsed.data.lastName,
      title: parsed.data.title,
      organization: parsed.data.organization,
      email: parsed.data.email,
      phone: parsed.data.phone ?? null,
      linesOfBusiness: parsed.data.linesOfBusiness,
      memberCount: parsed.data.memberCount ?? null,
      challenge: parsed.data.challenge ?? null,
      preferredDate: parsed.data.preferredDate,
      preferredTime: parsed.data.preferredTime,
      timezone: parsed.data.timezone,
      howHeard: parsed.data.howHeard ?? null,
      alternateDate: parsed.data.alternateDate ?? null,
      additionalNotes: parsed.data.additionalNotes ?? null,
      status: "new",
      ip: ip ?? undefined,
      userAgent: userAgent ?? undefined,
      utmSource: parsed.data.utmSource ?? undefined,
      utmMedium: parsed.data.utmMedium ?? undefined,
      utmCampaign: parsed.data.utmCampaign ?? undefined,
      referrer: referrer ?? undefined,
      visitorId: parsed.data.visitorId ?? undefined,
    })
    .returning();

  if (!lead) {
    return { ok: false, message: "Could not save your request." };
  }

  const vid = (parsed.data.visitorId ?? "anon").slice(0, 64);
  const sid = (parsed.data.sessionId ?? vid).slice(0, 64);
  await db.insert(events).values({
    visitorId: vid,
    sessionId: sid,
    eventType: "form_submit",
    path: "/contact",
    referrer: referrer ?? null,
    utmSource: parsed.data.utmSource ?? undefined,
    utmMedium: parsed.data.utmMedium ?? undefined,
    utmCampaign: parsed.data.utmCampaign ?? undefined,
    properties: { leadId: lead.id },
  });

  await sendLeadEmails(lead);

  return { ok: true };
}
