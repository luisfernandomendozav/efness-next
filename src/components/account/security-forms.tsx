"use client";

import { useActionState, useState } from "react";
import { ShieldCheck, TriangleAlert } from "lucide-react";
import { useT } from "@/i18n/use-t";
import {
  deactivateAccountAction,
  toggleTwoFactorAction,
} from "@/server/account-actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const ERROR_MESSAGES: Record<string, string> = {
  validation_error: "Please review the entered data",
  phone_required: "Add a mobile phone to enable two-step verification",
};

export function TwoFactorForm({
  enabled,
  celPhoneCountryCode,
  celPhone,
}: {
  enabled: boolean;
  celPhoneCountryCode: string | null;
  celPhone: string | null;
}) {
  const t = useT();
  const [state, formAction, pending] = useActionState(
    toggleTwoFactorAction,
    undefined,
  );

  return (
    <Card>
      <form action={formAction}>
        <input type="hidden" name="enable" value={enabled ? "false" : "true"} />
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            {t("Sign-in method")}
            <Badge
              className={
                enabled
                  ? "bg-[#dfffea] text-[#569842]"
                  : "bg-secondary text-muted-foreground"
              }
            >
              {t(enabled ? "Enabled" : "Disabled")}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pt-4">
          <p className="text-sm text-muted-foreground">
            {t("Two-step verification sends an SMS code to your mobile phone every time you sign in.")}
          </p>
          {!enabled && (
            <div className="space-y-2">
              <Label htmlFor="tf-phone">{t("Mobile phone")}</Label>
              <div className="flex gap-2">
                <Input
                  id="tf-cc"
                  name="celPhoneCountryCode"
                  defaultValue={celPhoneCountryCode ?? "+52"}
                  placeholder="+52"
                  className="w-20"
                />
                <Input
                  id="tf-phone"
                  name="celPhone"
                  defaultValue={celPhone ?? ""}
                  inputMode="numeric"
                />
              </div>
            </div>
          )}
          {state?.error && (
            <p className="text-sm text-destructive">
              {t(ERROR_MESSAGES[state.error] ?? ERROR_MESSAGES.validation_error)}
            </p>
          )}
        </CardContent>
        <CardFooter className="justify-end pt-4">
          <Button
            type="submit"
            variant={enabled ? "secondary" : "default"}
            disabled={pending}
          >
            {pending
              ? t("Please wait")
              : t(enabled ? "Disable two-step verification" : "Enable two-step verification")}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}

export function DeactivateAccountCard() {
  const t = useT();
  const [confirmed, setConfirmed] = useState(false);
  const [, formAction, pending] = useActionState(
    deactivateAccountAction,
    undefined,
  );

  return (
    <Card className="border-destructive/40">
      <form action={formAction}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <TriangleAlert className="h-5 w-5" />
            {t("Deactivate account")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pt-4">
          <p className="text-sm text-muted-foreground">
            {t("Your account will be deactivated and your session closed. Contact the team to reactivate it.")}
          </p>
          <div className="space-y-2">
            <Label htmlFor="da-reason">{t("Reason (optional)")}</Label>
            <Input id="da-reason" name="reason" maxLength={500} />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <Checkbox
              checked={confirmed}
              onCheckedChange={(v) => setConfirmed(v === true)}
            />
            {t("I confirm that I want to deactivate my account")}
          </label>
        </CardContent>
        <CardFooter className="justify-end pt-4">
          <Button
            type="submit"
            variant="destructive"
            disabled={!confirmed || pending}
          >
            {pending ? t("Please wait") : t("Deactivate account")}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
