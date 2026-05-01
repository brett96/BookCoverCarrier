# BookCover Carrier — marketing site + admin

Production Next.js 15 (App Router) app: marketing pages, contact lead capture (Postgres + Drizzle), Gmail SMTP notifications, custom event analytics, and a password-protected admin dashboard.

## Prerequisites

- Node.js 20+
- A [Neon](https://neon.tech) or Vercel Postgres database (`DATABASE_URL`)

## Local development

1. Copy `.env.example` to `.env.local` and fill in values (at minimum `DATABASE_URL`, `AUTH_SECRET`, `AUTH_URL=http://localhost:3000`, and `ADMIN_SEED_*` for first admin).

2. Apply the schema and seed the admin user:

   ```bash
   npm run db:push
   npm run seed:admin
   ```

3. Run the dev server:

   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) for marketing, [http://localhost:3000/login](http://localhost:3000/login) for admin sign-in, and [http://localhost:3000/admin](http://localhost:3000/admin) after authentication.

## Deploy on Vercel

**If the build log says `Skipping drizzle push and seed` and Vercel says no environment variables are set, the deployment did not fail on Next.js — but the database was never migrated and no admin user was created.** Add variables below (Production at minimum), save, then **Redeploy**.

1. Push this repo to GitHub and import it in the Vercel dashboard.
2. In the project **Settings → Environment Variables**, add (for **Production** and any preview envs that should use a real DB):
   - **Database**: Create **Storage → Postgres** (Neon) on the project, or paste a Neon connection string. Vercel usually injects `POSTGRES_URL` (and sometimes `DATABASE_URL`). The app resolves either — see `lib/db/url.ts`.
   - **Auth**: `AUTH_SECRET` (`openssl rand -base64 32`), `AUTH_URL` = your production URL (e.g. `https://your-project.vercel.app`).
   - **Gmail** (optional until contact form email is needed): `GMAIL_USER`, `GMAIL_APP_PASSWORD`, `LEAD_NOTIFICATION_EMAIL`.
   - **First admin** (for `postbuild` seed): `ADMIN_SEED_EMAIL`, `ADMIN_SEED_PASSWORD` (change after first login).
3. Deploy again. After `next build`, `postbuild` runs `drizzle-kit push --force` and `scripts/seed-admin.ts` when any supported database URL env is present.
4. If you use Preview deployments without a database, either omit the DB URL for Preview or use a separate Neon branch and scoped env vars — otherwise postbuild will try to push against whatever URL you set.

## Scripts

| Command        | Description                                      |
| -------------- | ------------------------------------------------ |
| `npm run dev`  | Next.js dev server (Turbopack)                   |
| `npm run build`| Production build (+ postbuild DB steps if URL set) |
| `npm run db:push` | Push Drizzle schema to Postgres               |
| `npm run seed:admin` | Create admin user if missing (uses env)   |

## Stack

Next.js 15, React 19, TypeScript, Tailwind v4 + shadcn-style UI (admin), Drizzle + `@neondatabase/serverless`, Auth.js v5 (credentials + JWT), Nodemailer (Gmail 465), Recharts, `@vercel/analytics` + `@vercel/speed-insights`, custom `events` table + `/api/track`.
