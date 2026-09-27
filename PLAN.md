# Clutch Gear — Project Plan

## Goal
Portfolio project: a full-stack e-commerce store for a made-up gaming gear brand.
Shows the skills the CS2 Skin Browser doesn't: TypeScript, an own database and backend,
user accounts, payments, an admin area, and automated checks on every push.

## Stack
- Next.js 16 (App Router) + TypeScript
- Tailwind CSS
- PostgreSQL (hosted on Neon, free tier) + Prisma
- Auth.js — sign in with GitHub
- Stripe Checkout in test mode (test card numbers, no real money)
- Vitest + React Testing Library, GitHub Actions to run lint/tests/build on every push
- Vercel for hosting

## Data Model
- **User** — from Auth.js; `role` = customer | admin
- **Product** — slug, name, tagline, description, category, price (pence), stock, image, featured, specs (JSON)
- **Category** — enum: mice, keyboards, headsets, mousepads, accessories
- **Order** — user, status (pending → paid), total (cents), Stripe checkout session id
- **OrderItem** — product, quantity, and a copy of the name and price at time of purchase
  (so old orders don't change if a product is edited later)

## Key Decisions
- Prices are in GBP, stored in pence (integers), never floats
- The cart lives in the browser (localStorage), but checkout re-reads every price from the
  database on the server — the browser is never trusted with prices
- Orders are only marked paid by Stripe's webhook, not by the "thanks" page the buyer lands on
- Made-up brand and products only — no real brand names or product photos

## Build Order
1. ✅ Project scaffold (Next.js + TypeScript + Tailwind)
2. ✅ Database: Prisma schema, Neon connection, seed script with 25 products
3. Catalogue: home page, product list with category filter/search/sort, product pages
4. Cart: add/remove/change quantity, persisted in localStorage, cart page
5. Checkout: Stripe Checkout session, webhook creates the paid order, success page
6. Accounts: sign in with GitHub, order history page
7. Admin: product create/edit/delete, orders list (admin role only)
8. Tests + GitHub Actions (lint, tests, build) — added alongside each step, finished here
9. Deploy to Vercel, README with screenshots

## Stretch Goals (after it's finished)
- Product reviews and ratings
- Stock checks at checkout
- Product image uploads in admin
- Order confirmation emails

## Accounts Needed (created by you, not Claude)
- GitHub repo `clutch-gear` — before the first push
- Neon — before step 2
- Stripe (test mode only) — before step 5
- GitHub OAuth app — before step 6
- Vercel — already have one

## Key Notes
- Next.js 16 has breaking changes vs older versions: check `node_modules/next/dist/docs/`
  rather than relying on memory
- Prisma 7: config in `prisma.config.ts` (loads `.env.local` itself), client generated into
  `src/generated/prisma` (gitignored, rebuilt by `postinstall`). Migrations use `DATABASE_URL` (direct),
  the app uses `DATABASE_URL_POOLED` via `src/lib/db.ts`
- `npm run db:migrate` / `db:seed` / `db:studio`; the seed upserts by slug so it can be re-run
- Secrets go in `.env.local` (gitignored) locally and in Vercel's environment variables when deployed
