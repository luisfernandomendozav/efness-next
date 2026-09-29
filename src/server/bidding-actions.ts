"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { after } from "next/server";
import { z } from "zod";
import { Prisma } from "@/generated/prisma/client";
import { auth } from "@/server/auth";
import { db } from "@/server/db";
import { notifyNewBidding } from "@/server/services/notifications";

const SUPERADMIN_ROLE_ID = 1;

export type BiddingActionState = { error?: string } | undefined;

const biddingSchema = z
  .object({
    categoryId: z.coerce.number().int().min(1),
    currency: z.enum(["MXN", "USD", "EUR"]),
    deliveryType: z.enum(["shipping", "open_to_origin"]),
    addressId: z.coerce.number().int().optional(),
    deadline: z.coerce.date(),
    deliveryDate: z.coerce.date(),
    description: z.string().trim().max(255).optional(),
    notes: z.string().trim().max(5000).optional(),
    products: z
      .array(
        z.object({
          productCatalogId: z.number().int().min(1),
          quantity: z.number().int().min(1),
          comments: z.string().trim().max(1000).optional(),
        }),
      )
      .min(1),
  })
  .refine((d) => d.deliveryDate > d.deadline, { message: "delivery_date" })
  .refine((d) => d.deliveryType !== "shipping" || d.addressId, {
    message: "address_required",
  });

// Folio REQ-AAAA00001 por empresa y año, como GeneratesFolioNumbers del
// backend legacy (tabla company_folio_numbers).
async function nextBiddingNumber(
  tx: Prisma.TransactionClient,
  companyId: number,
) {
  const year = new Date().getFullYear();
  const folio = await tx.companyFolioNumber.upsert({
    where: {
      companyId_year_entityType: {
        companyId,
        year,
        entityType: "bidding",
      },
    },
    create: { companyId, year, entityType: "bidding", lastNumber: 1 },
    update: { lastNumber: { increment: 1 } },
  });
  return `REQ-${year}${String(folio.lastNumber).padStart(5, "0")}`;
}

export async function createBiddingAction(
  _prev: BiddingActionState,
  formData: FormData,
): Promise<BiddingActionState> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("unauthenticated");
  const userId = Number(session.user.id);
  const companyId = session.user.companyId;
  if (!companyId) return { error: "no_company" };

  const parsed = biddingSchema.safeParse({
    categoryId: formData.get("categoryId"),
    currency: formData.get("currency"),
    deliveryType: formData.get("deliveryType"),
    addressId: formData.get("addressId") || undefined,
    deadline: formData.get("deadline"),
    deliveryDate: formData.get("deliveryDate"),
    description: formData.get("description") || undefined,
    notes: formData.get("notes") || undefined,
    products: JSON.parse(String(formData.get("products") ?? "[]")),
  });
  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message;
    if (message === "delivery_date") return { error: "delivery_date" };
    if (message === "address_required") return { error: "address_required" };
    return { error: "invalid_bidding" };
  }
  const data = parsed.data;

  // Solo direcciones propias y productos del catálogo propio.
  if (data.deliveryType === "shipping") {
    const address = await db.userAddress.findFirst({
      where: { id: data.addressId, userId, deletedAt: null },
    });
    if (!address) return { error: "address_required" };
  }
  const products = await db.productCatalog.findMany({
    where: {
      id: { in: data.products.map((p) => p.productCatalogId) },
      createdBy: userId,
    },
    include: { productCatalogTaxes: true },
  });
  if (products.length !== data.products.length) {
    return { error: "invalid_bidding" };
  }

  const bidding = await db.$transaction(async (tx) => {
    const biddingNumber = await nextBiddingNumber(tx, companyId);
    const zero = new Prisma.Decimal(0);
    return tx.bidding.create({
      data: {
        biddingNumber,
        createdBy: userId,
        categoryId: data.categoryId,
        currency: data.currency,
        deliveryType: data.deliveryType,
        addressId: data.deliveryType === "shipping" ? data.addressId : null,
        deadline: data.deadline,
        deliveryDate: data.deliveryDate,
        description: data.description ?? null,
        notes: data.notes ?? null,
        status: "open",
        costShipping: zero,
        subtotal: zero,
        totalTaxes: zero,
        total: zero,
        biddingProducts: {
          create: data.products.map((p) => {
            const catalog = products.find(
              (c) => c.id === p.productCatalogId,
            )!;
            return {
              productCatalogId: p.productCatalogId,
              name: catalog.name,
              quantity: p.quantity,
              comments: p.comments ?? null,
              // Los impuestos de la partida se copian del producto de
              // catálogo, como el flujo de creación del legacy.
              biddingProductTaxes: {
                create: catalog.productCatalogTaxes.map((tax) => ({
                  taxId: tax.taxId,
                  taxRate: tax.taxRate,
                })),
              },
            };
          }),
        },
      },
    });
  });

  // Aviso por correo a los proveedores que coinciden (SendGrid), después de
  // responder, como el job de notificaciones del legacy.
  after(() => notifyNewBidding(bidding.id));

  revalidatePath("/biddings");
  redirect("/biddings/active");
}

export async function deleteBiddingAction(biddingId: number) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("unauthenticated");

  const bidding = await db.bidding.findUnique({
    where: { id: biddingId },
    select: { createdBy: true },
  });
  if (!bidding) return;

  // Solo el creador (o el superadmin) puede borrar; alineado con el listado,
  // que ya solo muestra las requisiciones propias.
  const isSuperadmin = session.user.roleId === SUPERADMIN_ROLE_ID;
  if (!isSuperadmin && bidding.createdBy !== Number(session.user.id)) return;

  await db.bidding.delete({ where: { id: biddingId } });
  revalidatePath("/biddings");
}
