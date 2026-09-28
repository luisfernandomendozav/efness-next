import { auth } from "@/server/auth";
import { db } from "@/server/db";
import { toCsv } from "@/server/product-csv";

// Exporta el catálogo propio en CSV; también para el superadmin, igual que
// la pantalla de catálogo (feedback presentación 2026-09-26, lámina 7).
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return new Response("Unauthorized", { status: 401 });

  const products = await db.productCatalog.findMany({
    where: { createdBy: Number(session.user.id) },
    include: {
      productType: { select: { name: true } },
      unit: { select: { name: true } },
      productCatalogTaxes: { include: { tax: { select: { taxName: true } } } },
    },
    orderBy: { id: "asc" },
  });

  const csv = toCsv(
    products.map((p) => [
      p.productType.name,
      p.name,
      p.brand ?? "",
      p.internalCode,
      p.externalCode ?? "",
      p.satKey ?? "",
      p.unit.name,
      p.price.toFixed(2),
      (Array.isArray(p.keywords) ? (p.keywords as string[]) : []).join("|"),
      p.productCatalogTaxes
        .map((t) => `${t.tax.taxName}:${Number(t.taxRate)}`)
        .join("|"),
    ]),
  );

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="catalogo-productos.csv"`,
    },
  });
}
