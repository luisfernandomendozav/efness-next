"use client";

import { useActionState } from "react";
import Link from "next/link";
import { useT } from "@/i18n/use-t";
import { loginAction } from "@/server/auth/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const ERROR_MESSAGES: Record<string, string> = {
  invalid_credentials: "The login details are incorrect",
  email_not_verified: "Email address is not verified.",
  password_expired: "Your password has expired. Please change your password.",
  account_disabled: "Your account has been disabled.",
  code_send_failed: "Failed to send verification code. Please try again later.",
};

export default function LoginPage() {
  const t = useT();
  const [state, formAction, pending] = useActionState(loginAction, undefined);

  return (
    <div>
      <h1 className="mb-10 text-center text-4xl font-bold text-[#f9f9f9]">
        {t("Sign In")}
      </h1>
      <form action={formAction} className="space-y-5">
        {state?.error && (
          <div className="rounded-md border border-destructive bg-[#ffeef3] px-4 py-3 text-sm text-destructive">
            {t(ERROR_MESSAGES[state.error] ?? ERROR_MESSAGES.invalid_credentials)}
          </div>
        )}
        <div className="space-y-2">
          <Label htmlFor="email" className="font-semibold text-[#f9f9f9]">
            {t("Email")}
          </Label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            className="h-11 bg-white text-[#4b5675]"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password" className="font-semibold text-[#f9f9f9]">
            {t("Password")}
          </Label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            className="h-11 bg-white text-[#4b5675]"
          />
          <div className="text-right">
            <Link
              href="/forgot-password"
              className="text-sm text-[#f9f9f9]/80 hover:text-[#f9f9f9]"
            >
              ¿{t("Forgot Password")}?
            </Link>
          </div>
        </div>
        <Button
          type="submit"
          className="h-11 w-full font-semibold"
          disabled={pending}
        >
          {pending ? t("Please wait...") : t("Continue")}
        </Button>
        <div className="flex items-center justify-between text-sm text-[#f9f9f9]">
          <span>{t("Not a Member yet?")}</span>
          <Link
            href="/register"
            className="font-bold text-primary underline hover:text-primary/80"
          >
            {t("Sign up")}
          </Link>
        </div>
      </form>
    </div>
  );
}
