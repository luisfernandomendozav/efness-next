"use client";

import { useActionState } from "react";
import Link from "next/link";
import { useT } from "@/i18n/use-t";
import { forgotPasswordAction } from "@/server/auth/reset-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const ERROR_MESSAGES: Record<string, string> = {
  validation_error: "Wrong email format",
  server_error: "The login details are incorrect",
};

export default function ForgotPasswordPage() {
  const t = useT();
  const [state, formAction, pending] = useActionState(
    forgotPasswordAction,
    undefined,
  );

  return (
    <div>
      <h1 className="mb-3 text-center text-4xl font-bold text-[#f9f9f9]">
        {t("Forgot Password?")}
      </h1>
      <p className="mb-10 text-center text-sm text-[#f9f9f9]/70">
        {t("Enter your email to reset your password.")}
      </p>
      {state?.success ? (
        <div className="space-y-6 text-center">
          <div className="rounded-md border border-[#00E84A]/40 bg-[#00E84A]/10 px-4 py-3 text-sm text-[#f9f9f9]">
            {t("Sent password reset. Please check your email")}
          </div>
          <Link
            href="/login"
            className="text-sm font-bold text-primary underline hover:text-primary/80"
          >
            {t("Sign In")}
          </Link>
        </div>
      ) : (
        <form action={formAction} className="space-y-5">
          {state?.error && (
            <div className="rounded-md border border-destructive bg-[#ffeef3] px-4 py-3 text-sm text-destructive">
              {t(ERROR_MESSAGES[state.error] ?? ERROR_MESSAGES.server_error)}
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
          <Button
            type="submit"
            className="h-11 w-full font-semibold"
            disabled={pending}
          >
            {pending ? t("Please wait...") : t("Continue")}
          </Button>
          <div className="text-center text-sm text-[#f9f9f9]">
            <Link
              href="/login"
              className="font-bold text-primary underline hover:text-primary/80"
            >
              {t("Sign In")}
            </Link>
          </div>
        </form>
      )}
    </div>
  );
}
