import { db } from "@/server/db";

// Datos de la pestaña "Zona geográfica y giro" de configuración de cuenta
// (feedback presentación 2026-09; réplica ligera del GeographicScopeManagement
// del frontend legacy, sin mapa).

export async function getBusinessProfile(userId: number) {
  const [categories, userCategories, countries, states, scopes] =
    await Promise.all([
      db.category.findMany({
        select: { id: true, name: true },
        orderBy: { name: "asc" },
      }),
      db.userCategory.findMany({
        where: { userId },
        select: { categoryId: true },
      }),
      db.country.findMany({
        select: { id: true, name: true },
        orderBy: { name: "asc" },
      }),
      db.state.findMany({
        select: { id: true, name: true, countryId: true },
        orderBy: { name: "asc" },
      }),
      db.sellerGeographicScope.findMany({
        where: { sellerId: userId },
        include: {
          country: { select: { name: true } },
          state: { select: { name: true } },
        },
        orderBy: { id: "asc" },
      }),
    ]);

  return {
    categories,
    selectedCategoryIds: userCategories.map((c) => c.categoryId),
    countries,
    states,
    scopes: scopes.map((s) => ({
      id: s.id,
      scopeType: s.scopeType,
      level: s.level,
      countryName: s.country.name,
      stateName: s.state?.name ?? null,
      cityName: s.cityName,
    })),
  };
}

export type BusinessProfile = Awaited<ReturnType<typeof getBusinessProfile>>;
