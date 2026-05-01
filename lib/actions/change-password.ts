"use server";

import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import { getDb } from "@/lib/db/client";
import { users } from "@/lib/db/schema";

export async function changePassword(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) return { ok: false as const, message: "Unauthorized" };

  const current = formData.get("currentPassword")?.toString() ?? "";
  const next = formData.get("newPassword")?.toString() ?? "";
  if (next.length < 10) {
    return { ok: false as const, message: "Password must be at least 10 characters." };
  }

  const db = getDb();
  if (!db) return { ok: false as const, message: "No database" };

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1);
  if (!user) return { ok: false as const, message: "User not found" };

  const ok = await bcrypt.compare(current, user.passwordHash);
  if (!ok) return { ok: false as const, message: "Current password is incorrect." };

  const hash = await bcrypt.hash(next, 12);
  await db
    .update(users)
    .set({ passwordHash: hash })
    .where(eq(users.id, user.id));

  return { ok: true as const };
}
