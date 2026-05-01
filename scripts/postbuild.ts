import { execSync } from "node:child_process";
import { getResolvedDatabaseUrl } from "../lib/db/url";

const url = getResolvedDatabaseUrl();
if (!url) {
  console.log(
    "[postbuild] Skipping drizzle push and seed: no database URL in env " +
      "(set DATABASE_URL or POSTGRES_URL from Vercel Postgres / Neon, then redeploy)"
  );
  process.exit(0);
}

// drizzle-kit and some tools expect DATABASE_URL
if (!process.env.DATABASE_URL?.trim()) {
  process.env.DATABASE_URL = url;
}

console.log("[postbuild] drizzle-kit push");
execSync("npx drizzle-kit push --force", {
  stdio: "inherit",
  env: process.env,
});

console.log("[postbuild] seed admin (idempotent)");
execSync("npx tsx scripts/seed-admin.ts", {
  stdio: "inherit",
  env: process.env,
});
