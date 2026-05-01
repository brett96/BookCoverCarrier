/** Postgres URL from Vercel / Neon / local env (first match wins). */
export function getResolvedDatabaseUrl(): string {
  const candidates = [
    process.env.DATABASE_URL,
    process.env.POSTGRES_URL,
    process.env.POSTGRES_PRISMA_URL,
    process.env.DATABASE_URL_UNPOOLED,
  ];
  const found = candidates.find((s) => typeof s === "string" && s.trim().length > 0);
  return found?.trim() ?? "";
}
