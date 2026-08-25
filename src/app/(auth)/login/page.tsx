"use client";

import { useActionState } from "react";
import Link from "next/link";
import { useT } from "@/i18n/use-t";
import { loginAction } from "@/server/auth/actions";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">{t("Sign In")}</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">{t("Email")}</Label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">{t("Password")}</Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
            />
          </div>
          {state?.error && (
            <p className="text-sm text-destructive">
              {t(ERROR_MESSAGES[state.error] ?? ERROR_MESSAGES.invalid_credentials)}
            </p>
          )}
          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? t("Please wait...") : t("Continue")}
          </Button>
          <div className="text-center text-sm">
            <Link
              href="/forgot-password"
              className="text-muted-foreground hover:text-foreground"
            >
              {t("Forgot Password")}
            </Link>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
