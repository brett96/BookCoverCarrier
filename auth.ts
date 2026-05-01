import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { authConfig } from "@/auth.config";
import { getDb } from "@/lib/db/client";
import { users } from "@/lib/db/schema";

/** Required in production; Auth.js returns 500 on /api/auth/session if missing. */
const authSecret =
  process.env.AUTH_SECRET?.trim() ||
  process.env.NEXTAUTH_SECRET?.trim();

if (process.env.VERCEL && !authSecret) {
  console.error(
    "[auth] Missing AUTH_SECRET (or NEXTAUTH_SECRET). Add it in Vercel → Settings → Environment Variables for Production and Preview (and Development if used), then redeploy."
  );
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  ...(authSecret ? { secret: authSecret } : {}),
  trustHost: true,
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email?.toString().trim().toLowerCase();
        const password = credentials?.password?.toString() ?? "";
        if (!email || !password) return null;
        const db = getDb();
        if (!db) return null;
        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.email, email))
          .limit(1);
        if (!user?.passwordHash) return null;
        const ok = await bcrypt.compare(password, user.passwordHash);
        if (!ok) return null;
        return {
          id: user.id,
          email: user.email,
          name: user.name ?? undefined,
        };
      },
    }),
  ],
});
