"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { useT } from "@/i18n/use-t";
import type { BiddingForQuote } from "@/server/biddings";
import { createQuoteAction } from "@/server/quote-actions";
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
  invalid_quote: "Please review the entered data",
  not_allowed: "Only sellers can send quotes",
  not_available: "The bidding is no longer available for quoting",
  price_required: "Enter a price for every product",
};

export function QuoteForm({ bidding }: { bidding: BiddingForQuote }) {
  const t = useT();
  const [state, formAction, pending] = useActionState(
    createQuoteAction,
    undefined,
  );
  const [prices, setPrices] = useState<Record<number, string>>({});
  const [shipping, setShipping] = useState("");

  const money = (n: number) =>
    `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const lines = bidding.products.map((p) => {
    const price = Number(prices[p.id]) || 0;
    const subtotal = price * p.quantity;
    const rateSum = p.taxes.reduce((s, tax) => s + tax.rate, 0);
    return { product: p, price, subtotal, taxes: (subtotal * rateSum) / 100 };
  });
  const subtotal = lines.reduce((s, l) => s + l.subtotal, 0);
  const totalTaxes = lines.reduce((s, l) => s + l.taxes, 0);
  const shippingCost =
    bidding.deliveryType === "shipping" ? Number(shipping) || 0 : 0;
  const total = subtotal + totalTaxes + shippingCost;
  const complete = lines.every((l) => l.price > 0);

  return (
    <form action={formAction}>
      <input type="hidden" name="biddingId" value={bidding.id} />
      <input
        type="hidden"
        name="products"
        value={JSON.stringify(
          lines
            .filter((l) => l.price > 0)
            .map((l) => ({ biddingProductId: l.product.id, price: l.price })),
        )}
      />
      <Card>
        <CardHeader>
          <CardTitle>{t("Requested products")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 pt-4">
          {lines.map(({ product, subtotal: lineSubtotal, taxes }) => (
            <div
              key={product.id}
              className="grid items-end gap-3 rounded-md border p-3 sm:grid-cols-[1fr_6rem_8rem_10rem]"
            >
              <div>
                <p className="text-sm font-medium">{product.name}</p>
                <p className="text-xs text-muted-foreground">
                  {product.internalCode} · {t(product.unitName)}
                  {product.taxes.length > 0 &&
                    ` · ${product.taxes
                      .map((tax) => `${tax.name} ${tax.rate}%`)
                      .join(", ")}`}
                </p>
                {product.comments && (
                  <p className="text-xs text-muted-foreground">
                    {product.comments}
                  </p>
                )}
              </div>
              <div className="space-y-1">
                <Label className="text-xs">{t("Quantity")}</Label>
                <p className="flex h-9 items-center text-sm">
                  {product.quantity}
                </p>
              </div>
              <div className="space-y-1">
                <Label className="text-xs" htmlFor={`price-${product.id}`}>
                  {t("Unit price")}
                </Label>
                <Input
                  id={`price-${product.id}`}
                  type="number"
                  min={0.01}
                  step="0.01"
                  required
                  value={prices[product.id] ?? ""}
                  onChange={(e) =>
                    setPrices({ ...prices, [product.id]: e.target.value })
                  }
                />
              </div>
              <div className="space-y-1 text-right">
                <Label className="text-xs">{t("Total")}</Label>
                <p className="flex h-9 items-center justify-end text-sm font-medium">
                  {money(lineSubtotal + taxes)}
                </p>
              </div>
            </div>
          ))}

          {bidding.deliveryType === "shipping" && (
            <div className="max-w-48 space-y-1">
              <Label className="text-xs" htmlFor="q-shipping">
                {t("Shipping cost")}
              </Label>
              <Input
                id="q-shipping"
                name="costShipping"
                type="number"
                min={0}
                step="0.01"
                value={shipping}
                onChange={(e) => setShipping(e.target.value)}
                placeholder={t("Optional")}
              />
            </div>
          )}

          <div className="ml-auto w-full max-w-64 space-y-1 border-t pt-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t("Subtotal")}</span>
              <span>{money(subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t("Taxes")}</span>
              <span>{money(totalTaxes)}</span>
            </div>
            {bidding.deliveryType === "shipping" && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  {t("Shipping cost")}
                </span>
                <span>{money(shippingCost)}</span>
              </div>
            )}
            <div className="flex justify-between font-semibold">
              <span>
                {t("Total")} ({bidding.currency})
              </span>
              <span>{money(total)}</span>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex-col items-stretch gap-3 pt-4">
          {state?.error && (
            <p className="text-sm text-destructive">
              {t(ERROR_MESSAGES[state.error] ?? ERROR_MESSAGES.invalid_quote)}
            </p>
          )}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" asChild>
              <Link href="/biddings/active">{t("Discard")}</Link>
            </Button>
            <Button type="submit" disabled={pending || !complete}>
              {pending ? t("Please wait...") : t("Send quote")}
            </Button>
          </div>
        </CardFooter>
      </Card>
    </form>
  );
}
