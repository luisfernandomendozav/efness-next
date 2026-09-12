"use client";

import { useActionState } from "react";
import { useT } from "@/i18n/use-t";
import { changePasswordAction } from "@/server/account-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const ERROR_MESSAGES: Record<string, string> = {
  password_mismatch: "Passwords do not match",
  password_too_short: "Password must be at least 8 characters",
  invalid_current_password: "The current password is incorrect",
  validation_error: "Please review the entered data",
};

export function PasswordForm() {
  const t = useT();
  const [state, formAction, pending] = useActionState(
    changePasswordAction,
    undefined,
  );

  return (
    <Card>
      <form action={formAction}>
        <CardHeader>
          <CardTitle>{t("Change Password")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pt-4">
          {state?.error && (
            <div className="rounded-md border border-destructive bg-[#ffeef3] px-4 py-3 text-sm text-destructive">
              {t(ERROR_MESSAGES[state.error] ?? ERROR_MESSAGES.validation_error)}
            </div>
          )}
          {state?.success && (
            <div className="rounded-md border border-[#569842] bg-[#dfffea] px-4 py-3 text-sm text-[#569842]">
              {t("Password updated successfully")}
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="currentPassword">{t("Current Password")}</Label>
            <Input
              id="currentPassword"
              name="currentPassword"
              type="password"
              autoComplete="current-password"
              required
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="newPassword">{t("New Password")}</Label>
              <Input
                id="newPassword"
                name="newPassword"
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">
                {t("Confirm New Password")}
              </Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
              />
            </div>
          </div>
        </CardContent>
        <CardFooter className="justify-end pt-4">
          <Button type="submit" disabled={pending}>
            {pending ? t("Please wait") : t("Save Changes")}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
