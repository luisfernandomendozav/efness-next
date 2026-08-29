# API Change Log

Running log of every meaningful change to this project: what was done, why, the
commit hash, and anything a future reader needs to pick the feature back up.
Newest entries go at the top. Add an entry here as part of (or right after)
every commit.

Entry format:

```
## <date> — <short title> (`<commit hash>`)
**Commit:** <full commit message subject>
<What changed, why, and any reference notes: env vars, gotchas, follow-ups.>
```

---

## 2026-08-28 — Migrate product catalog page (`9ee3b31`)
**Commit:** feat: migrate product catalog page from legacy app

Port of `/products/catalog` (sidebar: Catálogo). Legacy sources:
`efness-frontend/src/app/modules/apps/products/` and
`efness-backend/app/Repositories/ProductCatalogRepository.php`.

- `src/server/products.ts` — company-scoped product listing with search over
  name, internal/external code, SAT key, brand (OR, insensitive), 10/page.
  Superadmin (no company) sees ALL companies' products with a Company column.
- `src/server/product-actions.ts` — `saveProductAction` (create/update):
  brand required unless type is Service (id 2), keywords array (min 1),
  taxes synced in `product_catalogs_taxes` with the tax's rate — null/0-rate
  taxes (IEPS) take the user-provided rate; P2002 on the per-company unique
  internal/external code returns a "duplicate_code" error. `deleteProductAction`
  scoped to own company or superadmin.
- `src/components/products/product-form-dialog.tsx` — create/edit dialog:
  type select filters units client-side, brand hidden for services, keyword
  chip input (Enter/blur, case-insensitive unique), tax checkboxes labeled
  `name (rate%) - country`, conditional IEPS input.
- Shared `src/components/table-search.tsx` (debounced URL-param search)
  replaces the biddings-specific copy; biddings page updated.

Reference notes / not yet ported:
- Product images and technical sheets: legacy stores bare filenames served
  from the Laravel disk (`public/products/{companyId}/...`); the list shows a
  placeholder icon and the form has no file inputs. Needs a storage decision
  (Vercel Blob?) plus media migration off the legacy host (64.23.180.59).
- Excel import/export toolbar, bulk selection/delete, name/taxes expand
  ("more"/"less"), stock_quantity (not displayed in legacy list either).

## 2026-08-28 — Migrate biddings list page (`b6e842b`)
**Commit:** feat: migrate biddings list page from legacy app

Port of `/biddings` (Spanish: Requisiciones). Legacy sources:
`efness-frontend/src/app/modules/apps/biddings/` and
`efness-backend/app/Repositories/BiddingRepository.php`.

- Routes: `/biddings` redirects to `/biddings/active`; `/biddings/[tab]` with
  tabs by role — buyer: active/assigned/closed; seller: active/quoted/closed;
  superadmin: all four.
- `src/server/biddings.ts` — Prisma queries replicating the repository per
  role and tab, including the seller "active" filters: no
  `bidding_company_statuses` row for their company, other companies only,
  category match (`user_categories`), and include-type geographic scopes
  matched against the delivery address by country/state/city IDs.
- Status display replicates `BiddingStatusCell.tsx`: company-specific status
  overrides global, expired deadline without company status shows "defeated"
  (sellers), seller sees "quoted" as "open" on the active tab, and the
  generated_orders/unassigned relabeling on the closed tab.
- Search (bidding number, creator name, company, city — OR, insensitive),
  pagination 15/page, delete with AlertDialog (buyer own-company or
  superadmin, active tab only).

Reference notes / not yet ported:
- Bidding detail view ("See requisition"), quote comparison, create-bidding
  wizard ("Add bidding" button omitted), orders/ratings actions, bulk delete.
  The Actions column only offers delete until those exist.
- Seller keyword-vs-product-catalog matching (part of the legacy category
  OR-condition) is NOT implemented — only direct category matching. Exclude-
  type geographic scopes are ignored (only include scopes filter).
- Superadmin behavior is new: legacy had no explicit superadmin branch; here
  it sees all biddings per status because it has no company.

## 2026-08-28 — Migrate dashboard social feed from legacy app (`597e906`)
**Commit:** feat: migrate dashboard social feed from legacy app

First functional port of the legacy dashboard (a social feed, not a KPI
dashboard — legacy source: `efness-frontend/src/app/pages/dashboard/`).

- `src/server/feed.ts` — Prisma data layer. `getFeed` replicates the Laravel
  `PostService::getFeed` visibility rule: public posts + allies-only posts
  when the author is an ally (friendships table, both directions) or self.
  `getPotentialAllies` replicates the suggestion logic (exclude self, allies,
  pending friend requests either direction; active accounts only; take 9).
