"use server";

import { redirect } from "next/navigation";
import { AuthError } from "next-auth";
import { auth, signIn, signOut, unstable_update } from "@/server/auth";
import { db } from "@/server/db";
import {
  checkVerificationCode,
  sendVerificationCode,
} from "@/server/services/sms";

export type AuthActionState = { error?: string } | undefined;

export async function loginAction(
  _prev: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  try {
    await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      redirect: false,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      const code = error.cause?.err?.message ?? "invalid_credentials";
      return { error: code };
    }
    throw error;
  }
  const session = await auth();
  redirect(session?.user.twoFactorPending ? "/two-factor" : "/dashboard");
}

export async function verifyTwoFactorAction(
  _prev: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const user = await db.user.findUnique({
    where: { id: Number(session.user.id) },
    select: { celPhone: true, celPhoneCountryCode: true },
  });
  if (!user) redirect("/login");

  const code = String(formData.get("code") ?? "");
  const phone = `${user.celPhoneCountryCode ?? ""}${user.celPhone ?? ""}`;
  const approved = await checkVerificationCode(phone, code);
  if (!approved) return { error: "invalid_code" };

  await unstable_update({ twoFactorPending: false } as never);
  redirect("/dashboard");
}

export async function resendTwoFactorCodeAction(): Promise<AuthActionState> {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const user = await db.user.findUnique({
    where: { id: Number(session.user.id) },
    select: { celPhone: true, celPhoneCountryCode: true },
  });
  if (!user) redirect("/login");

  const phone = `${user.celPhoneCountryCode ?? ""}${user.celPhone ?? ""}`;
  const sent = await sendVerificationCode(phone);
  return sent ? undefined : { error: "code_send_failed" };
}

export async function logoutAction() {
  await signOut({ redirectTo: "/login" });
}
