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

## 2026-08-29 — Migrate user management page (`9bf1d5c`)
**Commit:** feat: migrate user management page from legacy app

Port of `/user-management/users` (header menu: Usuarios; superadmin only).
Legacy sources: `efness-frontend/src/app/modules/apps/user-management/` and
`UserController` + `SuperAdminMiddleware` in the backend.

- Authorization: page redirects non-superadmins to /dashboard; `src/proxy.ts`
  already gated the route. Actions re-check roleId 1 server-side.
- Table: name/email + avatar, company, user type badge, two-factor
  Enabled/Disabled badge, joined date; search over name/lastName/email;
  10/page.
- Create/edit dialog with the legacy modal's 4 fields (first name, last
  name, email, user type). New users get `role_id 2` (admin) like the legacy
  default, email pre-verified, and — since the legacy modal has NO password
  field — a random bcrypt-hashed password; they must go through password
  reset to log in (reset flow not built yet). Duplicate email → friendly
  "email_taken" error (P2002).
- Delete: AlertDialog confirm, self-deletion refused, cascades per schema
  (posts, biddings, etc. — same as legacy CASCADE FKs).
- Deviation: legacy listed only users of the superadmin's own company; our
  superadmin has no company, so it lists ALL users except self.

Not ported: bulk selection/delete, the commented-out legacy filters
(user type / last login — never enabled in legacy), account deactivation,
2FA toggling, avatar upload.

WITH THIS, THE ENTIRE SIDEBAR/SHELL IS FUNCTIONAL: login, dashboard feed,
biddings list, catalog, searcher, reports, allies, user management.

## 2026-08-29 — Migrate my-network allies page (`3ddebd2`)
**Commit:** feat: migrate my-network allies page from legacy app

Port of `/my-network` (sidebar: Aliados). Legacy sources:
`efness-frontend/src/app/pages/allies/` and
`efness-backend/app/Services/FriendshipService.php`.

- Layout like legacy: left column with tabs (Aliados potenciales grid /
  Mis aliados list with search by name or company), right column with
  received and sent pending-request panels.
- `src/server/network.ts` — `getAllies` (users joined via friendships in
  either direction), `getReceivedRequests`/`getSentRequests` (pending only).
  Potential allies reuses `getPotentialAllies` from `src/server/feed.ts`
  (now takes a `limit` param; 12 here, 9 on dashboard).
- `src/server/network-actions.ts` — accept (status→accepted + create BOTH
  friendship directions, matching legacy and the migrated data: 3 accepted
  requests ↔ 6 friendship rows), reject (status→rejected), cancel (delete,
  sender only), remove ally (delete both directions). All revalidate
  /my-network and /dashboard; `sendAllyRequestAction` updated likewise.

Not ported (noted for later): websocket realtime updates (Laravel Echo
`user.{id}` channel), chat drawer integration ("Send Message" button
omitted until chat exists), company profile modal on card click, the
"Show More" modal, and the legacy product/proximity ranking of potential
allies (this port orders by newest user).

## 2026-08-29 — Migrate reports page with role-based KPIs (`cec653f`)
**Commit:** feat: migrate reports page with role-based KPI indicators

IMPORTANT context: the legacy `/reports` route renders only "Sin resultados"
(placeholder — see `efness-frontend/src/app/pages/reports/ReportsWrapper.tsx`).
The real metrics live in the legacy SIDEBAR indicators
(`SidebarIndicators.tsx`) backed by `BiddingController::getIndicatorsBuyer` /
`getIndicatorsSeller`. This port surfaces those as the Reports page.

- `src/server/reports.ts`:
  - Buyer: open (no company status, own company, open/quoted), with-quote
    (company status quoted), with-purchase-order (status generated_orders),
    closed (closed/rated), overdue (no company status, created >2 days ago).
    Buyer cards show percent-of-total bars like the legacy sidebar.
  - Seller: quoted-not-closed, assigned (assigned/confirmed/
    generated_orders/rated), unassigned, open (reuses the seller-active
    bidding filters via `sellerActiveExtras`, now exported from
    `src/server/biddings.ts`), buyers-with-active-matching-biddings,
    cumulative sale (SUM order_products.total for own company's orders),
    new buyer accounts in the last 30 days.
  - Superadmin/global (new behavior, no legacy equivalent): platform-wide
    bidding counts by status + active users + companies + total sales.
- Thresholds hardcoded like legacy: 2 days (overdue), 30 days (new clients).
- Card palette from legacy: #3699FF, #8950FC, #0BB783, #F64E60, #1A233E.

Not ported: the legacy ToolbarReports (date/sort filters) — it was never
wired up in the legacy app either. "Closed requisitions, without quoting"
seller metric was hardcoded 0 in legacy and is omitted here.

## 2026-08-28 — Migrate advanced search page (`40637be`)
**Commit:** feat: migrate advanced search page from legacy app

Port of `/advanced-search/users` (sidebar: Buscador). Legacy sources:
`efness-frontend/src/app/modules/apps/user-search/` and
`efness-backend/app/Repositories/UserRepository.php`
(`searchWithRelationsExcept`).

- `src/server/search.ts` — `searchUsers` (target type is the inverse of the
  viewer's: seller→buyers, buyer→sellers; superadmin sees both; excludes own
  company and self; search over name/lastName/email; filters by category
  membership, company, and company country/state/city) and `searchProducts`
  (other companies' catalogs; name search; product type/brand/company/geo
  filters). `getSearchLookups` feeds the filter selects (categories,
  companies, product types, distinct company locations for cascading
  country→state→city).
- `src/components/search/search-filters.tsx` — client filter bar: mode
  toggle (Compradores|Proveedores / Productos), search box, conditional
  filters per mode, cascading geo selects, Reset/Apply pushing URL params.
- Results tables replicate legacy columns; ratings show `x.x/5 (count)`.

Reference notes / not yet ported:
- `useUserConfig` geographic-scope matching (seller_geographic_scopes vs
  buyer addresses, include/exclude) — checkbox omitted for now.
- Monthly search limit feature-gate ("Search users/products (only 4)") and
  the plan-upgrade alert; profile-view tracking (`profile_views`) and the
  CompanyProfileModal on row click.
- Legacy aggregated geo filter options from search RESULTS; this port uses
  distinct company locations from the DB instead (broader but simpler).

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
