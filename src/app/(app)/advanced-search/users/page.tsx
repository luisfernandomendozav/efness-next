import Link from "next/link";
import { Star } from "lucide-react";
import { getT } from "@/i18n/get-t";
import { auth } from "@/server/auth";
import {
  getSearchLookups,
  searchProducts,
  searchUsers,
  type SearchFilters as Filters,
  type SearchViewer,
} from "@/server/search";
import { SearchFilters } from "@/components/search/search-filters";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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

const SELLER_TYPE_ID = 1;

function Rating({ rating, count }: { rating: number; count: number }) {
  return (
    <span className="inline-flex items-center gap-1 text-sm">
      <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
      {rating.toFixed(1)}/5
      <span className="text-muted-foreground">({count})</span>
    </span>
  );
}

export default async function AdvancedSearchPage({
  searchParams,
}: PageProps<"/advanced-search/users">) {
  const [t, session, query] = await Promise.all([
    getT(),
    auth(),
    searchParams,
  ]);

  const viewer: SearchViewer = {
    userId: Number(session!.user.id),
    companyId: session!.user.companyId,
    userTypeId: session!.user.userTypeId,
  };
  const type = query.type === "products" ? "products" : "users";
  const str = (v: unknown) => (typeof v === "string" ? v : "");
  const num = (v: unknown) => (Number(v) > 0 ? Number(v) : null);
  const filters: Filters = {
    search: str(query.search),
    category: num(query.category),
    company: num(query.company),
    productType: num(query.producttype),
    brand: str(query.brand),
    country: str(query.country),
    state: str(query.state),
    city: str(query.city),
    page: Math.max(1, Number(query.page) || 1),
  };

  const targetLabel =
    viewer.userTypeId === SELLER_TYPE_ID ? t("Buyers") : t("Suppliers");

  const [lookups, usersResult, productsResult] = await Promise.all([
    getSearchLookups(),
    type === "users" ? searchUsers(viewer, filters) : null,
    type === "products" ? searchProducts(viewer, filters) : null,
  ]);

  const total = (usersResult ?? productsResult)!.total;
  const pageCount = (usersResult ?? productsResult)!.pageCount;
  const qs = (p: number) => {
    const q = new URLSearchParams();
    for (const [k, v] of Object.entries(query)) {
      if (typeof v === "string" && v) q.set(k, v);
    }
    q.set("page", String(p));
    return `?${q.toString()}`;
  };

  return (
    <div className="mx-auto max-w-7xl space-y-5">
      <h1 className="text-2xl font-bold">{t("Advanced search")}</h1>
      <Card>
        <CardContent className="space-y-5">
          <SearchFilters
            lookups={lookups}
            searchType={type}
            targetLabel={targetLabel}
          />

          {type === "users" && usersResult && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("Name")}</TableHead>
                  <TableHead>{t("Company")}</TableHead>
                  <TableHead>{t("Categories")}</TableHead>
                  <TableHead>{t("Country")}</TableHead>
                  <TableHead>{t("State")}</TableHead>
                  <TableHead>{t("City")}</TableHead>
                  <TableHead>{t("Rating")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {usersResult.users.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          {u.avatar && (
                            <AvatarImage src={u.avatar} alt={u.name} />
                          )}
                          <AvatarFallback>
                            {u.name
                              .split(" ")
                              .map((p) => p[0])
                              .slice(0, 2)
                              .join("")
                              .toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{u.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {u.email}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{u.companyName || "—"}</TableCell>
                    <TableCell>
                      <div className="flex max-w-48 flex-wrap gap-1">
                        {u.categories.slice(0, 3).map((c) => (
                          <Badge
                            key={c}
                            variant="secondary"
                            className="text-xs"
                          >
                            {c}
                          </Badge>
                        ))}
                        {u.categories.length > 3 && (
                          <Badge variant="secondary" className="text-xs">
                            +{u.categories.length - 3}
                          </Badge>
                        )}
                        {u.categories.length === 0 && "—"}
                      </div>
                    </TableCell>
                    <TableCell>{u.country || "—"}</TableCell>
                    <TableCell>{u.state || "—"}</TableCell>
                    <TableCell>{u.city || "—"}</TableCell>
                    <TableCell>
                      <Rating rating={u.rating} count={u.ratingCount} />
                    </TableCell>
                  </TableRow>
                ))}
                {usersResult.users.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="py-10 text-center text-muted-foreground"
                    >
                      {t("No matching records found")}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}

          {type === "products" && productsResult && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("Name")}</TableHead>
                  <TableHead>{t("Brand")}</TableHead>
                  <TableHead className="text-right">{t("Price")}</TableHead>
                  <TableHead>{t("Type")}</TableHead>
                  <TableHead>{t("Company")}</TableHead>
                  <TableHead>{t("Country")}</TableHead>
                  <TableHead>{t("State")}</TableHead>
                  <TableHead>{t("City")}</TableHead>
                  <TableHead>{t("Rating")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {productsResult.products.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell
                      className="max-w-56 truncate font-medium"
                      title={p.name}
                    >
                      {p.name}
                    </TableCell>
                    <TableCell>{p.brand || "N/A"}</TableCell>
                    <TableCell className="text-right">${p.price}</TableCell>
                    <TableCell>{t(p.typeName)}</TableCell>
                    <TableCell>{p.companyName}</TableCell>
                    <TableCell>{p.country || "—"}</TableCell>
                    <TableCell>{p.state || "—"}</TableCell>
                    <TableCell>{p.city || "—"}</TableCell>
                    <TableCell>
                      <Rating rating={p.rating} count={p.ratingCount} />
                    </TableCell>
                  </TableRow>
                ))}
                {productsResult.products.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={9}
                      className="py-10 text-center text-muted-foreground"
                    >
                      {t("No matching records found")}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}

          {pageCount > 1 && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                {total} · {filters.page}/{pageCount}
              </span>
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  asChild
                  className={cn(
                    filters.page <= 1 && "pointer-events-none opacity-50",
                  )}
                >
                  <Link href={qs(filters.page - 1)}>{t("Previous")}</Link>
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  asChild
                  className={cn(
                    filters.page >= pageCount &&
                      "pointer-events-none opacity-50",
                  )}
                >
                  <Link href={qs(filters.page + 1)}>{t("Next")}</Link>
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
