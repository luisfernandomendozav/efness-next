"use server";

import { z } from "zod";
import { db } from "@/server/db";
import { hashPassword } from "@/server/auth/password";
import { sendVerificationEmail } from "@/server/services/email";

const schema = z
  .object({
    name: z.string().min(1).max(100),
    lastName: z.string().min(1).max(100),
    email: z.string().email(),
    password: z.string().min(8),
    confirmPassword: z.string(),
    companyName: z.string().min(1).max(255),
    rfcTaxId: z.string().min(1).max(255),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "password_mismatch",
    path: ["confirmPassword"],
  });

export type RegisterActionState =
  | { error?: string; success?: boolean }
  | undefined;

export async function registerAction(
  _prev: RegisterActionState,
  formData: FormData,
): Promise<RegisterActionState> {
  const raw = {
    name: String(formData.get("name") ?? ""),
    lastName: String(formData.get("lastName") ?? ""),
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? ""),
    confirmPassword: String(formData.get("confirmPassword") ?? ""),
    companyName: String(formData.get("companyName") ?? ""),
    rfcTaxId: String(formData.get("rfcTaxId") ?? ""),
  };

  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    if (first?.message === "password_mismatch") return { error: "password_mismatch" };
    return { error: "validation_error" };
  }

  const { name, lastName, email, password, companyName, rfcTaxId } = parsed.data;

  const existingUser = await db.user.findUnique({ where: { email } });
  if (existingUser) return { error: "email_taken" };

  const existingCompany = await db.company.findUnique({ where: { rfcTaxId } });
  if (existingCompany) return { error: "rfc_taken" };

  try {
    const hashedPassword = await hashPassword(password);
    const verificationToken = crypto.randomUUID();

    const company = await db.company.create({
      data: { name: companyName, rfcTaxId },
    });

    await db.user.create({
      data: {
        name,
        lastName,
        email,
        password: hashedPassword,
        companyId: company.id,
        verificationToken,
        language: "es",
      },
    });

    await sendVerificationEmail(email, name, verificationToken);

    return { success: true };
  } catch {
    return { error: "server_error" };
  }
}
