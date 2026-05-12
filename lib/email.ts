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

export async function sendPasswordResetEmail(
  to: string,
  resetUrl: string
): Promise<boolean> {
  const fromUser = process.env.GMAIL_USER;
  if (!fromUser) {
    await setSiteSetting(
      "last_email_error",
      "Missing GMAIL_USER for password reset"
    );
    return false;
  }
  const transport = getTransport();
  if (!transport) {
    await setSiteSetting(
      "last_email_error",
      "Missing GMAIL_USER or GMAIL_APP_PASSWORD for password reset"
    );
    return false;
  }
  try {
    await transport.sendMail({
      from: `"BookCover Admin" <${fromUser}>`,
      to,
      subject: "BookCover admin password reset",
      text:
        "A password reset was requested for the BookCover admin dashboard.\n\n" +
        "Open the link below to set a new password. This link can be used only " +
        "once and expires in 60 minutes:\n\n" +
        `${resetUrl}\n\n` +
        "If you didn't request this, you can safely ignore this email.\n\n" +
        "— BookCover",
      html:
        `<!DOCTYPE html><html><body style="font-family:Arial,sans-serif;color:#0f172a;background:#f8fafc;padding:24px">` +
        `<table style="max-width:520px;margin:0 auto;background:white;border:1px solid #e2e8f0;border-radius:12px;padding:28px"><tr><td>` +
        `<h2 style="margin:0 0 12px;font-family:Nunito,Arial,sans-serif;color:#003087">BookCover admin password reset</h2>` +
        `<p style="line-height:1.6;color:#1e293b">A password reset was requested for the BookCover admin dashboard.</p>` +
        `<p style="margin:20px 0"><a href="${escapeHtml(resetUrl)}" style="background:#0070b9;color:white;padding:12px 22px;text-decoration:none;border-radius:8px;display:inline-block;font-weight:700;font-family:Nunito,Arial,sans-serif">Set a new password</a></p>` +
        `<p style="color:#64748b;font-size:13px;line-height:1.6">This link can be used only once and expires in 60 minutes.</p>` +
        `<p style="color:#64748b;font-size:13px;line-height:1.6">If you didn't request this, you can safely ignore this email — no changes will be made.</p>` +
        `<p style="color:#94a3b8;font-size:11px;word-break:break-all;margin-top:24px;border-top:1px solid #e2e8f0;padding-top:14px">${escapeHtml(resetUrl)}</p>` +
        `</td></tr></table></body></html>`,
    });
    await setSiteSetting("last_email_error", "");
    return true;
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("sendPasswordResetEmail", e);
    await setSiteSetting("last_email_error", msg);
    return false;
  }
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
