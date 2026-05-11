import { setSiteSetting } from "@/lib/site-settings";

export type SheetInquiryPayload = {
  name: string;
  email: string;
  company: string;
  phone: string;
  role: string;
  message: string;
  submittedAt: string;
  visitorId?: string | null;
  sessionId?: string | null;
  utmSource?: string | null;
  utmMedium?: string | null;
  utmCampaign?: string | null;
  referrer?: string | null;
  leadId?: string | null;
};

export type SheetAppendResult =
  | { ok: true; skipped?: false }
  | { ok: true; skipped: true; reason: string }
  | { ok: false; error: string };

const FETCH_TIMEOUT_MS = 8000;

/**
 * POSTs an interest-form submission to the Google Apps Script Web App configured
 * via GOOGLE_APPS_SCRIPT_URL. The Apps Script side is expected to verify the
 * `secret` field against GOOGLE_APPS_SCRIPT_SECRET and append a row to a Sheet.
 *
 * Failures are logged + recorded in `site_settings.last_sheet_error` so the rest
 * of the submission flow (DB insert + email) continues to work even if the
 * Sheet sink is misconfigured or temporarily unreachable.
 */
export async function appendInquiryToSheet(
  payload: SheetInquiryPayload
): Promise<SheetAppendResult> {
  const url = process.env.GOOGLE_APPS_SCRIPT_URL?.trim();
  const secret = process.env.GOOGLE_APPS_SCRIPT_SECRET?.trim() ?? "";

  if (!url) {
    return { ok: true, skipped: true, reason: "GOOGLE_APPS_SCRIPT_URL not set" };
  }

  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), FETCH_TIMEOUT_MS);

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ secret, ...payload }),
      signal: ac.signal,
      redirect: "follow",
    });

    const bodyText = await res.text();

    const looksLikeHtml = bodyText.trim().toLowerCase().startsWith("<");
    if (!res.ok || looksLikeHtml) {
      const snippet = bodyText.slice(0, 200).replace(/\s+/g, " ").trim();
      const msg = `Sheet append failed (${res.status}): ${snippet || "no body"}`;
      console.error("[sheets]", msg);
      await setSiteSetting("last_sheet_error", msg);
      return { ok: false, error: msg };
    }

    await setSiteSetting("last_sheet_error", "");
    return { ok: true };
  } catch (err) {
    const isAbort = err instanceof DOMException && err.name === "AbortError";
    const msg = isAbort
      ? `Sheet append timed out after ${FETCH_TIMEOUT_MS}ms`
      : `Sheet append threw: ${err instanceof Error ? err.message : String(err)}`;
    console.error("[sheets]", msg);
    await setSiteSetting("last_sheet_error", msg);
    return { ok: false, error: msg };
  } finally {
    clearTimeout(timer);
  }
}
