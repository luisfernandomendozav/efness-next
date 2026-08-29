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
