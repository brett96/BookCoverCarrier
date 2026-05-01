import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { siteSettings } from "@/lib/db/schema";

export async function setSiteSetting(key: string, value: string) {
  const db = getDb();
  if (!db) return;
  const [existing] = await db
    .select()
    .from(siteSettings)
    .where(eq(siteSettings.key, key))
    .limit(1);
  if (existing) {
    await db
      .update(siteSettings)
      .set({ value, updatedAt: new Date() })
      .where(eq(siteSettings.key, key));
  } else {
    await db.insert(siteSettings).values({ key, value, updatedAt: new Date() });
  }
}

export async function getSiteSetting(key: string): Promise<string | null> {
  const db = getDb();
  if (!db) return null;
  const [row] = await db
    .select()
    .from(siteSettings)
    .where(eq(siteSettings.key, key))
    .limit(1);
  return row?.value ?? null;
}
