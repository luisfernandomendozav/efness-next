"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth, signOut, unstable_update } from "@/server/auth";
import { db } from "@/server/db";
import { hashPassword, verifyPassword } from "@/server/auth/password";
import { uploadImage } from "@/server/uploads";

export type AccountActionState =
  | { error?: string; success?: boolean }
  | undefined;

async function requireUserId() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  return Number(session.user.id);
}

const profileSchema = z.object({
  name: z.string().trim().min(1).max(100),
  lastName: z.string().trim().min(1).max(100),
  phoneCountryCode: z
    .string()
    .trim()
    .max(4)
    .regex(/^\+?\d*$/)
    .optional(),
  phone: z.string().trim().max(15).regex(/^\d*$/).optional(),
});

export async function updateProfileAction(
  _prev: AccountActionState,
  formData: FormData,
): Promise<AccountActionState> {
  const userId = await requireUserId();

  const parsed = profileSchema.safeParse({
    name: String(formData.get("name") ?? ""),
    lastName: String(formData.get("lastName") ?? ""),
    phoneCountryCode: String(formData.get("phoneCountryCode") ?? ""),
    phone: String(formData.get("phone") ?? ""),
  });
  if (!parsed.success) return { error: "validation_error" };

  const { name, lastName, phoneCountryCode, phone } = parsed.data;

  await db.user.update({
    where: { id: userId },
    data: {
      name,
      lastName,
      phoneCountryCode: phoneCountryCode || null,
      phone: phone || null,
    },
  });

  // El header muestra session.user.name; sincronizarlo con el nuevo nombre.
  await unstable_update({ name: `${name} ${lastName}` } as never);
  revalidatePath("/account");
  return { success: true };
}

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1),
    newPassword: z.string().min(8),
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "password_mismatch",
    path: ["confirmPassword"],
  });

export async function changePasswordAction(
  _prev: AccountActionState,
  formData: FormData,
): Promise<AccountActionState> {
  const userId = await requireUserId();

  const parsed = passwordSchema.safeParse({
    currentPassword: String(formData.get("currentPassword") ?? ""),
    newPassword: String(formData.get("newPassword") ?? ""),
    confirmPassword: String(formData.get("confirmPassword") ?? ""),
  });
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    if (first?.message === "password_mismatch")
      return { error: "password_mismatch" };
    if (first?.path[0] === "newPassword") return { error: "password_too_short" };
    return { error: "validation_error" };
  }

  const user = await db.user.findUnique({
    where: { id: userId },
    select: { password: true },
  });
  if (!user) redirect("/login");

  const valid = await verifyPassword(parsed.data.currentPassword, user.password);
  if (!valid) return { error: "invalid_current_password" };

  await db.user.update({
    where: { id: userId },
    data: { password: await hashPassword(parsed.data.newPassword) },
  });
  return { success: true };
}

// ---- Pestaña "Zona geográfica y giro" ----

const categoriesSchema = z.array(z.coerce.number().int().min(1)).max(100);

export async function saveCategoriesAction(
  _prev: AccountActionState,
  formData: FormData,
): Promise<AccountActionState> {
  const userId = await requireUserId();

  const parsed = categoriesSchema.safeParse(formData.getAll("categoryIds"));
  if (!parsed.success) return { error: "validation_error" };
  const categoryIds = [...new Set(parsed.data)];

  await db.$transaction([
    db.userCategory.deleteMany({ where: { userId } }),
    db.userCategory.createMany({
      data: categoryIds.map((categoryId) => ({ userId, categoryId })),
    }),
  ]);

  revalidatePath("/account");
  return { success: true };
}

const geoScopeSchema = z.object({
  countryId: z.coerce.number().int().min(1),
  stateId: z.coerce.number().int().min(1).optional(),
  cityName: z.string().trim().max(255).optional(),
  scopeType: z.enum(["include", "exclude"]),
});

export async function addGeoScopeAction(
  _prev: AccountActionState,
  formData: FormData,
): Promise<AccountActionState> {
  const userId = await requireUserId();

  const parsed = geoScopeSchema.safeParse({
    countryId: formData.get("countryId"),
    stateId: formData.get("stateId") || undefined,
    cityName: formData.get("cityName") || undefined,
    scopeType: formData.get("scopeType"),
  });
  if (!parsed.success) return { error: "validation_error" };
  const { countryId, stateId, cityName, scopeType } = parsed.data;

  // Una ciudad requiere estado; el nivel se deriva del dato más específico.
  if (cityName && !stateId) return { error: "state_required" };
  const level = cityName ? "city" : stateId ? "state" : "country";

  try {
    await db.sellerGeographicScope.create({
      data: {
        sellerId: userId,
        countryId,
        stateId: stateId ?? null,
        cityName: cityName ?? null,
        scopeType,
        level,
      },
    });
  } catch {
    return { error: "duplicate_scope" };
  }

  revalidatePath("/account");
  return { success: true };
}

