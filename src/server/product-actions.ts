"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { Prisma } from "@/generated/prisma/client";
import { auth } from "@/server/auth";
import { db } from "@/server/db";
import { parseCsv, rowsToObjects } from "@/server/product-csv";
import { uploadImage, uploadPdf } from "@/server/uploads";

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
  taxIds: z.array(z.coerce.number().int()),
  iepsRate: z.coerce.number().min(0).optional(),
  customTaxName: z.string().trim().min(1).max(255).optional(),
  customTaxRate: z.coerce.number().min(0).max(100).optional(),
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
    customTaxName: formData.get("customTaxName") || undefined,
    customTaxRate:
      formData.get("customTaxRate") === null ||
      formData.get("customTaxRate") === ""
        ? undefined
        : formData.get("customTaxRate"),
  });
  if (!parsed.success) return { error: "invalid_product" };
  const data = parsed.data;

  if (data.productTypeId !== SERVICE_TYPE_ID && !data.brand) {
    return { error: "brand_required" };
  }

  const hasCustomTax =
    data.customTaxName !== undefined && data.customTaxRate !== undefined;
  if (data.taxIds.length === 0 && !hasCustomTax) {
    return { error: "tax_required" };
  }

  const taxes = await db.tax.findMany({ where: { id: { in: data.taxIds } } });
  const taxRows = taxes.map((t) => ({
    taxId: t.id,
    taxRate:
      t.taxRate === null || Number(t.taxRate) === 0
        ? new Prisma.Decimal(data.iepsRate ?? 0)
        : t.taxRate,
  }));

  // Impuesto libre: se reutiliza si ya existe uno con el mismo nombre y tasa;
  // si no, se crea marcado como "custom" para no aparecer en el listado de
  // impuestos predefinidos.
  if (hasCustomTax) {
    const rate = new Prisma.Decimal(data.customTaxRate!);
    const customTax =
      (await db.tax.findFirst({
        where: {
          taxName: { equals: data.customTaxName!, mode: "insensitive" },
          taxRate: rate,
        },
      })) ??
      (await db.tax.create({
        data: {
          taxName: data.customTaxName!,
          taxRate: rate,
          country: "Mexico",
          description: "custom",
        },
      }));
    if (!taxRows.some((t) => t.taxId === customTax.id)) {
      taxRows.push({ taxId: customTax.id, taxRate: rate });
    }
  }

  // Imagen (máx 2MB) y ficha técnica en PDF (máx 10MB), como el legacy.
  let image: string | undefined;
  const imageFile = formData.get("image");
  if (imageFile instanceof File && imageFile.size > 0) {
    const result = await uploadImage(imageFile, "product-images");
    if ("error" in result) return { error: result.error };
    image = result.url;
  }
  let technicalSheet: string | undefined;
  const sheetFile = formData.get("technicalSheet");
  if (sheetFile instanceof File && sheetFile.size > 0) {
    const result = await uploadPdf(sheetFile, "technical-sheets");
    if ("error" in result) return { error: result.error };
    technicalSheet = result.url;
  }

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
    ...(image ? { image } : {}),
    ...(technicalSheet ? { technicalSheet } : {}),
  };

  try {
    if (data.id) {
      const existing = await db.productCatalog.findUnique({
        where: { id: data.id },
        select: { createdBy: true },
      });
      if (!existing) return { error: "invalid_product" };
      if (!isSuperadmin && existing.createdBy !== Number(session.user.id)) {
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
  // El formulario de nueva requisición incrusta este mismo diálogo para dar
  // de alta productos sobre la marcha.
  revalidatePath("/biddings/new");
  return undefined;
}

// ---- Importación de catálogo (CSV) ----

export type ImportResult =
  | { error: string }
  | { created: number; errors: { row: number; reason: string }[] }
  | undefined;

export async function importProductsAction(
  _prev: ImportResult,
  formData: FormData,
): Promise<ImportResult> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("unauthenticated");
  const userId = Number(session.user.id);
  const companyId = session.user.companyId;
  if (!companyId) return { error: "no_company" };

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "invalid_file" };
  }
  if (file.size > 2 * 1024 * 1024) return { error: "file_too_large" };

  const rows = rowsToObjects(parseCsv(await file.text()));
  if (!rows) return { error: "invalid_columns" };
  if (rows.length === 0) return { error: "empty_file" };
  if (rows.length > 500) return { error: "too_many_rows" };

  const [types, units, taxes] = await Promise.all([
    db.productType.findMany(),
    db.unit.findMany(),
    db.tax.findMany(),
  ]);
  // Alias en español para poder llenar la plantilla a mano.
  const typeAliases: Record<string, string> = {
    producto: "Product",
    servicio: "Service",
  };

  const errors: { row: number; reason: string }[] = [];
  let created = 0;

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowNumber = i + 2; // 1-based + encabezado
    const typeName =
      typeAliases[row.tipo.toLowerCase()] ?? row.tipo;
    const type = types.find(
      (t) => t.name.toLowerCase() === typeName.toLowerCase(),
    );
    const unit = units.find(
      (u) =>
        u.name.toLowerCase() === row.unidad.toLowerCase() ||
        u.abbreviation.toLowerCase() === row.unidad.toLowerCase(),
    );
    const price = Number(row.precio || 0);
    const keywords = row.palabras_clave
      .split("|")
      .map((k) => k.trim())
      .filter(Boolean);

    if (!row.nombre || !row.codigo_interno) {
      errors.push({ row: rowNumber, reason: "missing_fields" });
      continue;
    }
    if (!type) {
      errors.push({ row: rowNumber, reason: "unknown_type" });
      continue;
    }
    if (!unit || unit.productTypeId !== type.id) {
      errors.push({ row: rowNumber, reason: "unknown_unit" });
      continue;
    }
    if (type.id !== SERVICE_TYPE_ID && !row.marca) {
      errors.push({ row: rowNumber, reason: "missing_brand" });
      continue;
    }
    if (!Number.isFinite(price) || price < 0) {
      errors.push({ row: rowNumber, reason: "invalid_price" });
      continue;
    }
    if (keywords.length === 0) {
      errors.push({ row: rowNumber, reason: "missing_keywords" });
      continue;
    }

    // Impuestos como "Nombre:Tasa|Nombre:Tasa"; deben existir en el listado.
    const taxRows: { taxId: number; taxRate: Prisma.Decimal }[] = [];
    let taxError = false;
    for (const pair of row.impuestos.split("|").map((x) => x.trim())) {
      if (!pair) continue;
      const idx = pair.lastIndexOf(":");
      const name = (idx === -1 ? pair : pair.slice(0, idx)).trim();
      const rate = idx === -1 ? NaN : Number(pair.slice(idx + 1));
      const tax = taxes.find(
        (t) => t.taxName.toLowerCase() === name.toLowerCase(),
      );
      if (!tax || !Number.isFinite(rate) || rate < 0 || rate > 100) {
        taxError = true;
        break;
      }
      taxRows.push({ taxId: tax.id, taxRate: new Prisma.Decimal(rate) });
    }
    if (taxError || taxRows.length === 0) {
      errors.push({ row: rowNumber, reason: "invalid_taxes" });
      continue;
    }

    try {
      await db.productCatalog.create({
        data: {
          companyId,
          createdBy: userId,
          productTypeId: type.id,
          unitId: unit.id,
          name: row.nombre.slice(0, 5000),
          brand: row.marca || null,
          internalCode: row.codigo_interno,
          externalCode: row.codigo_externo || null,
          satKey: row.clave_sat || null,
          price: new Prisma.Decimal(price),
          keywords,
          productCatalogTaxes: { create: taxRows },
        },
      });
      created++;
    } catch (e) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === "P2002"
      ) {
        errors.push({ row: rowNumber, reason: "duplicate_code" });
      } else {
        errors.push({ row: rowNumber, reason: "unknown_error" });
      }
    }
  }

  revalidatePath("/products/catalog");
  return { created, errors };
}

export async function deleteProductAction(productId: number) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("unauthenticated");
  const isSuperadmin = session.user.roleId === SUPERADMIN_ROLE_ID;

  const product = await db.productCatalog.findUnique({
    where: { id: productId },
    select: { createdBy: true },
  });
  if (!product) return;
  if (!isSuperadmin && product.createdBy !== Number(session.user.id)) return;

  await db.productCatalog.delete({ where: { id: productId } });
  revalidatePath("/products/catalog");
}
