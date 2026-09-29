# Clutch Gear — Project Plan

## Goal
Portfolio project: a full-stack e-commerce store for a made-up gaming gear brand.
Shows the skills the CS2 Skin Browser doesn't: TypeScript, an own database and backend,
user accounts, payments, an admin area, and automated checks on every push.

## Stack
- Next.js 16 (App Router) + TypeScript
- Tailwind CSS
- PostgreSQL (hosted on Neon, free tier) + Prisma
- Better Auth — sign in with GitHub (switched from Auth.js in step 6: Auth.js is now part of Better Auth,
  which its README recommends for new projects; Auth.js v5 was still in beta)
- Stripe Checkout in test mode (test card numbers, no real money)
- Vitest + React Testing Library, GitHub Actions to run lint/tests/build on every push
- Vercel for hosting

## Data Model
- **User**, **Session**, **Account**, **Verification** — Better Auth's core tables; User has `role` = customer | admin
- **Product** — slug, name, tagline, description, category, price (pence), stock, image, featured, specs (JSON)
- **Category** — enum: mice, keyboards, headsets, mousepads, accessories
- **Order** — status (PENDING → PAID, or EXPIRED), totals (pence), Stripe session id, email, shipping name/address, optional user (guest checkout still works)
- **OrderItem** — product, quantity, and a copy of the name and price at time of purchase
  (so old orders don't change if a product is edited later)

## Key Decisions
- Prices are in GBP, stored in pence (integers), never floats
- The cart lives in an httpOnly cookie holding only slugs and quantities (changed from localStorage in
  step 4): the server can read it, so the cart page shows live prices/stock, the buttons work without
  JavaScript, and checkout can build the order server-side. Prices always come from the database
- Server Actions are public endpoints: every action validates its input and reads stock fresh from the DB
- UK delivery £4.99, free over £50
- Checkout flow: the Server Action re-prices the cart from the DB, saves a PENDING order (with copies of
  names/prices), then redirects to Stripe. The webhook (signature-verified) and the return page (which
  re-fetches the session from Stripe) both call one idempotent fulfil function: it checks the session id,
  amount and currency match the order, then marks it PAID and decrements stock in one transaction
  (never below 0). Stripe may retry webhooks, so fulfilling twice is a no-op
- The Stripe client refuses to start with a live key — this demo can never take real money
- Admin: every admin page and every admin Server Action checks the role itself (src/lib/admin.ts) —
  no layout-only check, since layouts don't re-run on navigation or protect actions. Non-admins get
  the normal 404, so the admin area doesn't reveal it exists. Admins are made with `npm run set-role`
  (the site has no way to change roles). Saves call updateTag("products") so the shop updates at once.
  Deleting a product is safe: orders keep their own copy of names and prices
- Accounts: guest checkout stays; signed-in checkouts are linked to the user (email pre-filled on Stripe).
  Orders placed while signed in are only viewable by that user; guest orders by their unguessable id.
  `role` has input: false in Better Auth, so users can never make themselves admin. Sign-in/out are
  Server Actions (nextCookies plugin); "return to" paths are restricted to this site (no open redirects)
- Unknown order ids render the not-found page but with status 200 (the page is already streaming by then);
  harmless for a private, noindex page
- Orders are only marked paid by Stripe's webhook, not by the "thanks" page the buyer lands on
- Made-up brand and products only — no real brand names or product photos. Product images are SVG
  illustrations drawn by `scripts/generate-product-art.ts` (`npm run art`)
- Next.js Cache Components: product reads use 'use cache' + cacheTag("products"), so admin edits
  can refresh them with revalidateTag("products"). The catalogue reads searchParams inside <Suspense>
- Search and sort use a plain GET form (next/form), so they work without JavaScript

## Build Order
1. ✅ Project scaffold (Next.js + TypeScript + Tailwind)
2. ✅ Database: Prisma schema, Neon connection, seed script with 25 products
3. ✅ Catalogue: home page, product list with category filter/search/sort, product pages
4. ✅ Cart: add/remove/change quantity, stored in a cookie, cart page with delivery and stock checks
5. ✅ Checkout: Stripe Checkout (hosted page), signed webhook marks orders paid and takes stock, order page
6. ✅ Accounts: sign in with GitHub (Better Auth), account page with order history, private orders
7. ✅ Admin: overview stats, product create/edit/delete with validation, orders list with status filter (admin role only)
8. Tests + GitHub Actions — started in step 3 (CI runs lint, typecheck, tests); added alongside each step
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
- GitHub OAuth apps (local + production) — before step 6
- Vercel — already have one

## Key Notes
- Next.js 16 has breaking changes vs older versions: check `node_modules/next/dist/docs/`
  rather than relying on memory
- Prisma 7: config in `prisma.config.ts` (loads `.env.local` itself), client generated into
  `src/generated/prisma` (gitignored, rebuilt by `postinstall`). Migrations use `DATABASE_URL` (direct),
  the app uses `DATABASE_URL_POOLED` via `src/lib/db.ts`
- `npm run db:migrate` / `db:seed` / `db:studio`; the seed upserts by slug so it can be re-run
- Migrations are applied by hand with `npm run db:migrate` (local and production share one Neon DB for now);
  a separate production branch in Neon would be worth adding before real traffic
- Env vars: DATABASE_URL, DATABASE_URL_POOLED, STRIPE_SECRET_KEY (sk_test_ only), STRIPE_WEBHOOK_SECRET
  (from the Stripe webhook endpoint), BETTER_AUTH_SECRET (random, different per environment),
  BETTER_AUTH_URL (site URL), GITHUB_CLIENT_ID / GITHUB_CLIENT_SECRET (one GitHub OAuth app per
  environment — OAuth apps allow a single callback URL), optional SITE_URL (defaults to the request's origin)
- CI doesn't run `next build`: it prerenders from the database, so the build runs on Vercel (which has the secrets)
- Testing in the in-app browser: when the pane is hidden, animation frames pause, so streamed <Suspense>
  content isn't revealed/hydrated until a screenshot or real interaction. Not a bug in the site
- Secrets go in `.env.local` (gitignored) locally and in Vercel's environment variables when deployed