export async function deleteGeoScopeAction(scopeId: number) {
  const userId = await requireUserId();
  await db.sellerGeographicScope.deleteMany({
    where: { id: scopeId, sellerId: userId },
  });
  revalidatePath("/account");
}

// ---- Foto de perfil (feedback notas 2026-09-18) ----

export async function updateAvatarAction(
  _prev: AccountActionState,
  formData: FormData,
): Promise<AccountActionState> {
  const userId = await requireUserId();

  const file = formData.get("avatar");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "validation_error" };
  }
  const result = await uploadImage(file, "avatars");
  if ("error" in result) return { error: result.error };

  await db.user.update({
    where: { id: userId },
    data: { avatar: result.url },
  });
  // El menú superior muestra session.user.image.
  await unstable_update({ picture: result.url } as never);
  revalidatePath("/account");
  return { success: true };
}

export async function removeAvatarAction() {
  const userId = await requireUserId();
  await db.user.update({ where: { id: userId }, data: { avatar: null } });
  await unstable_update({ picture: null } as never);
  revalidatePath("/account");
}

// ---- Direcciones de entrega ----

const addressSchema = z.object({
  id: z.coerce.number().int().optional(),
  countryId: z.coerce.number().int().min(1),
  stateId: z.coerce.number().int().min(1),
  city: z.string().trim().min(1).max(100),
  street: z.string().trim().min(1).max(255),
  outdoorNumber: z.string().trim().min(1).max(50),
  interiorNumber: z.string().trim().max(50).optional(),
  zipCode: z.string().trim().min(1).max(20),
  addressType: z.enum(["home", "office"]),
});

export async function saveAddressAction(
  _prev: AccountActionState,
  formData: FormData,
): Promise<AccountActionState> {
  const userId = await requireUserId();

  const parsed = addressSchema.safeParse({
    id: formData.get("id") || undefined,
    countryId: formData.get("countryId"),
    stateId: formData.get("stateId"),
    city: formData.get("city"),
    street: formData.get("street"),
    outdoorNumber: formData.get("outdoorNumber"),
    interiorNumber: formData.get("interiorNumber") || undefined,
    zipCode: formData.get("zipCode"),
    addressType: formData.get("addressType"),
  });
  if (!parsed.success) return { error: "validation_error" };
  const data = parsed.data;

  // Los nombres se guardan desnormalizados junto con las FK, como el legacy.
  const [country, state] = await Promise.all([
    db.country.findUnique({ where: { id: data.countryId } }),
    db.state.findUnique({ where: { id: data.stateId } }),
  ]);
  if (!country || !state || state.countryId !== country.id) {
    return { error: "validation_error" };
  }

  const base = {
    countryId: data.countryId,
    stateId: data.stateId,
    country: country.name,
    state: state.name,
    city: data.city,
    street: data.street,
    outdoorNumber: data.outdoorNumber,
    interiorNumber: data.interiorNumber ?? null,
    zipCode: data.zipCode,
    addressType: data.addressType,
  };

  if (data.id) {
    await db.userAddress.updateMany({
      where: { id: data.id, userId, deletedAt: null },
      data: base,
    });
  } else {
    await db.userAddress.create({ data: { ...base, userId } });
  }
  revalidatePath("/account");
  return { success: true };
}

export async function deleteAddressAction(addressId: number) {
  const userId = await requireUserId();
  // Borrado suave: las requisiciones existentes pueden referenciarla.
  await db.userAddress.updateMany({
    where: { id: addressId, userId },
    data: { deletedAt: new Date() },
  });
  revalidatePath("/account");
}

// ---- Detalles de empresa ----

const companySchema = z.object({
  name: z.string().trim().min(1).max(255),
  rfcTaxId: z.string().trim().min(1).max(255),
  webSite: z.string().trim().max(255).optional(),
  country: z.string().trim().max(255).optional(),
  state: z.string().trim().max(255).optional(),
  city: z.string().trim().max(255).optional(),
  address: z.string().trim().max(255).optional(),
  zipCode: z.string().trim().max(255).optional(),
});