- `src/server/feed-actions.ts` — server actions: `createPostAction`,
  `toggleLikeAction`, `addCommentAction`, `deletePostAction` (own posts only),
  `sendAllyRequestAction`. Like/comment keep the denormalized `likes_count` /
  `comments_count` columns in sync via transactions (legacy relies on them).
- `src/components/dashboard/` — `post-composer` (text + public/allies
  visibility), `post-card` (relative timestamps via Intl.RelativeTimeFormat,
  like/comment/delete, shared-post rendering), `potential-allies`.
- Dashboard page is a server component; pagination is `?pages=N` rendering
  the first N×10 posts with a "Load more" link (no client feed state).
- App shell restyled to legacy: sidebar `#1D2747` with the legacy menu
  (Home `/dashboard`, Biddings `/biddings`, Catalog `/products/catalog`,
  Searcher `/advanced-search/users`, Reports `/reports`, Allies
  `/my-network`, Users `/user-management/users` for superadmin only); header
  shows localized date, user name/email, and Seller/Buyer badge.

Reference notes / not yet ported:
- Image upload on posts (needs a storage decision — Vercel Blob or S3;
  legacy stored files on the Laravel disk under `posts/{user_id}/`).
- Share/repost modal, comment edit/delete, post edit, infinite scroll
  (replaced by Load more), advertisements widget, websocket-driven ally
  suggestions, notifications/chat header icons.
- Sidebar menu routes other than /dashboard 404 until those pages are ported.
- Posts require a `company_id`; users without a company (e.g. the superadmin
  created 2026-08-28) get a translated "no company" error from the composer.
- New i18n keys added to `messages/es.json` only; other locales fall back to
  the English key text.

## 2026-08-28 — Port legacy eFness theme to login and global styles (`5b4c41d`)
**Commit:** feat: port legacy eFness theme to login and global styles

The app looked unstyled because `globals.css` was the create-next-app stub —
the shadcn/ui components reference theme tokens (`bg-primary`, `bg-card`,
`border-input`, `text-destructive`…) that were never defined.

- `src/app/globals.css`: full token set as Tailwind v4 `@theme inline` vars,
  colors ported from the legacy Metronic theme
  (`efness-frontend/src/_metronic/assets/sass/core/components/_variables.scss`):
  primary/green `#7FE361`, destructive `#F8285A` (light bg `#FFEEF3`), border
  `#DBDFE9`, foreground `#071437`, muted-fg `#78829D`. Auth gradient vars
  `--efness-navy-top: #2B385F` / `--efness-navy-bottom: #152248`.
- `dark:` variant scoped to an explicit `.dark` class via `@custom-variant` —
  otherwise Tailwind v4 follows OS `prefers-color-scheme` and the shadcn
  `dark:bg-input/30` styles kick in on dark-mode systems (app is light-only).
- Font switched Geist → Source Sans 3 (`--font-source-sans`), matching legacy.
- `src/app/(auth)/layout.tsx`: navy gradient full-screen bg + centered logo
  (`public/efness-logo-dark.png`, copied from legacy repo, 231×61 shown 45px).
- `src/app/(auth)/login/page.tsx`: rebuilt to match legacy `Login.tsx` — no
  card, light heading, white inputs, green CTA, pink error box, register row.
  All strings already existed in `messages/*.json`.
- `src/app/favicon.ico`: replaced with the legacy favicon.

Reference notes:
- `/register` and `/forgot-password` links exist but those pages are NOT
  built yet — they 404 until ported.
- Legacy design source of truth: `efness-frontend/src/app/modules/auth/components/Login.tsx`.
- Verified by headless-Chrome screenshot against the legacy screenshot.

## 2026-08-28 — Ops: fix production login (env vars only, no code change)
**Commit:** none — Vercel environment + local `.env` changes

Login on the new app failed for two stacked reasons, both environment config:

1. **`AUTH_URL` pointed at the legacy site.** `AUTH_URL="https://app.efness.com"`
   (in both Vercel prod and local `.env`) made NextAuth's middleware rewrite the
   request origin, so every redirect from `src/proxy.ts` (e.g. to `/login`)
   landed on `app.efness.com` — which is the **legacy SPA on Netlify** talking
   to the legacy Laravel API (`api.efness.com`) and its MySQL DB. New-app
   accounts don't exist there. Fixed: Vercel prod `AUTH_URL` and
   `NEXT_PUBLIC_APP_URL` now `https://efness-next.vercel.app`; local `.env`
   uses `http://localhost:3000`.
