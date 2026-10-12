import type { Prisma } from "@/generated/prisma/client";
import { db } from "@/server/db";

export const SEARCH_PAGE_SIZE = 10;

const SELLER_TYPE_ID = 1;
const BUYER_TYPE_ID = 2;

export type SearchViewer = {
  userId: number;
  companyId: number | null;
  userTypeId: number | null;
};

export type SearchFilters = {
  search: string;
  category: number | null;
  company: number | null;
  productType: number | null;
  brand: string;
  country: string;
  state: string;
  city: string;
  page: number;
};

// Réplica de UserRepository::searchWithRelationsExcept: el vendedor busca
// compradores y viceversa. Un usuario sin tipo (superadmin) ve ambos.
export async function searchUsers(viewer: SearchViewer, f: SearchFilters) {
  const targetType =
    viewer.userTypeId === SELLER_TYPE_ID
      ? BUYER_TYPE_ID
      : viewer.userTypeId === BUYER_TYPE_ID
        ? SELLER_TYPE_ID
        : null;

  let textSearchIds: number[] | null = null;
  if (f.search) {
    const pattern = `%${f.search}%`;
    const rows = await db.$queryRaw<{ id: number }[]>`
      SELECT u.id FROM users u
      WHERE unaccent(u.name) ILIKE unaccent(${pattern})
         OR unaccent(u.last_name) ILIKE unaccent(${pattern})
         OR unaccent(u.email) ILIKE unaccent(${pattern})
    `;
    textSearchIds = rows.map((r) => r.id);
  }

  const where: Prisma.UserWhereInput = {
    accountStatus: "active",
    id: { not: viewer.userId },
    ...(viewer.companyId !== null
      ? { OR: [{ companyId: { not: viewer.companyId } }, { companyId: null }] }
      : {}),
    ...(targetType !== null
      ? { userTypeId: targetType }
      : { userTypeId: { not: null } }),
    ...(textSearchIds !== null ? { id: { in: textSearchIds } } : {}),
    ...(f.category
      ? { userCategories: { some: { categoryId: f.category } } }
      : {}),
    ...(f.company ? { companyId: f.company } : {}),
    ...(f.country
      ? { company: { country: { equals: f.country, mode: "insensitive" } } }
      : {}),
    ...(f.state
      ? { company: { state: { equals: f.state, mode: "insensitive" } } }
      : {}),
    ...(f.city
      ? { company: { city: { equals: f.city, mode: "insensitive" } } }
      : {}),
  };

  const [rows, total] = await Promise.all([
    db.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        lastName: true,
        email: true,
        avatar: true,
        company: {
          select: {
            name: true,
            country: true,
            state: true,
            city: true,
            rating: true,
            ratingCount: true,
          },
        },
        userCategories: {
          select: { category: { select: { name: true } } },
        },
      },
      orderBy: { name: "asc" },
      take: SEARCH_PAGE_SIZE,
      skip: (f.page - 1) * SEARCH_PAGE_SIZE,
    }),
    db.user.count({ where }),
  ]);

  return {
    users: rows.map((u) => ({
      id: u.id,
      name: `${u.name} ${u.lastName}`.trim(),
      email: u.email,
      avatar: u.avatar,
      companyName: u.company?.name ?? "",
      country: u.company?.country ?? "",
      state: u.company?.state ?? "",
      city: u.company?.city ?? "",
      rating: u.company?.rating ?? 0,
      ratingCount: u.company?.ratingCount ?? 0,
      categories: u.userCategories.map((c) => c.category.name),
    })),
    total,
    pageCount: Math.max(1, Math.ceil(total / SEARCH_PAGE_SIZE)),
  };
}

export type SearchUserRow = Awaited<
  ReturnType<typeof searchUsers>
>["users"][number];

// Réplica de ProductCatalogController::search: productos de otras empresas.
export async function searchProducts(viewer: SearchViewer, f: SearchFilters) {
  const s = f.search
    ? { contains: f.search, mode: "insensitive" as const }
    : null;

  const where: Prisma.ProductCatalogWhereInput = {
    ...(viewer.companyId !== null
      ? { companyId: { not: viewer.companyId } }
      : {}),
    ...(s ? { name: s } : {}),
    ...(f.productType ? { productTypeId: f.productType } : {}),
    ...(f.brand
      ? { brand: { contains: f.brand, mode: "insensitive" } }
      : {}),
    ...(f.company ? { companyId: f.company } : {}),
    ...(f.country
      ? { company: { country: { equals: f.country, mode: "insensitive" } } }
      : {}),
    ...(f.state
      ? { company: { state: { equals: f.state, mode: "insensitive" } } }
      : {}),
    ...(f.city
      ? { company: { city: { equals: f.city, mode: "insensitive" } } }
      : {}),
  };

  const [rows, total] = await Promise.all([
    db.productCatalog.findMany({
      where,
      select: {
        id: true,
        name: true,
        brand: true,
        price: true,
        productType: { select: { name: true } },
        company: {
          select: {
            name: true,
            country: true,
            state: true,
            city: true,
            rating: true,
            ratingCount: true,
          },
        },
      },
      orderBy: { name: "asc" },
      take: SEARCH_PAGE_SIZE,
      skip: (f.page - 1) * SEARCH_PAGE_SIZE,
    }),
    db.productCatalog.count({ where }),
  ]);

  return {
    products: rows.map((p) => ({
      id: p.id,
      name: p.name,
      brand: p.brand ?? "",
      price: p.price.toFixed(2),
      typeName: p.productType.name,
      companyName: p.company.name,
      country: p.company.country ?? "",
      state: p.company.state ?? "",
      city: p.company.city ?? "",
      rating: p.company.rating,
      ratingCount: p.company.ratingCount,
    })),
    total,
    pageCount: Math.max(1, Math.ceil(total / SEARCH_PAGE_SIZE)),
  };
}

export type SearchProductRow = Awaited<
  ReturnType<typeof searchProducts>
>["products"][number];

export async function getSearchLookups() {
  const [categories, companies, productTypes, companyLocations, dbCountries] =
    await Promise.all([
      db.category.findMany({
        select: { id: true, name: true },
        orderBy: { name: "asc" },
      }),
      db.company.findMany({
        select: { id: true, name: true },
        orderBy: { name: "asc" },
      }),
      db.productType.findMany({ select: { id: true, name: true } }),
      db.company.findMany({
        where: { country: { not: null } },
        select: { country: true, state: true, city: true },
        distinct: ["country", "state", "city"],
      }),
      // El catálogo de países (México y Estados Unidos) siempre aparece en
      // el filtro, aunque ninguna empresa registre aún ese país (feedback
      // presentación 2026-09-26, lámina 5).
      db.country.findMany({
        include: { states: { select: { name: true } } },
        orderBy: { name: "asc" },
      }),
    ]);

  const countries = [
    ...new Set([
      ...dbCountries.map((c) => c.name),
      ...(companyLocations.map((l) => l.country).filter(Boolean) as string[]),
    ]),
  ];

  // Los estados del catálogo alimentan el filtro en cascada aun sin
  // empresas registradas en ellos.
  const known = new Set(companyLocations.map((l) => `${l.country}|${l.state}`));
  const catalogLocations = dbCountries.flatMap((c) =>
    c.states
      .filter((s) => !known.has(`${c.name}|${s.name}`))
      .map((s) => ({ country: c.name, state: s.name, city: null })),
  );

  return {
    categories,
    companies,
    productTypes,
    locations: [...companyLocations, ...catalogLocations],
    countries,
  };
}

export type SearchLookups = Awaited<ReturnType<typeof getSearchLookups>>;
