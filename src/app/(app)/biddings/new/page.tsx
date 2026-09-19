import { redirect } from "next/navigation";
import { getT } from "@/i18n/get-t";
import { auth } from "@/server/auth";
import { db } from "@/server/db";
import { getDeliveryAddresses } from "@/server/account-data";
import { getProductLookups } from "@/server/products";
import { BiddingForm } from "@/components/biddings/bidding-form";

const SELLER_TYPE_ID = 1;

export default async function NewBiddingPage() {
  const [t, session] = await Promise.all([getT(), auth()]);
  const userId = Number(session!.user.id);
  // Solo los compradores generan requisiciones, como el legacy.
  if (session!.user.userTypeId === SELLER_TYPE_ID) redirect("/biddings/active");

  const [categories, addresses, products, lookups] = await Promise.all([
    db.category.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    getDeliveryAddresses(userId),
    db.productCatalog.findMany({
      where: { createdBy: userId },
      select: {
        id: true,
        name: true,
        internalCode: true,
        unit: { select: { name: true } },
      },
      orderBy: { name: "asc" },
    }),
    getProductLookups(),
  ]);

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <h1 className="text-2xl font-bold">{t("Add bidding")}</h1>
      <BiddingForm
        categories={categories}
        addresses={addresses.map((a) => ({
          id: a.id,
          label: `${a.street} ${a.outdoorNumber}, ${a.city}, ${a.state}, ${a.country}`,
        }))}
        products={products.map((p) => ({
          id: p.id,
          name: p.name,
          internalCode: p.internalCode,
          unitName: p.unit.name,
        }))}
        lookups={lookups}
      />
    </div>
  );
}
