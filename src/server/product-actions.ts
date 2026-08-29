"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { Prisma } from "@/generated/prisma/client";
import { auth } from "@/server/auth";
import { db } from "@/server/db";

const SUPERADMIN_ROLE_ID = 1;
const SERVICE_TYPE_ID = 2;

export type ProductActionState = { error?: string } | undefined;

const productSchema = z.object({
  id: z.coerce.number().int().optional(),
  productTypeId: z.coerce.number().int().min(1),
  name: z.string().trim().min(1).max(5000),
  brand: z.string().trim().max(255).optional(),
  price: z.coerce.number().min(0),
  internalCode: z.string().trim().min(1).max(255),
  externalCode: z.string().trim().max(255).optional(),
  satKey: z.string().trim().max(255).optional(),
  unitId: z.coerce.number().int().min(1),
  keywords: z.array(z.string().trim().min(1)).min(1),
  taxIds: z.array(z.coerce.number().int()).min(1),
  iepsRate: z.coerce.number().min(0).optional(),
});

export async function saveProductAction(
  _prev: ProductActionState,
  formData: FormData,
): Promise<ProductActionState> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("unauthenticated");
  const isSuperadmin = session.user.roleId === SUPERADMIN_ROLE_ID;

  const parsed = productSchema.safeParse({
    id: formData.get("id") || undefined,
    productTypeId: formData.get("productTypeId"),
    name: formData.get("name"),
    brand: formData.get("brand") || undefined,
    price: formData.get("price") || 0,
    internalCode: formData.get("internalCode"),
    externalCode: formData.get("externalCode") || undefined,
    satKey: formData.get("satKey") || undefined,
    unitId: formData.get("unitId"),
    keywords: JSON.parse(String(formData.get("keywords") ?? "[]")),
    taxIds: formData.getAll("taxIds"),
    iepsRate: formData.get("iepsRate") || undefined,
  });
  if (!parsed.success) return { error: "invalid_product" };
  const data = parsed.data;

  if (data.productTypeId !== SERVICE_TYPE_ID && !data.brand) {
    return { error: "brand_required" };
  }

  const taxes = await db.tax.findMany({ where: { id: { in: data.taxIds } } });
  const taxRows = taxes.map((t) => ({
    taxId: t.id,
    taxRate:
      t.taxRate === null || Number(t.taxRate) === 0
        ? new Prisma.Decimal(data.iepsRate ?? 0)
        : t.taxRate,
  }));

  const base = {
    productTypeId: data.productTypeId,
    unitId: data.unitId,
    name: data.name,
    brand: data.brand ?? null,
    price: new Prisma.Decimal(data.price),
    internalCode: data.internalCode,
    externalCode: data.externalCode ?? null,
    satKey: data.satKey ?? null,
    keywords: data.keywords,
  };

  try {
    if (data.id) {
      const existing = await db.productCatalog.findUnique({
        where: { id: data.id },
        select: { companyId: true },
      });
      if (!existing) return { error: "invalid_product" };
      if (!isSuperadmin && existing.companyId !== session.user.companyId) {
        return { error: "invalid_product" };
      }
      await db.$transaction([
        db.productCatalog.update({
          where: { id: data.id },
          data: { ...base, updatedBy: Number(session.user.id) },
        }),
        db.productCatalogTax.deleteMany({
          where: { productCatalogId: data.id },
        }),
        db.productCatalogTax.createMany({
          data: taxRows.map((t) => ({ ...t, productCatalogId: data.id! })),
        }),
      ]);
    } else {
      if (!session.user.companyId) return { error: "no_company" };
      await db.productCatalog.create({
        data: {
          ...base,
          companyId: session.user.companyId,
          createdBy: Number(session.user.id),
          productCatalogTaxes: { create: taxRows },
        },
      });
    }
  } catch (e) {
    if (
      e instanceof Prisma.PrismaClientKnownRequestError &&
      e.code === "P2002"
    ) {
      return { error: "duplicate_code" };
    }
    throw e;
  }

  revalidatePath("/products/catalog");
  return undefined;
}

export async function deleteProductAction(productId: number) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("unauthenticated");
  const isSuperadmin = session.user.roleId === SUPERADMIN_ROLE_ID;

  const product = await db.productCatalog.findUnique({
    where: { id: productId },
    select: { companyId: true },
  });
  if (!product) return;
  if (!isSuperadmin && product.companyId !== session.user.companyId) return;

  await db.productCatalog.delete({ where: { id: productId } });
  revalidatePath("/products/catalog");
}