2. **Broken `DATABASE_URL(_POOLED)` in Vercel prod.** Prisma failed with
   "Can't reach database server at `base`" — the stored value was malformed
   (bad paste). Replaced both with the working Neon URLs
   (`ep-flat-queen-af2oe5q2`, db `neondb`).

Reference notes:
- Verified end-to-end after redeploy: credentials login on
  `https://efness-next.vercel.app` returns a session cookie and `/dashboard`
  serves 200.
- When `app.efness.com` DNS is cut over from Netlify to Vercel, set
  `AUTH_URL`/`NEXT_PUBLIC_APP_URL` back to `https://app.efness.com`.
- `AUTH_TRUST_HOST` is set; removing `AUTH_URL` entirely is also valid and
  survives domain changes. Preview env currently has no `AUTH_URL` (inferred
  from headers).
- Vercel env values are "sensitive" (write-only): `vercel env pull` returns
  empty strings for them — that is not a bug.
- Superadmin user created 2026-08-28 directly in Neon: id from `users` table,
  email `luisfernandomendozav@gmail.com`, `role_id 1` (superadmin), bcrypt
  12-round hash, email pre-verified, 2FA off.

## 2026-08-28 — One-off MySQL → Postgres ETL scripts (`2a862ae`)
**Commit:** chore: add one-off MySQL to Postgres ETL scripts

Three manual scripts under `scripts/` used to migrate the legacy
`efness_bidding` MySQL database into the Neon Postgres database:

- `etl-discover.ts` — compares table/column inventories between the two DBs.
- `etl-migrate.ts` — copies rows in chunks of 500, sanitizing MySQL zero-dates
  (`0000-00-00 …`) to null.
- `etl-verify.ts` — compares row counts per table after migration.

Reference notes:
- Run with `pnpm tsx scripts/etl-<name>.ts`. Postgres target comes from
  `DATABASE_URL` in `.env`; MySQL source is a local container at
  `127.0.0.1:3307` (root/secret, dev-only credential).
- These are excluded from the app typecheck via `tsconfig.json`
  (`"exclude": ["node_modules", "scripts"]`) because they import `pg`
  transitively without direct types. If they ever need type-checking, add
  `pg` and `@types/pg` as dev dependencies instead of removing the exclusion.

## 2026-08-28 — Fix Vercel build: generate Prisma client at build time (`d377d3a`)
**Commit:** fix: generate Prisma client during build and exclude ETL scripts from typecheck

Vercel deploys failed with `Module not found: @/generated/prisma/client` from
`src/server/db.ts`. Root cause: the Prisma client is generated into
`src/generated/prisma` (see `prisma/schema.prisma` generator `output`), that
directory is gitignored, and the build script was plain `next build` — so the
client never existed in Vercel's checkout.

- `package.json`: build script is now `prisma generate && next build`.
- `tsconfig.json`: excluded `scripts/` from the typecheck (see entry above).

Reference notes:
- `prisma generate` does not need a live database connection, so this is safe
  in any environment; `prisma.config.ts` resolves `DATABASE_URL` lazily.
- If `src/generated` is ever un-gitignored, the generate step can stay — it is
  idempotent and fast (~300 ms).

## 2026-08-27 — Scaffold auth, i18n, Prisma schema, and app shell (`b39ce30`)
**Commit:** feat: scaffold auth, i18n, Prisma schema, and app shell

Initial application scaffold:

- **Auth:** NextAuth under `src/server/auth/` with route handler at
  `src/app/api/auth/[...nextauth]/route.ts`; login and two-factor pages
  (`/login`, `/two-factor`); server actions in `src/server/auth/actions.ts`.
- **Database:** Prisma 7 schema in `prisma/schema.prisma`, client generated to
  `src/generated/prisma`, accessed via `src/server/db.ts` using the
  `@prisma/adapter-pg` driver adapter. Uses `DATABASE_URL_POOLED` when set,
  else `DATABASE_URL` (Neon Postgres).
- **App shell:** `(app)` route group with `/dashboard`; middleware/proxy for
  route protection; i18n setup.

## 2026-08-27 — First commit (`02dc7ec`) / Create Next App init (`1a326ca`)
**Commit:** first commit / Initial commit from Create Next App

Next.js 16 (Turbopack) project bootstrapped with `create-next-app`, pnpm,
TypeScript strict mode, and the `@/* → ./src/*` path alias.
