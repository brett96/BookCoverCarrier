import { execSync } from "node:child_process";

const url = process.env.DATABASE_URL ?? process.env.POSTGRES_URL;
if (!url) {
  console.log(
    "[postbuild] Skipping drizzle push and seed: no DATABASE_URL or POSTGRES_URL"
  );
  process.exit(0);
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
