# Clutch Gear

A full-stack e-commerce store for a made-up gaming gear brand — a portfolio project.

> **Demo only.** Clutch Gear isn't a real brand and nothing is for sale. Checkout will use Stripe test mode.

**Work in progress.** See [PLAN.md](PLAN.md) for the build order and design decisions.

## Stack

Next.js 16 (App Router, Cache Components) · TypeScript · Tailwind CSS · PostgreSQL on Neon · Prisma 7 · Vitest · GitHub Actions

## Running locally

```bash
npm install
```

Create `.env.local` with your Neon connection strings:

```
DATABASE_URL="postgresql://..."          # direct connection, used for migrations
DATABASE_URL_POOLED="postgresql://..."   # pooled connection, used by the app
```

Then create the tables, add the products and start the dev server:

```bash
npm run db:migrate
npm run db:seed
npm run dev
```

## Scripts

| Script | What it does |
|---|---|
| `npm run dev` | Dev server on http://localhost:3000 |
| `npm test` | Unit and component tests (Vitest) |
| `npm run lint` / `npm run typecheck` | ESLint / TypeScript |
| `npm run db:migrate` | Apply database migrations |
| `npm run db:seed` | Add or update the 25 demo products (safe to re-run) |
| `npm run db:studio` | Browse the database |
| `npm run art` | Regenerate the SVG product illustrations |
