import type { Prisma } from "@/generated/prisma/client";
import { db } from "@/server/db";

export const BIDDINGS_PAGE_SIZE = 15;

export type BiddingsTab = "active" | "assigned" | "quoted" | "closed";

export type BiddingsViewer = {
  userId: number;
  companyId: number | null;
  isSeller: boolean;
  isSuperadmin: boolean;
};

export function tabsForViewer(viewer: BiddingsViewer): BiddingsTab[] {
  if (viewer.isSuperadmin) return ["active", "assigned", "quoted", "closed"];
  return viewer.isSeller
    ? ["active", "quoted", "closed"]
    : ["active", "assigned", "closed"];
}

// Estados globales por pestaña, según BiddingRepository del backend legacy.
const TAB_STATUSES: Record<BiddingsTab, string[]> = {
  active: ["open", "quoted"],
  assigned: ["assigned", "confirmed", "generated_orders"],
  quoted: ["quoted", "assigned", "confirmed", "generated_orders"],
  closed: ["closed", "rated"],
};

function searchWhere(search: string): Prisma.BiddingWhereInput {
  const s = { contains: search, mode: "insensitive" as const };
  return {
    OR: [
      { biddingNumber: s },
      { creator: { name: s } },
      { creator: { company: { name: s } } },
      { address: { city: s } },
    ],
  };
}

export async function sellerActiveExtras(
  viewer: BiddingsViewer,
): Promise<Prisma.BiddingWhereInput[]> {
  const [categories, scopes] = await Promise.all([
    db.userCategory.findMany({
      where: { userId: viewer.userId },
      select: { categoryId: true },
    }),
    db.sellerGeographicScope.findMany({
      where: { sellerId: viewer.userId, scopeType: "include" },
      select: { countryId: true, stateId: true, cityName: true, level: true },
    }),
  ]);

  const extras: Prisma.BiddingWhereInput[] = [];
  if (categories.length > 0) {
    extras.push({ categoryId: { in: categories.map((c) => c.categoryId) } });
  }
  if (scopes.length > 0) {
    extras.push({
      OR: [
        { deliveryType: { not: "shipping" } },
        {
          address: {
            OR: scopes.map((s) =>
              s.level === "country"
                ? { countryId: s.countryId }
                : s.level === "state"
                  ? { countryId: s.countryId, stateId: s.stateId ?? undefined }
                  : {
                      countryId: s.countryId,
                      stateId: s.stateId ?? undefined,
                      city: {
                        equals: s.cityName ?? "",
                        mode: "insensitive" as const,
                      },
                    },
            ),
          },
        },
      ],
    });
  }
  return extras;
}

async function whereForTab(
  viewer: BiddingsViewer,
  tab: BiddingsTab,
): Promise<Prisma.BiddingWhereInput> {
  const statuses = TAB_STATUSES[tab];

  // El superadmin ve todas las requisiciones por estado.
  if (viewer.isSuperadmin) return { status: { in: statuses } };

  if (!viewer.isSeller || viewer.companyId === null) {
    // Comprador: solo sus propias requisiciones en todas las pestañas
    // (feedback presentación 2026-09; antes eran las de toda la empresa).
    if (tab === "closed" && viewer.companyId !== null) {
      return {
        createdBy: viewer.userId,
        biddingCompanyStatuses: {
          some: {
            companyId: viewer.companyId,
            status: { in: ["closed", "rated"] },
          },
        },
      };
    }
    return { status: { in: statuses }, createdBy: viewer.userId };
  }
  const companyId = viewer.companyId;

  // Vendedor.
  if (tab === "active") {
    const extras = await sellerActiveExtras(viewer);
    return {
      AND: [
        { status: { in: statuses } },
        { biddingCompanyStatuses: { none: { companyId } } },
        { creator: { companyId: { not: companyId } } },
        ...extras,
      ],
    };
  }
  if (tab === "quoted") {
    return {
      status: { in: statuses },
      creator: { companyId: { not: companyId } },
      biddingCompanyStatuses: {
        some: {
          companyId,
          status: {
            in: ["quoted", "assigned", "unassigned", "confirmed", "generated_orders"],
          },
        },
      },
    };
  }
  // closed
  return {
    status: { in: statuses },
    creator: { companyId: { not: companyId } },
    biddingCompanyStatuses: {
      some: {
        companyId,
        status: { in: ["unassigned", "generated_orders", "closed", "rated"] },
      },
    },
  };
}

