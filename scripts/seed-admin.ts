import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { getDb } from "../lib/db/client";
import { users } from "../lib/db/schema";

async function main() {
  const email = process.env.ADMIN_SEED_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_SEED_PASSWORD;
  if (!email || !password) {
    console.log(
      "[seed-admin] Skipping: set ADMIN_SEED_EMAIL and ADMIN_SEED_PASSWORD"
    );
    return;
  }

  const db = getDb();
  if (!db) {
    console.error("[seed-admin] No database connection");
    process.exit(1);
  }

  const [existing] = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);
  if (existing) {
    console.log("[seed-admin] Admin already exists:", email);
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);
  await db.insert(users).values({
    email,
    passwordHash,
    name: "Admin",
    role: "admin",
  });
  console.log("[seed-admin] Created admin:", email);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
