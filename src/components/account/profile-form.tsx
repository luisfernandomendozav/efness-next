"use client";

import { useActionState } from "react";
import { useT } from "@/i18n/use-t";
import { updateProfileAction } from "@/server/account-actions";
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
  validation_error: "Please review the entered data",
};

export function ProfileForm({
  name,
  lastName,
  email,
  phoneCountryCode,
  phone,
}: {
  name: string;
  lastName: string;
  email: string;
  phoneCountryCode: string | null;
  phone: string | null;
}) {
  const t = useT();
  const [state, formAction, pending] = useActionState(
    updateProfileAction,
    undefined,
  );

  return (
    <Card>
      <form action={formAction}>
        <CardHeader>
          <CardTitle>{t("Profile Details")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pt-4">
          {state?.error && (
            <div className="rounded-md border border-destructive bg-[#ffeef3] px-4 py-3 text-sm text-destructive">
              {t(ERROR_MESSAGES[state.error] ?? ERROR_MESSAGES.validation_error)}
            </div>
          )}
          {state?.success && (
            <div className="rounded-md border border-[#569842] bg-[#dfffea] px-4 py-3 text-sm text-[#569842]">
              {t("Profile updated successfully")}
            </div>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">{t("Name")}</Label>
              <Input id="name" name="name" defaultValue={name} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">{t("Last name")}</Label>
              <Input
                id="lastName"
                name="lastName"
                defaultValue={lastName}
                required
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">{t("Email")}</Label>
            <Input id="email" value={email} disabled />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">{t("Phone")}</Label>
            <div className="flex gap-2">
              <Input
                id="phoneCountryCode"
                name="phoneCountryCode"
                defaultValue={phoneCountryCode ?? ""}
                placeholder="+52"
                className="w-20"
              />
              <Input
                id="phone"
                name="phone"
                defaultValue={phone ?? ""}
                inputMode="numeric"
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
