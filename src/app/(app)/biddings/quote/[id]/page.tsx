import { redirect } from "next/navigation";
import { getT } from "@/i18n/get-t";
import { auth } from "@/server/auth";
import { getBiddingForQuote, type BiddingsViewer } from "@/server/biddings";
import { QuoteForm } from "@/components/biddings/quote-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const SUPERADMIN_ROLE_ID = 1;
const SELLER_TYPE_ID = 1;

const DELIVERY_TYPE_LABELS: Record<string, string> = {
  shipping: "Shipping",
  open_to_origin: "Open to origin",
};

export default async function QuoteBiddingPage({
  params,
}: PageProps<"/biddings/quote/[id]">) {
  const [t, session, { id }] = await Promise.all([getT(), auth(), params]);

  const viewer: BiddingsViewer = {
    userId: Number(session!.user.id),
    companyId: session!.user.companyId,
    isSeller: session!.user.userTypeId === SELLER_TYPE_ID,
    isSuperadmin: session!.user.roleId === SUPERADMIN_ROLE_ID,
  };
  const bidding = await getBiddingForQuote(viewer, Number(id));
  if (!bidding) redirect("/biddings/active");

  const info: [string, string][] = [
    [t("Company"), bidding.companyName],
    [t("Category"), t(bidding.categoryName)],
    [t("Currency"), bidding.currency],
    [t("Deadline"), bidding.deadline || "—"],
    [t("Delivery date"), bidding.deliveryDate || "—"],
    [
      t("Delivery type"),
      t(DELIVERY_TYPE_LABELS[bidding.deliveryType] ?? bidding.deliveryType),
    ],
    ...(bidding.address
      ? ([[t("Delivery address"), bidding.address]] as [string, string][])
      : []),
    ...(bidding.description
      ? ([[t("Description"), bidding.description]] as [string, string][])
      : []),
    ...(bidding.notes
      ? ([[t("Notes"), bidding.notes]] as [string, string][])
      : []),
  ];

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <h1 className="text-2xl font-bold">
        {t("Quote bidding")} {bidding.biddingNumber}
      </h1>
      <Card>
        <CardHeader>
          <CardTitle>{t("General data")}</CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <dl className="grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
            {info.map(([label, value]) => (
              <div key={label}>
                <dt className="text-muted-foreground">{label}</dt>
                <dd className="font-medium">{value}</dd>
              </div>
            ))}
          </dl>
        </CardContent>
      </Card>
      <QuoteForm bidding={bidding} />
    </div>
  );
}
