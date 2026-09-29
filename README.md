# Clutch Gear

A full-stack e-commerce store for a made-up gaming gear brand — a portfolio project.

> **Demo only.** Clutch Gear isn't a real brand and nothing is for sale. Checkout will use Stripe test mode.

**Work in progress.** See [PLAN.md](PLAN.md) for the build order and design decisions.

## Stack

Next.js 16 (App Router, Cache Components) · TypeScript · Tailwind CSS · PostgreSQL on Neon · Prisma 7 · Stripe Checkout · Better Auth · Vitest · GitHub Actions

## Running locally

```bash
npm install
```

Create `.env.local`:

```
DATABASE_URL="postgresql://..."          # Neon direct connection, used for migrations
DATABASE_URL_POOLED="postgresql://..."   # Neon pooled connection, used by the app
STRIPE_SECRET_KEY="sk_test_..."          # Stripe test mode only — live keys are refused
STRIPE_WEBHOOK_SECRET="whsec_..."        # optional locally; required in production
BETTER_AUTH_SECRET="..."                 # any long random string, e.g. `openssl rand -base64 32`
BETTER_AUTH_URL="http://localhost:3000"
GITHUB_CLIENT_ID="..."                   # from a GitHub OAuth app with callback
GITHUB_CLIENT_SECRET="..."               # http://localhost:3000/api/auth/callback/github
```

Locally, orders are confirmed by the checkout return page, so the webhook secret is optional. To test the
webhook itself, use the [Stripe CLI](https://docs.stripe.com/stripe-cli): `stripe listen --forward-to localhost:3000/api/stripe/webhook`.
Pay with Stripe's test card `4242 4242 4242 4242`, any future expiry and any CVC.

Then create the tables, add the products and start the dev server:

```bash
npm run db:migrate
npm run db:seed
npm run dev
```

## Admin

Sign in once, then make yourself an admin from a terminal (the site deliberately can't change roles):

```bash
npm run set-role -- you@example.com admin
```

The **Admin** link then appears in the header: an overview, product management (create, edit, delete)
and all orders. Everyone else gets a 404 for `/admin`.

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
| `npm run set-role -- <email> <customer|admin>` | Change a user's role |
