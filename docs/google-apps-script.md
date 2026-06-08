# Google Apps Script: BookCover interest list → Sheet

This is the server-side counterpart to the `/api/bookcover-inquiry` Sheet sink.
It runs **inside Google** (not in this repo) and is the target of
`GOOGLE_APPS_SCRIPT_URL`. Deploy it once per environment (production, staging)
that you want a separate Sheet for.

## 1. Create the Sheet

1. Go to <https://sheets.new> and rename it (e.g. `BookCover – Interest List`).
2. Add the following header row in row 1, columns A–N (the order matters because
   the script appends positionally):

   | A | B | C | D | E | F | G | H | I | J | K | L | M | N |
   |---|---|---|---|---|---|---|---|---|---|---|---|---|---|
   | Submitted At (UTC) | Name | Email | Company | Phone | Role | Message | Lead ID | Visitor ID | Session ID | UTM Source | UTM Medium | UTM Campaign | Referrer |

3. Optional: freeze row 1 (View → Freeze → 1 row) and resize columns to taste.

## 2. Add the Apps Script

1. In the Sheet, **Extensions → Apps Script**.
2. Replace the default `Code.gs` contents with the script below.
3. Save (Ctrl/Cmd + S). When prompted, name the script project (e.g.
   `BookCover Interest`).

```javascript
/**
 * BookCover interest-form webhook.
 * Receives JSON from app/api/bookcover-inquiry/route.ts (lib/sheets/append-inquiry.ts).
 * Verifies a shared secret, then appends a row to the bound Sheet.
 *
 * Set the secret via Project Settings -> Script Properties:
 *   key:   GOOGLE_APPS_SCRIPT_SECRET
 *   value: <the same string set on Vercel>
 */

const SHEET_NAME = "Sheet1"; // rename if your tab isn't Sheet1

function doPost(e) {
  try {
    const raw = (e && e.postData && e.postData.contents) || "{}";
    const body = JSON.parse(raw);

    const expectedSecret = PropertiesService.getScriptProperties().getProperty(
      "GOOGLE_APPS_SCRIPT_SECRET"
    );
    if (expectedSecret && body.secret !== expectedSecret) {
      return jsonResponse({ ok: false, error: "Invalid secret" }, 401);
    }

    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
    if (!sheet) {
      return jsonResponse(
        { ok: false, error: "Sheet '" + SHEET_NAME + "' not found" },
        500
      );
    }

    sheet.appendRow([
      body.submittedAt || new Date().toISOString(),
      body.name || "",
      body.email || "",
      body.company || "",
      body.phone || "",
      body.role || "",
      body.message || "",
      body.leadId || "",
      body.visitorId || "",
      body.sessionId || "",
      body.utmSource || "",
      body.utmMedium || "",
      body.utmCampaign || "",
      body.referrer || "",
    ]);

    return jsonResponse({ ok: true });
  } catch (err) {
    return jsonResponse({ ok: false, error: String(err) }, 500);
  }
}

function jsonResponse(payload, status) {
  // Apps Script doesn't let us set HTTP status codes on doPost, but returning
  // JSON keeps the Vercel side from treating the response as HTML and lets us
  // surface errors in the function logs.
  return ContentService.createTextOutput(JSON.stringify(payload)).setMimeType(
    ContentService.MimeType.JSON
  );
}
```

## 3. Set the shared secret

1. In the Apps Script editor, gear icon (**Project Settings**) →
   **Script Properties** → **Add script property**.
2. Property: `GOOGLE_APPS_SCRIPT_SECRET`
3. Value: any random string (e.g. `openssl rand -hex 32`). Keep this value —
   you'll set it in Vercel too.
4. Save.

## 4. Deploy as a Web App

1. **Deploy → New deployment → Web app**.
2. Description: `BookCover interest webhook v1`.
3. Execute as: **Me** (your Google account).
4. Who has access: **Anyone** (it's protected by the shared secret).
5. Click **Deploy**. Authorize when prompted (Google will warn that the script
   isn't reviewed — choose Advanced → "Go to project (unsafe)" → Allow, since
   you authored it).
6. Copy the **Web app URL** — it looks like
   `https://script.google.com/macros/s/AKfycbx.../exec`.

## 5. Set the Vercel env vars

Vercel → Project → **Settings → Environment Variables**. Add to **Production**
(and Preview / Development if you want them to write to the same — or different
— Sheet):

| Variable | Value |
|---|---|
| `GOOGLE_APPS_SCRIPT_URL` | The `/exec` URL from step 4 |
| `GOOGLE_APPS_SCRIPT_SECRET` | The same random string you put in Script Properties |

Redeploy. The next form submission will append a row to the Sheet within a
second or two.

## 6. Updating the script later

If you change the script, you must **Manage deployments → ⋮ → Edit → New
version → Deploy** to push the change live. Just hitting Save in the editor is
not enough — the previous deployed version keeps serving traffic until you
publish a new one.

## Troubleshooting

- **`401 Invalid secret`** — the value in Vercel doesn't match the Script
  Property. Re-copy and redeploy on Vercel.
- **`Sheet 'Sheet1' not found`** — your tab is renamed; update `SHEET_NAME`
  in the script and redeploy a new version.
- **`Sheet append failed (200): <html...`** in the function log — Apps Script
  served an HTML login page instead of running the script. The deployment is
  set to "Execute as: User accessing" instead of "Execute as: Me", or "Who has
  access" isn't "Anyone". Re-deploy with the correct settings.
- **`Sheet append timed out after 8000ms`** — Apps Script cold starts can be
  slow; the timeout is intentional so the form stays responsive. The DB insert
  + email already succeeded by this point, so the user gets a success modal.
  The timeout is recorded in `site_settings.last_sheet_error` and visible in
  the admin Settings page.
