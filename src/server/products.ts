import type { Prisma } from "@/generated/prisma/client";
import { db } from "@/server/db";

export const PRODUCTS_PAGE_SIZE = 10;

export type ProductsViewer = {
  userId: number;
  companyId: number | null;
};

function searchWhere(search: string): Prisma.ProductCatalogWhereInput {
  const s = { contains: search, mode: "insensitive" as const };
  return {
    OR: [
      { name: s },
      { internalCode: s },
      { externalCode: s },
      { satKey: s },
      { brand: s },
    ],
  };
}

export async function getProducts(
  viewer: ProductsViewer,
  search: string,
  page: number,
) {
  // Cada usuario ve solo los productos que él creó, también el superadmin:
  // el catálogo es la gestión del catálogo propio (feedback presentación
  // 2026-09-26, lámina 7; antes el superadmin veía todos).
  const where: Prisma.ProductCatalogWhereInput = {
    createdBy: viewer.userId,
    ...(search ? searchWhere(search) : {}),
  };

  const [rows, total, latest] = await Promise.all([
    db.productCatalog.findMany({
      where,
      include: {
        productType: { select: { name: true } },
        unit: { select: { name: true } },
        productCatalogTaxes: {
          include: { tax: { select: { taxName: true } } },
        },
      },
      orderBy: { createdAt: "desc" },
      take: PRODUCTS_PAGE_SIZE,
      skip: (page - 1) * PRODUCTS_PAGE_SIZE,
    }),
    db.productCatalog.count({ where }),
    // Fecha de última actualización del catálogo propio, sin filtro de
    // búsqueda (se muestra junto al buscador).
    db.productCatalog.aggregate({
      where: { createdBy: viewer.userId },
      _max: { updatedAt: true },
    }),
  ]);

  return {
    lastUpdatedAt: latest._max.updatedAt?.toISOString() ?? null,
    products: rows.map((p) => ({
      id: p.id,
      name: p.name,
      brand: p.brand,
      internalCode: p.internalCode,
      externalCode: p.externalCode,
      satKey: p.satKey,
      typeName: p.productType.name,
      unitName: p.unit.name,
      price: p.price.toFixed(2),
      image: p.image,
      technicalSheet: p.technicalSheet,
      taxes: p.productCatalogTaxes.map((t) => ({
        name: t.tax.taxName,
        rate: Number(t.taxRate),
      })),
      // Datos para el formulario de edición.
      form: {
        productTypeId: p.productTypeId,
        unitId: p.unitId,
        brand: p.brand ?? "",
        externalCode: p.externalCode ?? "",
        satKey: p.satKey ?? "",
        price: Number(p.price),
        keywords: Array.isArray(p.keywords) ? (p.keywords as string[]) : [],
        taxes: p.productCatalogTaxes.map((t) => ({
          taxId: t.taxId,
          name: t.tax.taxName,
          rate: Number(t.taxRate),
        })),
      },
    })),
    total,
    pageCount: Math.max(1, Math.ceil(total / PRODUCTS_PAGE_SIZE)),
  };
}

export type ProductRow = Awaited<
  ReturnType<typeof getProducts>
>["products"][number];

export async function getProductLookups() {
  const [types, units, taxes] = await Promise.all([
    db.productType.findMany({ select: { id: true, name: true } }),
    db.unit.findMany({
      select: { id: true, name: true, productTypeId: true },
      orderBy: { name: "asc" },
    }),
    db.tax.findMany({
      // Los impuestos capturados a mano (description "custom") no forman
      // parte del listado predefinido.
      where: { OR: [{ description: null }, { description: { not: "custom" } }] },
      select: { id: true, taxName: true, taxRate: true, country: true },
      orderBy: { id: "asc" },
    }),
  ]);
  return {
    types,
    units,
    taxes: taxes.map((t) => ({
      id: t.id,
      name: t.taxName,
      rate: t.taxRate === null ? null : Number(t.taxRate),
      country: t.country,
    })),
  };
}

export type ProductLookups = Awaited<ReturnType<typeof getProductLookups>>;