// Réplica de BiddingStatusCell.tsx: clave de texto + variante de badge.
export type StatusVariant = "success" | "warning" | "danger" | "info";

export function displayStatus(
  globalStatus: string,
  companyStatus: string | null,
  deadline: string | null,
  viewer: BiddingsViewer,
  tab: BiddingsTab,
): { key: string; variant: StatusVariant } {
  const expired = deadline !== null && new Date(deadline) < new Date();
  if (expired && !companyStatus && viewer.isSeller) {
    return { key: "defeated", variant: "danger" };
  }
  let status = companyStatus ?? globalStatus;
  if (viewer.isSeller && tab === "active" && status === "quoted") {
    status = "open";
  }
  switch (status) {
    case "open":
      return { key: "open", variant: "success" };
    case "quoted":
      return { key: "quoted", variant: "warning" };
    case "assigned":
      return { key: "assigned (not confirmed)", variant: "success" };
    case "confirmed":
      return {
        key: "confirmed assignment (waiting for order)",
        variant: "success",
      };
    case "generated_orders":
      if (!viewer.isSeller) return { key: "generated orders", variant: "info" };
      return tab === "closed"
        ? { key: "closed (to qualify)", variant: "danger" }
        : { key: "generated order", variant: "info" };
    case "unassigned":
      return tab === "closed"
        ? { key: "closed (unassigned)", variant: "danger" }
        : { key: "unassigned", variant: "danger" };
    case "closed":
      return { key: "closed (to qualify)", variant: "danger" };
    case "rated":
      return { key: "rated", variant: "success" };
    default:
      return { key: status, variant: "info" };
  }
}

export async function getBiddings(
  viewer: BiddingsViewer,
  tab: BiddingsTab,
  search: string,
  page: number,
) {
  const where: Prisma.BiddingWhereInput = {
    AND: [
      await whereForTab(viewer, tab),
      ...(search ? [searchWhere(search)] : []),
    ],
  };

  const [rows, total] = await Promise.all([
    db.bidding.findMany({
      where,
      include: {
        creator: {
          select: {
            name: true,
            lastName: true,
            company: {
              select: { name: true, country: true, state: true, city: true },
            },
          },
        },
        address: {
          select: {
            country: true,
            state: true,
            city: true,
            street: true,
            outdoorNumber: true,
            interiorNumber: true,
            zipCode: true,
          },
        },
        biddingCompanyStatuses: viewer.companyId
          ? { where: { companyId: viewer.companyId }, select: { status: true } }
          : { take: 0, select: { status: true } },
      },
      orderBy: { createdAt: "desc" },
      take: BIDDINGS_PAGE_SIZE,
      skip: (page - 1) * BIDDINGS_PAGE_SIZE,
    }),
    db.bidding.count({ where }),
  ]);

  const biddings = rows.map((b) => {
    const companyStatus = b.biddingCompanyStatuses[0]?.status ?? null;
    const expired = b.deadline !== null && b.deadline < new Date();
    return {
      id: b.id,
      biddingNumber: b.biddingNumber,
      createdByName: `${b.creator.name} ${b.creator.lastName}`.trim(),
      companyName: b.creator.company?.name ?? "",
      deliveryType: b.deliveryType,
      address: b.address
        ? [
            b.address.street &&
              `${b.address.street} ${b.address.outdoorNumber ?? ""}`.trim(),
            b.address.city,
            b.address.state,
            b.address.country,
            b.address.zipCode,
          ]
            .filter(Boolean)
            .join(", ")
        : "",
      currency: b.currency,
      placeOfOrigin: [
        b.creator.company?.city,
        b.creator.company?.state,
        b.creator.company?.country,
      ]
        .filter(Boolean)
        .join(", "),
      status: displayStatus(
        b.status,
        companyStatus,
        b.deadline?.toISOString() ?? null,
        viewer,
        tab,
      ),
      canDelete:
        tab === "active" &&
        (viewer.isSuperadmin ||
          (!viewer.isSeller && b.createdBy === viewer.userId)),
      // El vendedor cotiza desde la pestaña activa mientras la requisición
      // siga vigente y su empresa no la haya cotizado (feedback 2026-09-19).
      canQuote:
        tab === "active" &&
        viewer.isSeller &&
        !expired &&
        companyStatus === null &&
        ["open", "quoted"].includes(b.status),
    };
  });

  return {
    biddings,
    total,
    pageCount: Math.max(1, Math.ceil(total / BIDDINGS_PAGE_SIZE)),
  };
}

