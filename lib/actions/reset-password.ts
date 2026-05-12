"use server";

import { createHash } from "node:crypto";
import bcrypt from "bcryptjs";
import { and, eq, gt, isNull } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { passwordResetTokens, users } from "@/lib/db/schema";

export type ResetPasswordResult =
  | { ok: true }
  | { ok: false; message: string };

const MIN_PASSWORD_LENGTH = 10;
const MAX_PASSWORD_LENGTH = 256;
const INVALID_LINK_MESSAGE =
  "This reset link is invalid, has already been used, or has expired.";

/**
 * Consumes a password-reset token. Atomic on the token row: the UPDATE that
 * marks `used_at` only matches if the token is still unused and unexpired, so
 * two simultaneous requests with the same token can't both succeed.
 */
export async function resetPassword(
  token: string,
  newPassword: string
): Promise<ResetPasswordResult> {
  if (!token || typeof token !== "string") {
    return { ok: false, message: INVALID_LINK_MESSAGE };
  }
  if (typeof newPassword !== "string") {
    return { ok: false, message: "Please enter a password." };
  }
  if (newPassword.length < MIN_PASSWORD_LENGTH) {
    return {
      ok: false,
      message: `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`,
    };
  }
  if (newPassword.length > MAX_PASSWORD_LENGTH) {
    return { ok: false, message: "Password is too long." };
  }

  const db = getDb();
  if (!db) {
    return { ok: false, message: "Database is not configured." };
  }

  const tokenHash = createHash("sha256").update(token).digest("hex");
  const now = new Date();

  const [tokenRow] = await db
    .select({
      id: passwordResetTokens.id,
      userId: passwordResetTokens.userId,
    })
    .from(passwordResetTokens)
    .where(
      and(
        eq(passwordResetTokens.tokenHash, tokenHash),
        isNull(passwordResetTokens.usedAt),
        gt(passwordResetTokens.expiresAt, now)
      )
    )
    .limit(1);

  if (!tokenRow) {
    return { ok: false, message: INVALID_LINK_MESSAGE };
  }

  // Atomically mark this token as used. If another concurrent caller beat
  // us to it, the UPDATE will affect zero rows and we abort without touching
  // the user's password.
  const consumed = await db
    .update(passwordResetTokens)
    .set({ usedAt: now })
    .where(
      and(
        eq(passwordResetTokens.id, tokenRow.id),
        isNull(passwordResetTokens.usedAt),
        gt(passwordResetTokens.expiresAt, now)
      )
    )
    .returning({ id: passwordResetTokens.id });

  if (consumed.length === 0) {
    return { ok: false, message: INVALID_LINK_MESSAGE };
  }

  const passwordHash = await bcrypt.hash(newPassword, 12);
  await db
    .update(users)
    .set({ passwordHash })
    .where(eq(users.id, tokenRow.userId));

  return { ok: true };
}
