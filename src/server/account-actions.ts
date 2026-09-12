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
