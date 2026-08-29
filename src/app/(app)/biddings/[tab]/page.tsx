import Link from "next/link";
import { redirect } from "next/navigation";
import { getT } from "@/i18n/get-t";
import { auth } from "@/server/auth";
import {
  BIDDINGS_PAGE_SIZE,
  getBiddings,
  tabsForViewer,
  type BiddingsTab,
  type BiddingsViewer,
  type StatusVariant,
} from "@/server/biddings";
import { BiddingsSearch } from "@/components/biddings/biddings-search";
import { DeleteBiddingButton } from "@/components/biddings/delete-bidding-button";
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
const SELLER_TYPE_ID = 1;

const TAB_LABELS: Record<BiddingsTab, string> = {
  active: "Active",
  assigned: "Assigned",
  quoted: "Quoted",
  closed: "Closed",
};

const DELIVERY_TYPE_LABELS: Record<string, string> = {
  shipping: "Shipping",
  open_to_origin: "Open to origin",
};

const BADGE_CLASSES: Record<StatusVariant, string> = {
  success: "bg-[#dfffea] text-[#569842]",
  warning: "bg-amber-100 text-amber-700",
  danger: "bg-[#ffeef3] text-[#f8285a]",
  info: "bg-sky-100 text-sky-700",
};

export default async function BiddingsTabPage({
  params,
  searchParams,
}: PageProps<"/biddings/[tab]">) {
  const [t, session, { tab }, query] = await Promise.all([
    getT(),
    auth(),
    params,
    searchParams,
  ]);

  const viewer: BiddingsViewer = {
    userId: Number(session!.user.id),
    companyId: session!.user.companyId,
    isSeller: session!.user.userTypeId === SELLER_TYPE_ID,
    isSuperadmin: session!.user.roleId === SUPERADMIN_ROLE_ID,
  };
  const tabs = tabsForViewer(viewer);
  if (!tabs.includes(tab as BiddingsTab)) redirect("/biddings/active");
  const activeTab = tab as BiddingsTab;

  const search = typeof query.search === "string" ? query.search : "";
  const page = Math.max(1, Number(query.page) || 1);
  const { biddings, total, pageCount } = await getBiddings(
    viewer,
    activeTab,
    search,
    page,
  );

  const isSellerView = viewer.isSeller;
  const qs = (p: number) =>
    `?${new URLSearchParams({ ...(search ? { search } : {}), page: String(p) })}`;

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t("Biddings")}</h1>
      </div>
      <div className="flex gap-1 border-b">
        {tabs.map((tabKey) => (
          <Link
            key={tabKey}
            href={`/biddings/${tabKey}`}
            className={cn(
              "border-b-2 px-4 py-2 text-sm font-semibold transition-colors",
              tabKey === activeTab
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {t(TAB_LABELS[tabKey])}
          </Link>
        ))}
      </div>
      <Card>
        <CardContent className="space-y-4">
          <BiddingsSearch />
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("Bidding #")}</TableHead>
                <TableHead>
                  {isSellerView ? t("Company") : t("Created by")}
                </TableHead>
                <TableHead>{t("Delivery type")}</TableHead>
                <TableHead>{t("Delivery address")}</TableHead>
                <TableHead>{t("Currency")}</TableHead>
                <TableHead>{t("Place of origin")}</TableHead>
                <TableHead>{t("Status")}</TableHead>
                <TableHead className="text-right">{t("Actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {biddings.map((b) => (
                <TableRow key={b.id}>
                  <TableCell className="font-semibold">
                    {b.biddingNumber}
                  </TableCell>
                  <TableCell>
                    {isSellerView ? b.companyName : b.createdByName}
                  </TableCell>
                  <TableCell>
                    {t(DELIVERY_TYPE_LABELS[b.deliveryType] ?? b.deliveryType)}
                  </TableCell>
                  <TableCell className="max-w-56 truncate" title={b.address}>
                    {b.address || "—"}
                  </TableCell>
                  <TableCell>{b.currency}</TableCell>
                  <TableCell>{b.placeOfOrigin || "—"}</TableCell>
                  <TableCell>
                    <Badge className={BADGE_CLASSES[b.status.variant]}>
                      {t(b.status.key)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {b.canDelete ? (
                      <DeleteBiddingButton
                        biddingId={b.id}
                        biddingNumber={b.biddingNumber}
                      />
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {biddings.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="py-10 text-center text-muted-foreground"
                  >
                    {t("No results found")}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
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
