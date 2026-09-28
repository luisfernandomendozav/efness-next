import { db } from "@/server/db";

// Datos de las secciones nuevas de configuración de cuenta
// (feedback notas 2026-09-18): direcciones de entrega, empresa,
// usuarios de la misma empresa y suscripción.

export async function getDeliveryAddresses(userId: number) {
  const rows = await db.userAddress.findMany({
    where: { userId, deletedAt: null },
    orderBy: { id: "asc" },
  });
  return rows.map((a) => ({
    id: a.id,
    countryId: a.countryId,
    stateId: a.stateId,
    country: a.country,
    state: a.state,
    city: a.city,
    street: a.street,
    outdoorNumber: a.outdoorNumber,
    interiorNumber: a.interiorNumber,
    zipCode: a.zipCode,
    addressType: a.addressType,
  }));
}

export type DeliveryAddress = Awaited<
  ReturnType<typeof getDeliveryAddresses>
>[number];

export async function getCompanyDetails(companyId: number | null) {
  if (companyId === null) return null;
  const company = await db.company.findUnique({
    where: { id: companyId },
    select: {
      id: true,
      name: true,
      rfcTaxId: true,
      webSite: true,
      country: true,
      state: true,
      city: true,
      address: true,
      zipCode: true,
      logo: true,
    },
  });
  return company;
}

// Quién es el superadmin de la empresa, para mostrárselo a los demás
// usuarios (feedback presentación 2026-09-26, lámina 3).
export async function getCompanySuperadmin(companyId: number | null) {
  if (companyId === null) return null;
  const user = await db.user.findFirst({
    where: { companyId, roleId: 1 },
    select: { id: true, name: true, lastName: true, email: true },
    orderBy: { id: "asc" },
  });
  if (!user) return null;
  return {
    id: user.id,
    fullName: `${user.name} ${user.lastName}`.trim(),
    email: user.email,
  };
}

export async function getCompanyUsers(
  companyId: number | null,
  excludeUserId: number,
) {
  if (companyId === null) return [];
  const rows = await db.user.findMany({
    where: { companyId, id: { not: excludeUserId } },
    select: {
      id: true,
      name: true,
      lastName: true,
      email: true,
      avatar: true,
      userTypeId: true,
      accountStatus: true,
      createdAt: true,
    },
    orderBy: { name: "asc" },
  });
  return rows.map((u) => ({
    id: u.id,
    fullName: `${u.name} ${u.lastName}`.trim(),
    email: u.email,
    avatar: u.avatar,
    userTypeId: u.userTypeId,
    accountStatus: u.accountStatus,
    createdAt: u.createdAt?.toISOString() ?? null,
  }));
}

export async function getSubscriptionInfo(userId: number) {
  const [subscription, payments, channels, categories] = await Promise.all([
    db.subscription.findFirst({
      where: { userId },
      include: { plan: { select: { title: true, subtitle: true } } },
      orderBy: [{ isDefault: "desc" }, { id: "desc" }],
    }),
    db.payment.findMany({
      where: { userId },
      include: { paymentStatus: { select: { status: true } } },
      orderBy: { createdAt: "desc" },
      take: 24,
    }),
    db.notificationChannel.findMany({
      where: { active: true },
      select: { id: true, name: true, description: true },
      orderBy: { id: "asc" },
    }),
    db.messageCategory.findMany({
      select: { id: true, name: true, description: true },
      orderBy: { id: "asc" },
    }),
  ]);

  const [userChannels, userCategories] = await Promise.all([
    db.userNotificationChannel.findMany({
      where: { userId },
      select: { notificationChannelId: true, subscriptionStatus: true },
    }),
    db.userMessageCategory.findMany({
      where: { userId },
      select: { messageCategoryId: true, subscriptionStatus: true },
    }),
  ]);

  const channelStatus = new Map(
    userChannels.map((c) => [c.notificationChannelId, c.subscriptionStatus]),
  );
  const categoryStatus = new Map(
    userCategories.map((c) => [c.messageCategoryId, c.subscriptionStatus]),
  );

  return {
    subscription: subscription
      ? {
          planTitle: subscription.plan.title,
          planSubtitle: subscription.plan.subtitle,
          status: subscription.status,
          startDate: subscription.startDate.toISOString(),
          endDate: subscription.endDate?.toISOString() ?? null,
        }
      : null,
    payments: payments.map((p) => ({
      id: p.id,
      amount: p.amount.toFixed(2),
      method: p.paymentMethod,
      status: p.paymentStatus.status,
      reference: p.paymentId,
      createdAt: p.createdAt?.toISOString() ?? null,
    })),
    // Preferencias de notificación: canales y categorías de mensaje, con el
    // estado del usuario (por defecto suscrito, como el legacy).
    channels: channels.map((c) => ({
      id: c.id,
      name: c.name,
      description: c.description,
      enabled: channelStatus.get(c.id) ?? true,
    })),
    categories: categories.map((c) => ({
      id: c.id,
      name: c.name,
      description: c.description,
      enabled: categoryStatus.get(c.id) ?? true,
    })),
  };
}

export type SubscriptionInfo = Awaited<ReturnType<typeof getSubscriptionInfo>>;
