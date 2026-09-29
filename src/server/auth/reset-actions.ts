"use server";

import { z } from "zod";
import { db } from "@/server/db";
import { hashPassword } from "@/server/auth/password";
import { sendPasswordResetEmail } from "@/server/services/email";

// Igual que password_reset_tokens de Laravel: un token por correo, 60 min de vida
const RESET_TOKEN_TTL_MS = 60 * 60 * 1000;

export type ForgotPasswordState =
  | { error?: string; success?: boolean }
  | undefined;

export async function forgotPasswordAction(
  _prev: ForgotPasswordState,
  formData: FormData,
): Promise<ForgotPasswordState> {
  const parsed = z
    .string()
    .email()
    .safeParse(String(formData.get("email") ?? "").trim());
  if (!parsed.success) return { error: "validation_error" };
  const email = parsed.data;

  try {
    const user = await db.user.findUnique({
      where: { email },
      select: { name: true },
    });

    // Siempre responder éxito para no revelar si el correo está registrado
    if (user) {
      const token = crypto.randomUUID();
      await db.passwordResetToken.upsert({
        where: { email },
        update: { token, createdAt: new Date() },
        create: { email, token },
      });
      await sendPasswordResetEmail(email, user.name ?? "", token);
    }

    return { success: true };
  } catch {
    return { error: "server_error" };
  }
}

export type ResetPasswordState =
  | { error?: string; success?: boolean }
  | undefined;

const resetSchema = z
  .object({
    email: z.string().email(),
    token: z.string().min(1),
    password: z.string().min(8),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "password_mismatch",
    path: ["confirmPassword"],
  });

export async function resetPasswordAction(
  _prev: ResetPasswordState,
  formData: FormData,
): Promise<ResetPasswordState> {
  const raw = {
    email: String(formData.get("email") ?? ""),
    token: String(formData.get("token") ?? ""),
    password: String(formData.get("password") ?? ""),
    confirmPassword: String(formData.get("confirmPassword") ?? ""),
  };

  const parsed = resetSchema.safeParse(raw);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    if (first?.message === "password_mismatch")
      return { error: "password_mismatch" };
    return { error: "validation_error" };
  }

  const { email, token, password } = parsed.data;

  try {
    const record = await db.passwordResetToken.findUnique({ where: { email } });
    if (!record || record.token !== token) return { error: "invalid_token" };

    const createdAt = record.createdAt?.getTime() ?? 0;
    if (Date.now() - createdAt > RESET_TOKEN_TTL_MS) {
      await db.passwordResetToken.delete({ where: { email } });
      return { error: "invalid_token" };
    }

    const user = await db.user.findUnique({
      where: { email },
      select: { id: true },
    });
    if (!user) return { error: "invalid_token" };

    await db.user.update({
      where: { id: user.id },
      data: { password: await hashPassword(password), passwordExpiry: null },
    });
    await db.passwordResetToken.delete({ where: { email } });

    return { success: true };
  } catch {
    return { error: "server_error" };
  }
}
