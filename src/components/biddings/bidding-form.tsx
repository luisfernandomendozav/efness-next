"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { Plus, Trash2 } from "lucide-react";
import { useT } from "@/i18n/use-t";
import type { ProductLookups } from "@/server/products";
import { createBiddingAction } from "@/server/bidding-actions";
import { ProductFormDialog } from "@/components/products/product-form-dialog";
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
  invalid_bidding: "Please review the entered data",
  delivery_date: "The delivery date must be after the deadline",
  address_required: "Select a delivery address",
  no_company: "Your user has no company assigned, so it cannot publish posts.",
};

type CatalogOption = {
  id: number;
  name: string;
  internalCode: string;
  unitName: string;
};

type Line = { productCatalogId: number; quantity: number; comments: string };

export function BiddingForm({
  categories,
  addresses,
  products,
  lookups,
}: {
  categories: { id: number; name: string }[];
  addresses: { id: number; label: string }[];
  products: CatalogOption[];
  lookups: ProductLookups;
}) {
  const t = useT();
  const [state, formAction, pending] = useActionState(
    createBiddingAction,
    undefined,
  );
  const [deliveryType, setDeliveryType] = useState<string>("shipping");
  const [lines, setLines] = useState<Line[]>([]);
  const [draftProduct, setDraftProduct] = useState<number>(0);

  const available = products.filter(
    (p) => !lines.some((l) => l.productCatalogId === p.id),
  );

  const addLine = () => {
    const id = draftProduct || available[0]?.id;
    if (!id) return;
    setLines([...lines, { productCatalogId: id, quantity: 1, comments: "" }]);
    setDraftProduct(0);
  };

  return (
    <form action={formAction} className="space-y-5">
      <input
        type="hidden"
        name="products"
        value={JSON.stringify(
          lines.map((l) => ({
            productCatalogId: l.productCatalogId,
            quantity: l.quantity,
            comments: l.comments || undefined,
          })),
        )}
      />
      {/* Productos va antes que los datos generales (feedback 2026-09-19). */}
      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle>{t("Products")}</CardTitle>
          <ProductFormDialog lookups={lookups} />
        </CardHeader>
        <CardContent className="space-y-3 pt-4">
          {products.length === 0 && (
            <p className="text-sm text-muted-foreground">
              {t("Your catalog is empty. Add a product to include it in the bidding.")}
            </p>
          )}
          {lines.map((line, i) => {
            const product = products.find(
              (p) => p.id === line.productCatalogId,
            );
            return (
              <div
                key={line.productCatalogId}
                className="grid items-end gap-3 rounded-md border p-3 sm:grid-cols-[1fr_6rem_1fr_2.5rem]"
              >
                <div>
                  <p className="text-sm font-medium">{product?.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {product?.internalCode} · {t(product?.unitName ?? "")}
                  </p>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">{t("Quantity")}</Label>
                  <Input
                    type="number"
                    min={1}
                    value={line.quantity}
                    onChange={(e) =>
                      setLines(
                        lines.map((l, j) =>
                          j === i
                            ? { ...l, quantity: Math.max(1, Number(e.target.value) || 1) }
                            : l,
                        ),
                      )
                    }
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">{t("Comments")}</Label>
                  <Input
                    value={line.comments}
                    maxLength={1000}
                    onChange={(e) =>
                      setLines(
                        lines.map((l, j) =>
                          j === i ? { ...l, comments: e.target.value } : l,
                        ),
                      )
                    }
                  />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-9 w-9 p-0 text-destructive"
                  onClick={() => setLines(lines.filter((_, j) => j !== i))}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            );
          })}
          {available.length > 0 && (
            <div className="flex items-end gap-3">
              <div className="flex-1 space-y-1">
                <Label className="text-xs">{t("Add product from your catalog")}</Label>
                <select
                  value={draftProduct || available[0]?.id}
                  onChange={(e) => setDraftProduct(Number(e.target.value))}
                  className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
                >
                  {available.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.internalCode})
                    </option>
                  ))}
                </select>
              </div>
              <Button type="button" variant="secondary" onClick={addLine}>
                <Plus className="mr-1 h-4 w-4" />
                {t("Add")}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("General data")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pt-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>{t("Category")}</Label>
              <select
                name="categoryId"
                required
                className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {t(c.name)}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label>{t("Currency")}</Label>
              <select
                name="currency"
                defaultValue="MXN"
                className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
              >
                <option value="MXN">MXN</option>
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
              </select>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="b-deadline">{t("Deadline")}</Label>
              <Input id="b-deadline" name="deadline" type="date" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="b-delivery">{t("Delivery date")}</Label>
              <Input
                id="b-delivery"
                name="deliveryDate"
                type="date"
                required
              />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>{t("Delivery type")}</Label>
              <select
                name="deliveryType"
                value={deliveryType}
                onChange={(e) => setDeliveryType(e.target.value)}
                className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
              >
                <option value="shipping">{t("Shipping")}</option>
                <option value="open_to_origin">{t("Open to origin")}</option>
              </select>
            </div>
            {deliveryType === "shipping" && (
              <div className="space-y-2">
                <Label>{t("Delivery address")}</Label>
                {addresses.length > 0 ? (
                  <select
                    name="addressId"
                    className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
                  >
                    {addresses.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.label}
                      </option>
                    ))}
                  </select>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    {t("You have no registered addresses. Add one to use it in your biddings.")}{" "}
                    <Link href="/account" className="font-medium text-primary hover:underline">
                      {t("Account Settings")}
                    </Link>
                  </p>
                )}
              </div>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="b-description">{t("Description")}</Label>
            <Input
              id="b-description"
              name="description"
              maxLength={255}
              placeholder={t("Optional")}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="b-notes">{t("Notes")}</Label>
            <textarea
              id="b-notes"
              name="notes"
              maxLength={5000}
              rows={3}
              placeholder={t("Optional")}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
          </div>
        </CardContent>
        <CardFooter className="flex-col items-stretch gap-3 pt-4">
          {state?.error && (
            <p className="text-sm text-destructive">
              {t(ERROR_MESSAGES[state.error] ?? ERROR_MESSAGES.invalid_bidding)}
            </p>
          )}
          {lines.length === 0 && (
            <p className="text-xs text-muted-foreground">
              {t("Add at least one product to the bidding")}
            </p>
          )}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" asChild>
              <Link href="/biddings/active">{t("Discard")}</Link>
            </Button>
            <Button type="submit" disabled={pending || lines.length === 0}>
              {pending ? t("Please wait...") : t("Submit")}
            </Button>
          </div>
        </CardFooter>
      </Card>
    </form>
  );
}
