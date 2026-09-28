"use client";

import { useActionState, useState } from "react";
import { Download, Upload } from "lucide-react";
import { useT } from "@/i18n/use-t";
import { importProductsAction } from "@/server/product-actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

const ERROR_MESSAGES: Record<string, string> = {
  invalid_file: "Select a CSV file",
  file_too_large: "The file exceeds the maximum allowed size",
  invalid_columns: "The file does not have the expected columns. Download the exported catalog to use it as a template.",
  empty_file: "The file has no rows",
  too_many_rows: "The file has too many rows (maximum 500)",
  no_company: "Your user has no company assigned, so it cannot publish posts.",
};

const ROW_ERRORS: Record<string, string> = {
  missing_fields: "Name and internal code are required",
  unknown_type: "Unknown product type",
  unknown_unit: "Unknown unit for that type",
  missing_brand: "Brand is required",
  invalid_price: "Invalid price",
  missing_keywords: "At least one keyword is required",
  invalid_taxes: "Invalid taxes",
  duplicate_code: "Internal code already exists",
  unknown_error: "Error saving product",
};

export function ImportProductsDialog() {
  const t = useT();
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(
    importProductsAction,
    undefined,
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="secondary">
          <Upload className="mr-1 h-4 w-4" />
          {t("Import")}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("Import catalog")}</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {t("Upload a CSV file with the columns of the exported catalog: type, name, brand, internal code, external code, SAT key, unit, price, keywords and taxes.")}
          </p>
          {/* Formato en blanco descargable (feedback presentación
              2026-09-26, lámina 9). */}
          <Button variant="secondary" size="sm" asChild>
            <a href="/products/catalog/template" download>
              <Download className="mr-1 h-4 w-4" />
              {t("Download blank template")}
            </a>
          </Button>
          <div className="space-y-2">
            <Label htmlFor="import-file">{t("CSV file")}</Label>
            <input
              id="import-file"
              type="file"
              name="file"
              accept=".csv,text/csv"
              required
              className="block w-full text-sm file:mr-3 file:rounded-md file:border-0 file:bg-secondary file:px-3 file:py-1.5 file:text-sm file:font-medium"
            />
          </div>
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
              {state.errors.length > 0 && (
                <div className="max-h-40 space-y-1 overflow-y-auto text-destructive">
                  {state.errors.map((e) => (
                    <p key={`${e.row}-${e.reason}`} className="text-xs">
                      {t("Row")} {e.row}: {t(ROW_ERRORS[e.reason] ?? e.reason)}
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
              onClick={() => setOpen(false)}
            >
              {t("Close")}
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? t("Please wait...") : t("Import")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
