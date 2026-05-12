/**
 * One-time / idempotent backfill: percent-decode any city or region values in
 * the `events` table that were written before the track route started
 * decoding them. Safe to run on every deploy — it only touches rows whose
 * value still contains a "%".
 *
 * Invoked from scripts/postbuild.ts after `drizzle-kit push` succeeds.
 */
import { getDb } from "../lib/db/client";
import { sql } from "drizzle-orm";

function safeDecode(value: string | null): string | null {
  if (!value) return value;
  if (!value.includes("%")) return value;
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

async function main() {
  const db = getDb();
  if (!db) {
    console.log("[backfill-geo] Skipping: no database URL in env");
    return;
  }

  const rows = await db.execute<{
    id: string;
    city: string | null;
    region: string | null;
  }>(
    sql`SELECT id, city, region FROM events WHERE city LIKE '%\\%%' OR region LIKE '%\\%%'`
  );

  const list = Array.isArray(rows) ? rows : (rows.rows ?? []);

  if (list.length === 0) {
    console.log("[backfill-geo] No URL-encoded city/region rows to fix");
    return;
  }

  let touched = 0;
  for (const row of list) {
    const city = safeDecode(row.city);
    const region = safeDecode(row.region);
    if (city === row.city && region === row.region) continue;
    await db.execute(
      sql`UPDATE events SET city = ${city}, region = ${region} WHERE id = ${row.id}::uuid`
    );
    touched += 1;
  }

  console.log(`[backfill-geo] Updated ${touched} row(s)`);
}

main().catch((err) => {
  console.error("[backfill-geo]", err);
  process.exit(1);
});
