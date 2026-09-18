"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth, unstable_update } from "@/server/auth";
import { db } from "@/server/db";
import { hashPassword, verifyPassword } from "@/server/auth/password";

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
