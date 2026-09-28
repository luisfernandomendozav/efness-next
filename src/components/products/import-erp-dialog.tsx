"use client";

import { useActionState, useState } from "react";
import { Plug } from "lucide-react";
import { useT } from "@/i18n/use-t";
import { importErpProductsAction } from "@/server/erp-actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const ERROR_MESSAGES: Record<string, string> = {
  invalid_credentials: "Enter the account key and API key",
  erp_auth: "The ERP rejected the API key.",
  erp_unreachable: "Could not connect to the ERP. Check the account key.",
  erp_invalid_response: "The ERP returned an unexpected response.",
  erp_empty: "The ERP catalog is empty.",
  erp_not_configured:
    "No taxes or units are configured to import products.",
  no_company: "Your user has no company assigned, so it cannot publish posts.",
};

const ROW_ERRORS: Record<string, string> = {
  missing_fields: "Missing code or description",
  invalid_price: "Invalid price",
  unknown_error: "Error saving product",
};

// ERPs disponibles para importar. Por ahora solo AdminTotal tiene
// integración; el selector previo deja listo el camino para agregar más
// (feedback presentación 2026-09-26, lámina 8).
const ERPS = [
  { id: "admintotal", name: "AdminTotal", available: true },
  { id: "contpaqi", name: "CONTPAQi", available: false },
  { id: "sap", name: "SAP Business One", available: false },
  { id: "odoo", name: "Odoo", available: false },
] as const;

export function ImportErpDialog() {
  const t = useT();
  const [open, setOpen] = useState(false);
  const [erp, setErp] = useState<string | null>(null);
  const [state, formAction, pending] = useActionState(
    importErpProductsAction,
    undefined,
  );

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) setErp(null);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="secondary">
          <Plug className="mr-1 h-4 w-4" />
          {t("Import from ERP")}
        </Button>
      </DialogTrigger>
      {erp === null ? (
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{t("Select your ERP")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              {t("Choose the ERP you want to import your catalog from.")}
            </p>
            {ERPS.map((option) => (
              <button
                key={option.id}
                type="button"
                disabled={!option.available}
                onClick={() => setErp(option.id)}
                className="flex w-full items-center justify-between rounded-md border px-4 py-3 text-left text-sm font-medium transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-transparent"
              >
                {option.name}
                <span className="text-xs font-normal text-muted-foreground">
                  {option.available ? t("Available") : t("Coming soon")}
                </span>
              </button>
            ))}
          </div>
          <div className="flex justify-end">
            <Button
              type="button"
              variant="secondary"
              onClick={() => handleOpenChange(false)}
            >
              {t("Close")}
            </Button>
          </div>
        </DialogContent>
      ) : (
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("Import catalog from AdminTotal")}</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {t("Enter your AdminTotal account key (the subdomain you use to sign in) and an API key with access to the products endpoint.")}
          </p>
          <div className="space-y-2">
            <Label htmlFor="erp-account">{t("Account key")}</Label>
            <div className="flex items-center gap-2">
              <Input
                id="erp-account"
                name="account"
                required
                placeholder="miempresa"
                className="flex-1"
              />
              <span className="text-sm text-muted-foreground">
                .admintotal.com
              </span>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="erp-api-key">{t("API key")}</Label>
            <Input id="erp-api-key" name="apiKey" type="password" required />
          </div>
          <p className="text-xs text-muted-foreground">
            {t("Imported products are created with 16% VAT and the unit reported by the ERP; edit them afterwards if needed.")}
          </p>
          {state && "error" in state && state.error && (
            <p className="text-sm text-destructive">
              {t(ERROR_MESSAGES[state.error] ?? state.error)}
            </p>
          )}
          {state && "created" in state && (
            <div className="space-y-2 rounded-md border p-3 text-sm">
              <p className="font-medium text-[#569842]">
                {t("Imported products")}: {state.created}
              </p>
              {state.skipped > 0 && (
                <p className="text-muted-foreground">
                  {t("Skipped (already in your catalog)")}: {state.skipped}
                </p>
              )}
              {state.truncated && (
                <p className="text-muted-foreground">
                  {t("Only the first 500 products were imported.")}
                </p>
              )}
              {state.errors.length > 0 && (
                <div className="max-h-40 space-y-1 overflow-y-auto text-destructive">
                  {state.errors.map((e) => (
                    <p key={`${e.code}-${e.reason}`} className="text-xs">
                      {e.code}: {t(ROW_ERRORS[e.reason] ?? e.reason)}
                    </p>
                  ))}
                </div>
              )}
            </div>
          )}
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setErp(null)}
            >
              {t("Back")}
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? t("Please wait...") : t("Import")}
            </Button>
          </div>
        </form>
      </DialogContent>
      )}
    </Dialog>
  );
}
