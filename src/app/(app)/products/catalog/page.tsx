import Link from "next/link";
import { Package } from "lucide-react";
import { getT } from "@/i18n/get-t";
import { auth } from "@/server/auth";
import {
  getProductLookups,
  getProducts,
  type ProductsViewer,
} from "@/server/products";
import { DeleteProductButton } from "@/components/products/delete-product-button";
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

const SUPERADMIN_ROLE_ID = 1;

export default async function ProductCatalogPage({
  searchParams,
}: PageProps<"/products/catalog">) {
  const [t, session, query] = await Promise.all([
    getT(),
    auth(),
    searchParams,
  ]);

  const viewer: ProductsViewer = {
    companyId: session!.user.companyId,
    isSuperadmin: session!.user.roleId === SUPERADMIN_ROLE_ID,
  };
  const search = typeof query.search === "string" ? query.search : "";
  const page = Math.max(1, Number(query.page) || 1);

  const [{ products, total, pageCount }, lookups] = await Promise.all([
    getProducts(viewer, search, page),
    getProductLookups(),
  ]);

  const showCompany = viewer.isSuperadmin || viewer.companyId === null;
  const canCreate = session!.user.companyId !== null;
  const qs = (p: number) =>
    `?${new URLSearchParams({ ...(search ? { search } : {}), page: String(p) })}`;

  return (
    <div className="mx-auto max-w-7xl space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t("Catalog")}</h1>
        {canCreate && <ProductFormDialog lookups={lookups} />}
      </div>
      <Card>
        <CardContent className="space-y-4">
          <TableSearch placeholder="Search product" />
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("Image")}</TableHead>
                  <TableHead>{t("Name")}</TableHead>
                  {showCompany && <TableHead>{t("Company")}</TableHead>}
                  <TableHead>{t("Brand")}</TableHead>
                  <TableHead>{t("Internal code")}</TableHead>
                  <TableHead>{t("External code")}</TableHead>
                  <TableHead>{t("SAT key")}</TableHead>
                  <TableHead>{t("Type")}</TableHead>
                  <TableHead>{t("Unit")}</TableHead>
                  <TableHead className="text-right">{t("Price")}</TableHead>
                  <TableHead>{t("Taxes")}</TableHead>
                  <TableHead className="text-right">{t("Actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>
                      <div className="flex h-10 w-10 items-center justify-center rounded-md bg-muted">
                        <Package className="h-5 w-5 text-muted-foreground" />
                      </div>
                    </TableCell>
                    <TableCell
                      className="max-w-56 truncate font-medium"
                      title={p.name}
                    >
                      {p.name}
                    </TableCell>
                    {showCompany && <TableCell>{p.companyName}</TableCell>}
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
                      colSpan={showCompany ? 12 : 11}
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
