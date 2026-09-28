import { auth } from "@/server/auth";
import { toCsv } from "@/server/product-csv";

// Formato en blanco para el importador de catálogo (feedback presentación
// 2026-09-26, lámina 9): solo los encabezados y una fila de ejemplo, listo
// para llenar en Excel e importar.
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return new Response("Unauthorized", { status: 401 });

  const csv = toCsv([
    [
      "Producto",
      "Ejemplo de producto",
      "Marca ejemplo",
      "COD-001",
      "",
      "",
      "Pieza",
      "100.00",
      "palabra1|palabra2",
      "IVA 16%:16",
    ],
  ]);

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="formato-catalogo.csv"`,
    },
  });
}
