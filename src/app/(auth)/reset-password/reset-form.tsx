"use client";

import { useActionState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useT } from "@/i18n/use-t";
import { resetPasswordAction } from "@/server/auth/reset-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const ERROR_MESSAGES: Record<string, string> = {
  password_mismatch: "Passwords must match",
  validation_error: "Password must be at least 8 character and contain symbols",
  invalid_token: "The password reset link is invalid or has expired",
  server_error: "The login details are incorrect",
};

export function ResetPasswordForm({
  token,
  email,
}: {
  token: string;
  email: string;
}) {
  const t = useT();
  const router = useRouter();
  const [state, formAction, pending] = useActionState(
    resetPasswordAction,
    undefined,
  );

  useEffect(() => {
    if (state?.success) {
      const timer = setTimeout(() => router.push("/login"), 2500);
      return () => clearTimeout(timer);
    }
  }, [state?.success, router]);

  if (state?.success) {
    return (
      <div className="text-center">
        <div className="rounded-md border border-[#00E84A]/40 bg-[#00E84A]/10 px-4 py-3 text-sm text-[#f9f9f9]">
          {t("Password has been reset successfully. Redirecting to login...")}
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="mb-3 text-center text-4xl font-bold text-[#f9f9f9]">
        {t("Reset Password")}
      </h1>
      <p className="mb-10 text-center text-sm text-[#f9f9f9]/70">
        {t("Enter your new password to reset your password.")}
      </p>
      <form action={formAction} className="space-y-5">
        {state?.error && (
          <div className="rounded-md border border-destructive bg-[#ffeef3] px-4 py-3 text-sm text-destructive">
            {t(ERROR_MESSAGES[state.error] ?? ERROR_MESSAGES.server_error)}
            {state.error === "invalid_token" && (
              <>
                {" "}
                <Link href="/forgot-password" className="font-bold underline">
                  {t("Forgot Password?")}
                </Link>
              </>
            )}
          </div>
        )}
        <input type="hidden" name="token" value={token} />
        <input type="hidden" name="email" value={email} />
        <div className="space-y-2">
          <Label htmlFor="password" className="font-semibold text-[#f9f9f9]">
            {t("New Password")}
          </Label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            minLength={8}
            required
            className="h-11 bg-white text-[#4b5675]"
          />
        </div>
        <div className="space-y-2">
          <Label
            htmlFor="confirmPassword"
            className="font-semibold text-[#f9f9f9]"
          >
            {t("Confirm New Password")}
          </Label>
          <Input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            minLength={8}
            required
            className="h-11 bg-white text-[#4b5675]"
          />
        </div>
        <Button
          type="submit"
          className="h-11 w-full font-semibold"
          disabled={pending}
        >
          {pending ? t("Please wait...") : t("Reset Password")}
        </Button>
      </form>
    </div>
  );
}
