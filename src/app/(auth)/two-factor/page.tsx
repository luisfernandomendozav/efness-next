"use client";

import { useActionState, useState, useTransition } from "react";
import { useT } from "@/i18n/use-t";
import {
  resendTwoFactorCodeAction,
  verifyTwoFactorAction,
} from "@/server/auth/actions";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function TwoFactorPage() {
  const t = useT();
  const [state, formAction, pending] = useActionState(
    verifyTwoFactorAction,
    undefined,
  );
  const [resending, startResend] = useTransition();
  const [resent, setResent] = useState(false);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">{t("Verification code")}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="mb-4 text-sm text-muted-foreground">
          {t("A verification code has been sent to your phone number.")}
        </p>
        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="code">{t("Verification code")}</Label>
            <Input
              id="code"
              name="code"
              inputMode="numeric"
              autoComplete="one-time-code"
              required
            />
          </div>
          {state?.error && (
            <p className="text-sm text-destructive">
              {t("Invalid verification code.")}
            </p>
          )}
          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? t("Please wait...") : t("Continue")}
          </Button>
        </form>
        <div className="mt-4 text-center">
          <Button
            variant="link"
            size="sm"
            disabled={resending}
            onClick={() =>
              startResend(async () => {
                await resendTwoFactorCodeAction();
                setResent(true);
              })
            }
          >
            {resent ? t("A verification code has been sent to your phone number.") : t("Resend code")}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