export async function updateCompanyAction(
  _prev: AccountActionState,
  formData: FormData,
): Promise<AccountActionState> {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const companyId = session.user.companyId;
  if (!companyId) return { error: "no_company" };

  const parsed = companySchema.safeParse({
    name: formData.get("name"),
    rfcTaxId: formData.get("rfcTaxId"),
    webSite: formData.get("webSite") || undefined,
    country: formData.get("country") || undefined,
    state: formData.get("state") || undefined,
    city: formData.get("city") || undefined,
    address: formData.get("address") || undefined,
    zipCode: formData.get("zipCode") || undefined,
  });
  if (!parsed.success) return { error: "validation_error" };

  let logo: string | undefined;
  const file = formData.get("logo");
  if (file instanceof File && file.size > 0) {
    const result = await uploadImage(file, "company-logos");
    if ("error" in result) return { error: result.error };
    logo = result.url;
  }

  try {
    await db.company.update({
      where: { id: companyId },
      data: {
        name: parsed.data.name,
        rfcTaxId: parsed.data.rfcTaxId,
        webSite: parsed.data.webSite ?? null,
        country: parsed.data.country ?? null,
        state: parsed.data.state ?? null,
        city: parsed.data.city ?? null,
        address: parsed.data.address ?? null,
        zipCode: parsed.data.zipCode ?? null,
        ...(logo ? { logo } : {}),
      },
    });
  } catch {
    // rfc_tax_id es único.
    return { error: "duplicate_rfc" };
  }
  revalidatePath("/account");
  return { success: true };
}

// ---- Método de inicio de sesión (MFA por SMS) ----

const twoFactorSchema = z.object({
  enable: z.enum(["true", "false"]),
  celPhoneCountryCode: z
    .string()
    .trim()
    .max(4)
    .regex(/^\+?\d*$/)
    .optional(),
  celPhone: z.string().trim().max(15).regex(/^\d*$/).optional(),
});

export async function toggleTwoFactorAction(
  _prev: AccountActionState,
  formData: FormData,
): Promise<AccountActionState> {
  const userId = await requireUserId();

  const parsed = twoFactorSchema.safeParse({
    enable: formData.get("enable"),
    celPhoneCountryCode: formData.get("celPhoneCountryCode") || undefined,
    celPhone: formData.get("celPhone") || undefined,
  });
  if (!parsed.success) return { error: "validation_error" };

  if (parsed.data.enable === "false") {
    await db.user.update({
      where: { id: userId },
      data: { twoFactorAuthenticationEnabled: false },
    });
    revalidatePath("/account");
    return { success: true };
  }

  const user = await db.user.findUnique({
    where: { id: userId },
    select: { celPhone: true, celPhoneCountryCode: true },
  });
  const celPhone = parsed.data.celPhone || user?.celPhone;
  const celPhoneCountryCode =
    parsed.data.celPhoneCountryCode || user?.celPhoneCountryCode;
  // El código de verificación se envía por SMS en cada inicio de sesión,
  // así que el teléfono celular es obligatorio para activar 2FA.
  if (!celPhone || !celPhoneCountryCode) return { error: "phone_required" };

  await db.user.update({
    where: { id: userId },
    data: {
      celPhone,
      celPhoneCountryCode,
      twoFactorAuthenticationEnabled: true,
    },
  });
  revalidatePath("/account");
  return { success: true };
}

// ---- Desactivar cuenta ----

export async function deactivateAccountAction(
  _prev: AccountActionState,
  formData: FormData,
): Promise<AccountActionState> {
  const userId = await requireUserId();
  const reason = String(formData.get("reason") ?? "").trim();

  await db.user.update({
    where: { id: userId },
    data: {
      accountStatus: "deactivated",
      deactivationReason: reason || null,
      deactivatedAt: new Date(),
    },
  });
  await signOut({ redirectTo: "/login" });
  return { success: true };
}

// ---- Notificaciones (pestaña Suscripción) ----

export async function toggleNotificationChannelAction(
  channelId: number,
  enabled: boolean,
) {
  const userId = await requireUserId();
  const existing = await db.userNotificationChannel.findFirst({
    where: { userId, notificationChannelId: channelId },
  });
  if (existing) {
    await db.userNotificationChannel.update({
      where: { id: existing.id },
      data: { subscriptionStatus: enabled },
    });
  } else {
    await db.userNotificationChannel.create({
      data: {
        userId,
        notificationChannelId: channelId,
        subscriptionStatus: enabled,
      },
    });
  }
  revalidatePath("/account");
}

export async function toggleMessageCategoryAction(
  categoryId: number,
  enabled: boolean,
) {
  const userId = await requireUserId();
  const existing = await db.userMessageCategory.findFirst({
    where: { userId, messageCategoryId: categoryId },
  });
  if (existing) {
    await db.userMessageCategory.update({
      where: { id: existing.id },
      data: { subscriptionStatus: enabled },
    });
  } else {
    await db.userMessageCategory.create({
      data: {
        userId,
        messageCategoryId: categoryId,
        subscriptionStatus: enabled,
      },
    });
  }
  revalidatePath("/account");
}
