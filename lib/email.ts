import nodemailer from "nodemailer";
import type { Lead } from "@/lib/db/schema";
import { setSiteSetting } from "@/lib/site-settings";

let transporter: nodemailer.Transporter | null = null;

function getTransport() {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD?.replace(/\s/g, "");
  if (!user || !pass) return null;
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: { user, pass },
    });
  }
  return transporter;
}

function leadHtml(lead: Lead) {
  const rows: [string, string][] = [
    ["Name", `${lead.firstName} ${lead.lastName}`],
    ["Title", lead.title],
    ["Organization", lead.organization],
    ["Email", lead.email],
    ["Phone", lead.phone ?? "—"],
    ["LOB", (lead.linesOfBusiness ?? []).join(", ") || "—"],
    ["Member count", lead.memberCount ?? "—"],
    ["Challenge", lead.challenge ?? "—"],
    ["Preferred date", lead.preferredDate],
    ["Preferred time", lead.preferredTime],
    ["Timezone", lead.timezone],
    ["How heard", lead.howHeard ?? "—"],
    ["Alternate date", lead.alternateDate ?? "—"],
    ["Notes", lead.additionalNotes ?? "—"],
    ["Referrer", lead.referrer ?? "—"],
    ["UTM", [lead.utmSource, lead.utmMedium, lead.utmCampaign].filter(Boolean).join(" / ") || "—"],
    ["Visitor ID", lead.visitorId ?? "—"],
  ];
  const body = rows
    .map(
      ([k, v]) =>
        `<tr><td style="padding:8px;border:1px solid #ddd;font-weight:700">${k}</td><td style="padding:8px;border:1px solid #ddd">${escapeHtml(v)}</td></tr>`
    )
    .join("");
  return `<!DOCTYPE html><html><body><h2>New BookCover lead</h2><table style="border-collapse:collapse">${body}</table></body></html>`;
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function sendLeadEmails(lead: Lead) {
  const to = process.env.LEAD_NOTIFICATION_EMAIL;
  const fromUser = process.env.GMAIL_USER;
  if (!to || !fromUser) {
    await setSiteSetting(
      "last_email_error",
      "Missing LEAD_NOTIFICATION_EMAIL or GMAIL_USER"
    );
    return;
  }
  const transport = getTransport();
  if (!transport) {
    await setSiteSetting(
      "last_email_error",
      "Missing GMAIL_USER or GMAIL_APP_PASSWORD"
    );
    return;
  }
  try {
    await transport.sendMail({
      from: `"BookCover" <${fromUser}>`,
      to,
      replyTo: lead.email,
      subject: `New lead: ${lead.firstName} ${lead.lastName} — ${lead.organization}`,
      html: leadHtml(lead),
    });
    await transport.sendMail({
      from: `"BookCover" <${fromUser}>`,
      to: lead.email,
      subject: "We received your request — BookCover",
      text: `Hi ${lead.firstName},\n\nThank you for reaching out. A BookCover consultant will contact you soon to confirm your preferred time.\n\n— BookCover`,
    });
    await setSiteSetting("last_email_error", "");
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("sendLeadEmails", e);
    await setSiteSetting("last_email_error", msg);
  }
}