export type BiddingRow = Awaited<
  ReturnType<typeof getBiddings>
>["biddings"][number];

// Carga la requisición para la pantalla de cotizar del vendedor. Devuelve
// null si la requisición no existe o su empresa ya no puede cotizarla.
export async function getBiddingForQuote(
  viewer: BiddingsViewer,
  biddingId: number,
) {
  if (!viewer.isSeller || viewer.companyId === null) return null;
  const b = await db.bidding.findUnique({
    where: { id: biddingId },
    include: {
      creator: {
        select: {
          name: true,
          lastName: true,
          company: { select: { id: true, name: true } },
        },
      },
      category: { select: { name: true } },
      address: {
        select: {
          country: true,
          state: true,
          city: true,
          street: true,
          outdoorNumber: true,
          zipCode: true,
        },
      },
      biddingProducts: {
        include: {
          productCatalog: {
            select: { internalCode: true, unit: { select: { name: true } } },
          },
          biddingProductTaxes: {
            include: { tax: { select: { taxName: true } } },
          },
        },
      },
      biddingCompanyStatuses: {
        where: { companyId: viewer.companyId },
        select: { id: true },
      },
    },
  });
  if (!b) return null;

  const expired = b.deadline !== null && b.deadline < new Date();
  if (
    !["open", "quoted"].includes(b.status) ||
    expired ||
    b.creator.company?.id === viewer.companyId ||
    b.biddingCompanyStatuses.length > 0
  ) {
    return null;
  }

  return {
    id: b.id,
    biddingNumber: b.biddingNumber,
    companyName: b.creator.company?.name ?? "",
    categoryName: b.category?.name ?? "",
    currency: b.currency,
    deliveryType: b.deliveryType,
    deadline: b.deadline?.toISOString().slice(0, 10) ?? "",
    deliveryDate: b.deliveryDate?.toISOString().slice(0, 10) ?? "",
    address: b.address
      ? [
          b.address.street &&
            `${b.address.street} ${b.address.outdoorNumber ?? ""}`.trim(),
          b.address.city,
          b.address.state,
          b.address.country,
          b.address.zipCode,
        ]
          .filter(Boolean)
          .join(", ")
      : "",
    description: b.description ?? "",
    notes: b.notes ?? "",
    products: b.biddingProducts.map((p) => ({
      id: p.id,
      name: p.name,
      internalCode: p.productCatalog.internalCode,
      unitName: p.productCatalog.unit.name,
      quantity: p.quantity,
      comments: p.comments ?? "",
      taxes: p.biddingProductTaxes.map((t) => ({
        name: t.tax.taxName,
        rate: Number(t.taxRate),
      })),
    })),
  };
}

export type BiddingForQuote = NonNullable<
  Awaited<ReturnType<typeof getBiddingForQuote>>
>;
