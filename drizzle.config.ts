import { defineConfig } from "drizzle-kit";
import { getResolvedDatabaseUrl } from "./lib/db/url";

const url =
  getResolvedDatabaseUrl() || "postgresql://localhost:5432/bookcover";

export default defineConfig({
  schema: "./lib/db/schema.ts",
  out: "./lib/db/migrations",
  dialect: "postgresql",
  dbCredentials: { url },
});
