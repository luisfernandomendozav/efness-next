import Link from "next/link";
import { Download, Package } from "lucide-react";
import { getLocale } from "next-intl/server";
import { getT } from "@/i18n/get-t";
import { auth } from "@/server/auth";
import {
  getProductLookups,
  getProducts,
  type ProductsViewer,
} from "@/server/products";
import { DeleteProductButton } from "@/components/products/delete-product-button";
import { ImportErpDialog } from "@/components/products/import-erp-dialog";
import { ImportProductsDialog } from "@/components/products/import-products-dialog";
import { ProductFormDialog } from "@/components/products/product-form-dialog";
import { TableSearch } from "@/components/table-search";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

export default async function ProductCatalogPage({
  searchParams,
}: PageProps<"/products/catalog">) {
  const [t, locale, session, query] = await Promise.all([
    getT(),
    getLocale(),
    auth(),
    searchParams,
  ]);

  const viewer: ProductsViewer = {
    userId: Number(session!.user.id),
    companyId: session!.user.companyId,
  };
  const search = typeof query.search === "string" ? query.search : "";
  const page = Math.max(1, Number(query.page) || 1);

  const [{ products, total, pageCount, lastUpdatedAt }, lookups] =
    await Promise.all([getProducts(viewer, search, page), getProductLookups()]);

  const dateFmt = new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
  const canCreate = session!.user.companyId !== null;
  const qs = (p: number) =>
    `?${new URLSearchParams({ ...(search ? { search } : {}), page: String(p) })}`;

  return (
    <div className="mx-auto max-w-7xl space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t("Catalog")}</h1>
        <div className="flex items-center gap-2">
          <Button variant="secondary" asChild>
            <a href="/products/catalog/export" download>
              <Download className="mr-1 h-4 w-4" />
              {t("Export")}
            </a>
          </Button>
          {canCreate && <ImportErpDialog />}
          {canCreate && <ImportProductsDialog />}
          {canCreate && <ProductFormDialog lookups={lookups} />}
        </div>
      </div>
      <Card>
        <CardContent className="space-y-4">
          {/* Fecha de última actualización junto al buscador
              (feedback presentación 2026-09-26, lámina 7). */}
          <div className="flex flex-wrap items-center gap-3">
            <TableSearch placeholder="Search product" />
            <span className="text-sm text-muted-foreground">
              {t("Last updated")}:{" "}
              {lastUpdatedAt ? dateFmt.format(new Date(lastUpdatedAt)) : "—"}
            </span>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("Image")}</TableHead>
                  <TableHead>{t("Name")}</TableHead>
                  <TableHead>{t("Brand")}</TableHead>
                  <TableHead>{t("Internal code")}</TableHead>
                  <TableHead>{t("External code")}</TableHead>
                  <TableHead>{t("SAT key")}</TableHead>
                  <TableHead>{t("Type")}</TableHead>
                  <TableHead>{t("Unit")}</TableHead>
                  <TableHead className="text-right">{t("Price")}</TableHead>
                  <TableHead>{t("Taxes")}</TableHead>
                  <TableHead>{t("Technical sheet")}</TableHead>
                  <TableHead className="text-right">{t("Actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>
                      <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-md bg-muted">
                        {p.image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={p.image}
                            alt={p.name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <Package className="h-5 w-5 text-muted-foreground" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell
                      className="max-w-56 truncate font-medium"
                      title={p.name}
                    >
                      {p.name}
                    </TableCell>
                    <TableCell>{p.brand || "N/A"}</TableCell>
                    <TableCell>{p.internalCode}</TableCell>
                    <TableCell>{p.externalCode || "N/A"}</TableCell>
                    <TableCell>{p.satKey || "N/A"}</TableCell>
                    <TableCell>{t(p.typeName)}</TableCell>
                    <TableCell>{t(p.unitName)}</TableCell>
                    <TableCell className="text-right font-medium">
                      ${p.price}
                    </TableCell>
                    <TableCell>
                      <div className="flex max-w-40 flex-wrap gap-1">
                        {p.taxes.map((tax) => (
                          <Badge
                            key={tax.name}
                            variant="secondary"
                            className="text-xs"
                          >
                            {tax.name} {tax.rate}%
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      {p.technicalSheet ? (
                        <Button
                          variant="secondary"
                          size="sm"
                          className="h-8 w-8 p-0"
                          asChild
                        >
                          <a
                            href={p.technicalSheet}
                            target="_blank"
                            rel="noreferrer"
                          >
                            <Download className="h-4 w-4" />
                          </a>
                        </Button>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end">
                        <ProductFormDialog lookups={lookups} product={p} />
                        <DeleteProductButton
                          productId={p.id}
                          productName={p.name}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {products.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={12}
                      className="py-10 text-center text-muted-foreground"
                    >
                      {t("No matching records found")}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          {pageCount > 1 && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                {total} · {page}/{pageCount}
              </span>
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  asChild
                  className={cn(page <= 1 && "pointer-events-none opacity-50")}
                >
                  <Link href={qs(page - 1)}>{t("Previous")}</Link>
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  asChild
                  className={cn(
                    page >= pageCount && "pointer-events-none opacity-50",
                  )}
                >
                  <Link href={qs(page + 1)}>{t("Next")}</Link>
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
