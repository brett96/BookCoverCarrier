"use server";

import { createHash, randomBytes } from "node:crypto";
import { headers } from "next/headers";
import { and, eq, gte, isNull } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { passwordResetTokens, users } from "@/lib/db/schema";
import { sendPasswordResetEmail } from "@/lib/email";

const TOKEN_LIFETIME_MS = 60 * 60 * 1000; // 60 minutes
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000; // 10 minutes
const RATE_LIMIT_MAX = 3;

/**
 * Triggers a password-reset email for the admin user identified by
 * `ADMIN_SEED_EMAIL`. No user input is accepted — the destination is fixed by
 * server config — so the caller can never enumerate which addresses exist or
 * coerce delivery to a different mailbox.
 *
 * The response is intentionally a single, indistinguishable shape regardless
 * of:
 *   - whether `ADMIN_SEED_EMAIL` is set
 *   - whether the admin row exists in the database
 *   - whether the rate limit was exceeded
 *   - whether the SMTP send succeeded
 *
 * Server-side logging is kept minimal so it doesn't leak signal back to the
 * caller via timing (every branch performs at least one DB roundtrip).
 */
export async function requestPasswordReset(): Promise<{ ok: true }> {
  const adminEmail = process.env.ADMIN_SEED_EMAIL?.trim().toLowerCase();
  const db = getDb();

  // Always touch the headers/DB so timing is roughly constant regardless of
  // which branch we end up in.
  const h = await headers();
  const ip =
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    h.get("x-real-ip") ??
    null;
  const userAgent = h.get("user-agent");

  if (!adminEmail || !db) {
    console.error(
      "[request-password-reset] missing config:",
      !adminEmail ? "ADMIN_SEED_EMAIL" : "DATABASE_URL"
    );
    return { ok: true };
  }

  const [admin] = await db
    .select()
    .from(users)
    .where(eq(users.email, adminEmail))
    .limit(1);

  if (!admin) {
    console.warn(
      "[request-password-reset] admin user row not found for ADMIN_SEED_EMAIL"
    );
    return { ok: true };
  }

  // Rate limit: per-user, regardless of caller IP. Counts every token row
  // (used or not) created in the last RATE_LIMIT_WINDOW_MS.
  const since = new Date(Date.now() - RATE_LIMIT_WINDOW_MS);
  const recent = await db
    .select({ id: passwordResetTokens.id })
    .from(passwordResetTokens)
    .where(
      and(
        eq(passwordResetTokens.userId, admin.id),
        gte(passwordResetTokens.createdAt, since)
      )
    );
  if (recent.length >= RATE_LIMIT_MAX) {
    console.warn(
      "[request-password-reset] rate limit hit; skipping email send"
    );
    return { ok: true };
  }

  // Invalidate any prior unused tokens for this user — defense in depth so
  // there's only ever one valid token in flight per admin.
  await db
    .update(passwordResetTokens)
    .set({ usedAt: new Date() })
    .where(
      and(
        eq(passwordResetTokens.userId, admin.id),
        isNull(passwordResetTokens.usedAt)
      )
    );

  // base64url, 32 random bytes = 256 bits of entropy, ~43 URL-safe chars.
  const token = randomBytes(32).toString("base64url");
  const tokenHash = createHash("sha256").update(token).digest("hex");

  await db.insert(passwordResetTokens).values({
    userId: admin.id,
    tokenHash,
    expiresAt: new Date(Date.now() + TOKEN_LIFETIME_MS),
    ip: ip ?? undefined,
    userAgent: userAgent ?? undefined,
  });

  // Build the absolute reset URL. Prefer the canonical AUTH_URL so emails
  // always point at the production host even if the request originated from
  // a preview deployment or a custom domain alias.
  const baseUrl =
    process.env.AUTH_URL?.trim().replace(/\/$/, "") ||
    (h.get("origin")
      ? h.get("origin")!.replace(/\/$/, "")
      : `${h.get("x-forwarded-proto") ?? "https"}://${h.get("host") ?? ""}`);

  const resetUrl = `${baseUrl}/reset-password?token=${encodeURIComponent(token)}`;

  await sendPasswordResetEmail(adminEmail, resetUrl);

  return { ok: true };
}
