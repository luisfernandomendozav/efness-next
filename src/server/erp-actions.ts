"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@/generated/prisma/client";
import { auth } from "@/server/auth";
import { db } from "@/server/db";

// Importación del catálogo desde AdminTotal.
// API: https://developers.admintotal.com/api/productos
// GET https://{clave}.admintotal.com/api/v2/productos/ con encabezado
// "Api-key"; respuesta paginada { count, next, previous, results }.

const MAX_PRODUCTS = 500;
const DEFAULT_IVA_RATE = 16;

export type ErpImportResult =
  | { error: string }
  | {
      created: number;
      skipped: number;
      truncated: boolean;
      errors: { code: string; reason: string }[];
    }
  | undefined;

type ErpProduct = {
  id?: number | string;
  codigo?: string;
  descripcion?: string;
  marca?: string;
  precio?: number | string;
  imagen_url?: string;
  unidad?: unknown;
};

// La unidad puede venir como cadena o como objeto anidado según la cuenta.
function erpUnitName(unidad: unknown): string {
  if (typeof unidad === "string") return unidad;
  if (unidad && typeof unidad === "object") {
    const u = unidad as Record<string, unknown>;
    for (const key of ["nombre", "descripcion", "unidad", "clave"]) {
      if (typeof u[key] === "string" && u[key]) return u[key] as string;
    }
  }
  return "";
}

export async function importErpProductsAction(
  _prev: ErpImportResult,
  formData: FormData,
): Promise<ErpImportResult> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("unauthenticated");
  const userId = Number(session.user.id);
  const companyId = session.user.companyId;
  if (!companyId) return { error: "no_company" };

  const account = String(formData.get("account") ?? "")
    .trim()
    .toLowerCase();
  const apiKey = String(formData.get("apiKey") ?? "").trim();
  if (!/^[a-z0-9][a-z0-9-]*$/.test(account) || !apiKey) {
    return { error: "invalid_credentials" };
  }

  const baseUrl = `https://${account}.admintotal.com`;
  const erpProducts: ErpProduct[] = [];
  let url: string | null = `${baseUrl}/api/v2/productos/`;
  let truncated = false;
  try {
    while (url) {
      const res = await fetch(url, {
        headers: { "Api-key": apiKey },
        signal: AbortSignal.timeout(15000),
        cache: "no-store",
      });
      if (res.status === 401 || res.status === 403) {
        return { error: "erp_auth" };
      }
      if (!res.ok) return { error: "erp_unreachable" };
      const page = (await res.json()) as {
        next?: string | null;
        results?: ErpProduct[];
      };
      if (!Array.isArray(page.results)) return { error: "erp_invalid_response" };
      erpProducts.push(...page.results);
      if (erpProducts.length >= MAX_PRODUCTS) {
        truncated = erpProducts.length > MAX_PRODUCTS || page.next != null;
        erpProducts.length = Math.min(erpProducts.length, MAX_PRODUCTS);
        break;
      }
      // Solo seguimos la paginación dentro del mismo dominio de la cuenta.
      url =
        typeof page.next === "string" && page.next.startsWith(`${baseUrl}/`)
          ? page.next
          : null;
    }
  } catch {
    return { error: "erp_unreachable" };
  }
  if (erpProducts.length === 0) return { error: "erp_empty" };

  const [types, units, taxes, existing] = await Promise.all([
    db.productType.findMany(),
    db.unit.findMany(),
    db.tax.findMany(),
    db.productCatalog.findMany({
      where: { companyId },
      select: { internalCode: true },
    }),
  ]);

  const type = types.find((t) => t.name === "Product") ?? types[0];
  const typeUnits = units.filter((u) => u.productTypeId === type?.id);
  const fallbackUnit =
    typeUnits.find((u) => /pieza|piece/i.test(u.name)) ?? typeUnits[0];
  // Impuesto por omisión: IVA 16%; los productos se pueden editar después.
  const iva =
    taxes.find(
      (t) =>
        t.taxName.toUpperCase().includes("IVA") &&
        Number(t.taxRate) === DEFAULT_IVA_RATE,
    ) ?? taxes.find((t) => t.taxRate !== null && Number(t.taxRate) > 0);
  if (!type || !fallbackUnit || !iva) return { error: "erp_not_configured" };

  const seen = new Set(existing.map((p) => p.internalCode.toLowerCase()));
  const errors: { code: string; reason: string }[] = [];
  let created = 0;
  let skipped = 0;

  for (const p of erpProducts) {
    const codigo = (p.codigo ?? "").toString().trim();
    const descripcion = (p.descripcion ?? "").toString().trim();
    if (!codigo || !descripcion) {
      errors.push({ code: codigo || "?", reason: "missing_fields" });
      continue;
    }
    if (seen.has(codigo.toLowerCase())) {
      skipped++;
      continue;
    }
    const price = Number(p.precio ?? 0);
    if (!Number.isFinite(price) || price < 0) {
      errors.push({ code: codigo, reason: "invalid_price" });
      continue;
    }

    const unitName = erpUnitName(p.unidad).toLowerCase();
    const unit =
      typeUnits.find(
        (u) =>
          u.name.toLowerCase() === unitName ||
          u.abbreviation.toLowerCase() === unitName,
      ) ?? fallbackUnit;
    const keywords = descripcion
      .split(/\s+/)
      .filter((w) => w.length > 2)
      .slice(0, 5);

    try {
      await db.productCatalog.create({
        data: {
          companyId,
          createdBy: userId,
          productTypeId: type.id,
          unitId: unit.id,
          name: descripcion.slice(0, 5000),
          brand: (p.marca ?? "").toString().trim() || null,
          internalCode: codigo.slice(0, 255),
          externalCode: p.id != null ? String(p.id).slice(0, 255) : null,
          price: new Prisma.Decimal(price.toFixed(2)),
          image:
            typeof p.imagen_url === "string" &&
            p.imagen_url.startsWith("https://") &&
            p.imagen_url.length <= 255
              ? p.imagen_url
              : null,
          keywords: keywords.length > 0 ? keywords : [codigo],
          productCatalogTaxes: {
            create: [{ taxId: iva.id, taxRate: iva.taxRate ?? 0 }],
          },
        },
      });
      seen.add(codigo.toLowerCase());
      created++;
    } catch (e) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === "P2002"
      ) {
        skipped++;
      } else {
        errors.push({ code: codigo, reason: "unknown_error" });
      }
    }
  }

  revalidatePath("/products/catalog");
  revalidatePath("/biddings/new");
  return { created, skipped, truncated, errors };
}
