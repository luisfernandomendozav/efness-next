"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { Prisma } from "@/generated/prisma/client";
import { auth } from "@/server/auth";
import { db } from "@/server/db";

const SELLER_TYPE_ID = 1;

export type QuoteActionState = { error?: string } | undefined;

const quoteSchema = z.object({
  biddingId: z.coerce.number().int().min(1),
  costShipping: z.coerce.number().min(0).optional(),
  products: z
    .array(
      z.object({
        biddingProductId: z.number().int().min(1),
        price: z.number().gt(0),
      }),
    )
    .min(1),
});

// Folio COT-AAAA00001 por empresa y año, mismo esquema que las requisiciones
// (tabla company_folio_numbers, entityType "quote").
async function nextQuoteNumber(
  tx: Prisma.TransactionClient,
  companyId: number,
) {
  const year = new Date().getFullYear();
  const folio = await tx.companyFolioNumber.upsert({
    where: {
      companyId_year_entityType: { companyId, year, entityType: "quote" },
    },
    create: { companyId, year, entityType: "quote", lastNumber: 1 },
    update: { lastNumber: { increment: 1 } },
  });
  return `COT-${year}${String(folio.lastNumber).padStart(5, "0")}`;
}

export async function createQuoteAction(
  _prev: QuoteActionState,
  formData: FormData,
): Promise<QuoteActionState> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("unauthenticated");
  const userId = Number(session.user.id);
  const companyId = session.user.companyId;
  if (!companyId || session.user.userTypeId !== SELLER_TYPE_ID) {
    return { error: "not_allowed" };
  }

  const parsed = quoteSchema.safeParse({
    biddingId: formData.get("biddingId"),
    costShipping: formData.get("costShipping") || undefined,
    products: JSON.parse(String(formData.get("products") ?? "[]")),
  });
  if (!parsed.success) return { error: "invalid_quote" };
  const data = parsed.data;

  const bidding = await db.bidding.findUnique({
    where: { id: data.biddingId },
    include: {
      creator: { select: { companyId: true } },
      biddingProducts: { include: { biddingProductTaxes: true } },
      biddingCompanyStatuses: { where: { companyId }, select: { id: true } },
      quotes: { where: { companyId }, select: { id: true } },
    },
  });
  if (!bidding) return { error: "not_available" };

  const expired =
    bidding.deadline !== null && bidding.deadline < new Date();
  if (
    !["open", "quoted"].includes(bidding.status) ||
    expired ||
    bidding.creator.companyId === companyId ||
    bidding.biddingCompanyStatuses.length > 0 ||
    bidding.quotes.length > 0
  ) {
    return { error: "not_available" };
  }

  // La cotización debe cubrir exactamente las partidas de la requisición.
  const priceById = new Map(
    data.products.map((p) => [p.biddingProductId, p.price]),
  );
  if (
    priceById.size !== bidding.biddingProducts.length ||
    !bidding.biddingProducts.every((bp) => priceById.has(bp.id))
  ) {
    return { error: "price_required" };
  }

  const round = (d: Prisma.Decimal) => d.toDecimalPlaces(2);
  const lines = bidding.biddingProducts.map((bp) => {
    const price = new Prisma.Decimal(priceById.get(bp.id)!);
    const subtotal = round(price.mul(bp.quantity));
    const rateSum = bp.biddingProductTaxes.reduce(
      (sum, t) => sum.add(t.taxRate),
      new Prisma.Decimal(0),
    );
    const totalTaxes = round(subtotal.mul(rateSum).div(100));
    return {
      biddingProductId: bp.id,
      productCatalogId: bp.productCatalogId,
      quantity: bp.quantity,
      price: round(price),
      totalTaxes,
      total: subtotal.add(totalTaxes),
      taxes: bp.biddingProductTaxes.map((t) => ({
        taxId: t.taxId,
        taxRate: t.taxRate,
      })),
      subtotal,
    };
  });

  const zero = new Prisma.Decimal(0);
  const subtotal = lines.reduce((s, l) => s.add(l.subtotal), zero);
  const totalTaxes = lines.reduce((s, l) => s.add(l.totalTaxes), zero);
  const costShipping =
    bidding.deliveryType === "shipping" && data.costShipping !== undefined
      ? round(new Prisma.Decimal(data.costShipping))
      : null;
  const total = subtotal.add(totalTaxes).add(costShipping ?? zero);

  await db.$transaction(async (tx) => {
    const quoteNumber = await nextQuoteNumber(tx, companyId);
    await tx.quote.create({
      data: {
        biddingId: bidding.id,
        quoteNumber,
        userId,
        companyId,
        subtotal,
        totalTaxes,
        total,
        currency: bidding.currency,
        costShipping,
        deliveryDate: bidding.deliveryDate,
        deliveryType: bidding.deliveryType,
        quoteProducts: {
          create: lines.map((l) => ({
            biddingProductId: l.biddingProductId,
            productCatalogId: l.productCatalogId,
            quantity: l.quantity,
            price: l.price,
            totalTaxes: l.totalTaxes,
            total: l.total,
            quoteProductTaxes: { create: l.taxes },
          })),
        },
      },
    });
    await tx.biddingCompanyStatus.create({
      data: { biddingId: bidding.id, companyId, status: "quoted" },
    });
    // La requisición pasa a "cotizada" globalmente con la primera cotización;
    // para otros vendedores sigue apareciendo como abierta (displayStatus).
    if (bidding.status === "open") {
      await tx.bidding.update({
        where: { id: bidding.id },
        data: { status: "quoted" },
      });
    }
  });

  revalidatePath("/biddings");
  redirect("/biddings/quoted");
}
