import type { Prisma } from "@/generated/prisma/client";
import { db } from "@/server/db";

export const PRODUCTS_PAGE_SIZE = 10;

export type ProductsViewer = {
  companyId: number | null;
  isSuperadmin: boolean;
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
  // Réplica de ProductCatalogRepository::getAllForCompany. El superadmin no
  // tiene empresa: ve el catálogo de todas.
  const where: Prisma.ProductCatalogWhereInput = {
    ...(viewer.isSuperadmin || viewer.companyId === null
      ? {}
      : { companyId: viewer.companyId }),
    ...(search ? searchWhere(search) : {}),
  };

  const [rows, total] = await Promise.all([
    db.productCatalog.findMany({
      where,
      include: {
        productType: { select: { name: true } },
        unit: { select: { name: true } },
        company: { select: { name: true } },
        productCatalogTaxes: {
          include: { tax: { select: { taxName: true } } },
        },
      },
      orderBy: { createdAt: "desc" },
      take: PRODUCTS_PAGE_SIZE,
      skip: (page - 1) * PRODUCTS_PAGE_SIZE,
    }),
    db.productCatalog.count({ where }),
  ]);

  return {
    products: rows.map((p) => ({
      id: p.id,
      companyName: p.company.name,
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
