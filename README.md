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

1. Push this repo to GitHub and import it in the Vercel dashboard.
2. Add **Vercel Postgres** (or connect Neon); ensure `DATABASE_URL` (or `POSTGRES_URL`) is set.
3. Set environment variables from `.env.example` (`AUTH_SECRET` from `openssl rand -base64 32`, production `AUTH_URL` to your canonical site URL, Gmail + lead notification email, admin seed credentials for the first deploy).
4. Deploy. The `postbuild` script runs `drizzle-kit push --force` and the idempotent `seed:admin` script when `DATABASE_URL` or `POSTGRES_URL` is present (skipped for preview builds without a database if you omit the variable).

## Scripts

| Command        | Description                                      |
| -------------- | ------------------------------------------------ |
| `npm run dev`  | Next.js dev server (Turbopack)                   |
| `npm run build`| Production build (+ postbuild DB steps if URL set) |
| `npm run db:push` | Push Drizzle schema to Postgres               |
| `npm run seed:admin` | Create admin user if missing (uses env)   |

## Stack

Next.js 15, React 19, TypeScript, Tailwind v4 + shadcn-style UI (admin), Drizzle + `@neondatabase/serverless`, Auth.js v5 (credentials + JWT), Nodemailer (Gmail 465), Recharts, `@vercel/analytics` + `@vercel/speed-insights`, custom `events` table + `/api/track`.
