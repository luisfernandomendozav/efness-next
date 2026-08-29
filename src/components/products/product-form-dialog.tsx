"use client";

import { useActionState, useEffect, useState } from "react";
import { Pencil, Plus, X } from "lucide-react";
import { useT } from "@/i18n/use-t";
import type { ProductLookups, ProductRow } from "@/server/products";
import { saveProductAction } from "@/server/product-actions";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const SERVICE_TYPE_ID = 2;

const ERROR_MESSAGES: Record<string, string> = {
  invalid_product: "Error saving product",
  brand_required: "Brand is required",
  duplicate_code: "Internal code already exists",
  no_company: "Your user has no company assigned, so it cannot publish posts.",
};

function KeywordsInput({
  keywords,
  onChange,
  placeholder,
}: {
  keywords: string[];
  onChange: (next: string[]) => void;
  placeholder: string;
}) {
  const [draft, setDraft] = useState("");

  const add = () => {
    const value = draft.trim();
    if (!value) return;
    if (!keywords.some((k) => k.toLowerCase() === value.toLowerCase())) {
      onChange([...keywords, value]);
    }
    setDraft("");
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5">
        {keywords.map((k) => (
          <span
            key={k}
            className="inline-flex items-center gap-1 rounded-md bg-secondary px-2 py-0.5 text-xs font-medium"
          >
            {k}
            <button
              type="button"
              onClick={() => onChange(keywords.filter((x) => x !== k))}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
      </div>
      <Input
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            add();
          }
        }}
        onBlur={add}
        placeholder={placeholder}
      />
    </div>
  );
}

export function ProductFormDialog({
  lookups,
  product,
}: {
  lookups: ProductLookups;
  product?: ProductRow;
}) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(
    saveProductAction,
    undefined,
  );
  const [typeId, setTypeId] = useState(product?.form.productTypeId ?? 1);
  const [keywords, setKeywords] = useState<string[]>(
    product?.form.keywords ?? [],
  );
  const [taxIds, setTaxIds] = useState<number[]>(
    product?.form.taxes.map((t) => t.taxId) ?? [],
  );
  const [wasPending, setWasPending] = useState(false);

  useEffect(() => {
    if (pending) setWasPending(true);
    else if (wasPending && state === undefined) {
      setOpen(false);
      setWasPending(false);
      if (!product) {
        setKeywords([]);
        setTaxIds([]);
      }
    }
  }, [pending, state, wasPending, product]);

  const units = lookups.units.filter((u) => u.productTypeId === typeId);
  const iepsSelected = lookups.taxes.some(
    (tax) => taxIds.includes(tax.id) && (tax.rate === null || tax.rate === 0),
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {product ? (
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <Pencil className="h-4 w-4" />
          </Button>
        ) : (
          <Button>
            <Plus className="mr-1 h-4 w-4" />
            {t("Add product")}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {product ? t("Edit") : t("Add product")}
          </DialogTitle>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          {product && <input type="hidden" name="id" value={product.id} />}
          <input type="hidden" name="keywords" value={JSON.stringify(keywords)} />
          {taxIds.map((id) => (
            <input key={id} type="hidden" name="taxIds" value={id} />
          ))}

          <div className="space-y-2">
            <Label>{t("Type")}</Label>
            <select
              name="productTypeId"
              value={typeId}
              onChange={(e) => setTypeId(Number(e.target.value))}
              className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
            >
              {lookups.types.map((type) => (
                <option key={type.id} value={type.id}>
                  {t(type.name)}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="p-name">{t("Name")}</Label>
            <Input
              id="p-name"
              name="name"
              required
              maxLength={5000}
              defaultValue={product?.name ?? ""}
              placeholder={t("Product name")}
            />
          </div>

          {typeId !== SERVICE_TYPE_ID && (
            <div className="space-y-2">
              <Label htmlFor="p-brand">{t("Brand")}</Label>
              <Input
                id="p-brand"
                name="brand"
                required
                defaultValue={product?.form.brand ?? ""}
                placeholder={t("Product brand")}
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="p-price">{t("Price")}</Label>
              <Input
                id="p-price"
                name="price"
                type="number"
                min="0"
                step="0.01"
                defaultValue={product?.form.price ?? 0}
              />
            </div>
            <div className="space-y-2">
              <Label>{t("Unit")}</Label>
              <select
                name="unitId"
                defaultValue={product?.form.unitId ?? units[0]?.id}
                className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
              >
                {units.map((u) => (
                  <option key={u.id} value={u.id}>
                    {t(u.name)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="p-internal">{t("Internal code")}</Label>
              <Input
                id="p-internal"
                name="internalCode"
                required
                defaultValue={product?.internalCode ?? ""}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="p-external">{t("External code")}</Label>
              <Input
                id="p-external"
                name="externalCode"
                defaultValue={product?.form.externalCode ?? ""}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="p-sat">{t("SAT key")}</Label>
            <Input
              id="p-sat"
              name="satKey"
              defaultValue={product?.form.satKey ?? ""}
            />
          </div>

          <div className="space-y-2">
            <Label>{t("Keywords")}</Label>
            <KeywordsInput
              keywords={keywords}
              onChange={setKeywords}
              placeholder={t("Add a keyword and press enter")}
            />
          </div>

          <div className="space-y-2">
            <Label>{t("Taxes")}</Label>
            <div className="space-y-1.5 rounded-md border p-3">
              {lookups.taxes.map((tax) => (
                <label
                  key={tax.id}
                  className="flex items-center gap-2 text-sm"
                >
                  <Checkbox
                    checked={taxIds.includes(tax.id)}
                    onCheckedChange={(checked) =>
                      setTaxIds((prev) =>
                        checked
                          ? [...prev, tax.id]
                          : prev.filter((id) => id !== tax.id),
                      )
                    }
                  />
                  {tax.name} ({tax.rate ?? 0}%) - {tax.country}
                </label>
              ))}
            </div>
          </div>

          {iepsSelected && (
            <div className="space-y-2">
              <Label htmlFor="p-ieps">IEPS</Label>
              <Input
                id="p-ieps"
                name="iepsRate"
                type="number"
                min="0"
                step="0.01"
                defaultValue={
                  product?.form.taxes.find((t) => t.rate > 0 &&
                    lookups.taxes.find((x) => x.id === t.taxId)?.rate === null,
                  )?.rate ?? ""
                }
                placeholder={t("Enter IEPS rate")}
              />
            </div>
          )}

          {state?.error && (
            <p className="text-sm text-destructive">
              {t(ERROR_MESSAGES[state.error] ?? state.error)}
            </p>
          )}
          {keywords.length === 0 && (
            <p className="text-xs text-muted-foreground">
              {t("At least one keyword is required")}
            </p>
          )}

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setOpen(false)}
            >
              {t("Discard")}
            </Button>
            <Button
              type="submit"
              disabled={pending || keywords.length === 0 || taxIds.length === 0}
            >
              {pending ? t("Please wait...") : t("Submit")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
