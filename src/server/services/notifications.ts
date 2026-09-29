import { db } from "@/server/db";
import { sendEmail } from "@/server/services/email";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

// Réplica de BiddingController::sendNotificationNewBidding +
// EmailNotificationStrategy del backend legacy: al crear una requisición se
// avisa por correo (SendGrid) a los proveedores cuyo giro y zona geográfica
// coinciden, respetando su preferencia del canal "mail" (suscritos por
// defecto, igual que la pestaña Suscripción de la cuenta). Cada envío se
// registra en la tabla notifications como hacía NotificationLogger.
// Los demás canales del legacy (sms, push, in-app, whatsapp) siguen
// pendientes.

type BiddingForNotify = NonNullable<
  Awaited<ReturnType<typeof loadBidding>>
>;

function loadBidding(biddingId: number) {
  return db.bidding.findUnique({
    where: { id: biddingId },
    select: {
      id: true,
      biddingNumber: true,
      createdBy: true,
      categoryId: true,
      deliveryType: true,
      address: {
        select: { countryId: true, stateId: true, city: true },
      },
      creator: { select: { companyId: true } },
    },
  });
}

// El mismo criterio que sellerActiveExtras (biddings.ts) pero invertido:
// dada la requisición, decidir si el proveedor la vería en "Activas".
function supplierMatches(
  bidding: BiddingForNotify,
  categoryIds: number[],
  scopes: Array<{
    countryId: number;
    stateId: number | null;
    cityName: string | null;
    level: string;
  }>,
) {
  if (
    categoryIds.length > 0 &&
    (bidding.categoryId === null || !categoryIds.includes(bidding.categoryId))
  ) {
    return false;
  }
  if (scopes.length === 0 || bidding.deliveryType !== "shipping") return true;
  const address = bidding.address;
  if (!address) return false;
  return scopes.some((s) => {
    if (s.countryId !== address.countryId) return false;
    if (s.level === "country") return true;
    if (s.stateId !== address.stateId) return false;
    if (s.level === "state") return true;
    return (
      (s.cityName ?? "").toLowerCase() === (address.city ?? "").toLowerCase()
    );
  });
}

function emailContent(
  bidding: BiddingForNotify,
  user: { name: string; lastName: string; language: string },
) {
  const quoteUrl = `${APP_URL}/biddings/quote/${bidding.id}`;
  const logoUrl = `${APP_URL}/efness-logo-color.svg`;
  const fullName = `${user.name} ${user.lastName}`.trim();

  if (user.language !== "es") {
    return {
      subject: `You received a new quote request. ${bidding.biddingNumber}`,
      html: `<p>Hello ${fullName}.</p><p>You have received a new requisition in EFNESS, <a href="${quoteUrl}">quote here</a>.</p><p><img src="${logoUrl}" alt="efness" width="140"/></p>`,
    };
  }
  return {
    subject: `Recibiste una nueva requisición de cotización. ${bidding.biddingNumber}`,
    html: `<p>Hola ${fullName}.</p><p>Has recibido una nueva requisición en EFNESS, <a href="${quoteUrl}">cotiza aquí</a>.</p><p><img src="${logoUrl}" alt="efness" width="140"/></p>`,
  };
}

export async function notifyNewBidding(biddingId: number) {
  const bidding = await loadBidding(biddingId);
  if (!bidding) return;

  const [mailChannel, biddingCategory, suppliers] = await Promise.all([
    db.notificationChannel.findFirst({
      where: { name: "mail", active: true },
      select: { id: true },
    }),
    db.messageCategory.findFirst({
      where: { name: "bidding" },
      select: { id: true },
    }),
    db.user.findMany({
      where: {
        accountStatus: "active",
        userTypeId: 1, // proveedores
        id: { not: bidding.createdBy },
        ...(bidding.creator.companyId !== null
          ? {
              OR: [
                { companyId: null },
                { companyId: { not: bidding.creator.companyId } },
              ],
            }
          : {}),
      },
      select: {
        id: true,
        name: true,
        lastName: true,
        email: true,
        language: true,
        userCategories: { select: { categoryId: true } },
        sellerGeographicScopes: {
          where: { scopeType: "include" },
          select: {
            countryId: true,
            stateId: true,
            cityName: true,
            level: true,
          },
        },
        userNotificationChannels: {
          where: { notificationChannel: { name: "mail" } },
          select: { subscriptionStatus: true },
        },
      },
    }),
  ]);
  if (!mailChannel) return;

  const recipients = suppliers.filter(
    (u) =>
      // Suscrito al canal de correo (por defecto sí, sin fila explícita).
      (u.userNotificationChannels[0]?.subscriptionStatus ?? true) &&
      supplierMatches(
        bidding,
        u.userCategories.map((c) => c.categoryId),
        u.sellerGeographicScopes,
      ),
  );

  for (const user of recipients) {
    const { subject, html } = emailContent(bidding, user);
    let sent = false;
    try {
      sent = await sendEmail({
        to: user.email,
        toName: `${user.name} ${user.lastName}`.trim(),
        subject,
        html,
      });
    } catch (error) {
      console.error(`Error notificando bidding a usuario ${user.id}:`, error);
    }
    if (biddingCategory) {
      await db.notification.create({
        data: {
          userId: user.id,
          userName: user.name,
          userLastName: user.lastName,
          userEmail: user.email,
          messageCategoryId: biddingCategory.id,
          notificationChannelId: mailChannel.id,
          message: subject,
          data: {
            type: "bidding",
            biddingId: bidding.id,
            biddingNumber: bidding.biddingNumber,
          },
          type: "bidding",
          sendStatus: sent ? "sent" : "failed",
          senderId: bidding.createdBy,
        },
      });
    }
  }
}
