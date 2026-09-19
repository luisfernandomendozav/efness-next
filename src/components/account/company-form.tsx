"use client";

import { useActionState, useState } from "react";
import { Building2 } from "lucide-react";
import { useT } from "@/i18n/use-t";
import { updateCompanyAction } from "@/server/account-actions";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const ERROR_MESSAGES: Record<string, string> = {
  validation_error: "Please review the entered data",
  duplicate_rfc: "The RFC is already registered by another company",
  file_too_large: "The image must not exceed 2MB",
  invalid_file_type: "Invalid file type",
  upload_failed: "The file could not be uploaded",
  no_company: "Your user has no company assigned, so it cannot publish posts.",
};

export type CompanyDetailsData = {
  name: string;
  rfcTaxId: string;
  webSite: string | null;
  country: string | null;
  state: string | null;
  city: string | null;
  address: string | null;
  zipCode: string | null;
  logo: string | null;
};

export function CompanyForm({ company }: { company: CompanyDetailsData }) {
  const t = useT();
  const [preview, setPreview] = useState<string | null>(null);
  const [state, formAction, pending] = useActionState(
    updateCompanyAction,
    undefined,
  );
  const logo = preview ?? company.logo;

  return (
    <Card>
      <form action={formAction}>
        <CardHeader>
          <CardTitle>{t("Company details")}</CardTitle>
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
          <div className="flex items-center gap-5">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-md border bg-muted">
              {logo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={logo}
                  alt={t("Logo")}
                  className="h-full w-full object-contain"
                />
              ) : (
                <Building2 className="h-8 w-8 text-muted-foreground" />
              )}
            </div>
            <div className="space-y-2">
              <Label>{t("Logo")}</Label>
              <input
                type="file"
                name="logo"
                accept="image/png,image/jpeg,image/webp"
                className="block text-sm file:mr-3 file:rounded-md file:border-0 file:bg-secondary file:px-3 file:py-1.5 file:text-sm file:font-medium"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  setPreview(file ? URL.createObjectURL(file) : null);
                }}
              />
              <p className="text-xs text-muted-foreground">
                {t("Allowed file types: png, jpg, jpeg. Max 2MB")}
              </p>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="c-name">{t("Business name")}</Label>
              <Input
                id="c-name"
                name="name"
                required
                defaultValue={company.name}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="c-rfc">RFC</Label>
              <Input
                id="c-rfc"
                name="rfcTaxId"
                required
                defaultValue={company.rfcTaxId}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="c-web">{t("Website")}</Label>
            <Input
              id="c-web"
              name="webSite"
              defaultValue={company.webSite ?? ""}
              placeholder="https://"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="c-country">{t("Country")}</Label>
              <Input
                id="c-country"
                name="country"
                defaultValue={company.country ?? ""}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="c-state">{t("State")}</Label>
              <Input
                id="c-state"
                name="state"
                defaultValue={company.state ?? ""}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="c-city">{t("City")}</Label>
              <Input
                id="c-city"
                name="city"
                defaultValue={company.city ?? ""}
              />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-[1fr_10rem]">
            <div className="space-y-2">
              <Label htmlFor="c-address">{t("Address")}</Label>
              <Input
                id="c-address"
                name="address"
                defaultValue={company.address ?? ""}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="c-zip">{t("Zip code")}</Label>
              <Input
                id="c-zip"
                name="zipCode"
                defaultValue={company.zipCode ?? ""}
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
