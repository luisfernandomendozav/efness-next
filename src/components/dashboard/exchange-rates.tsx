import { TrendingUp } from "lucide-react";
import { getT } from "@/i18n/get-t";
import { getExchangeRates } from "@/server/exchange-rates";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const CURRENCY_KEYS: Record<string, string> = {
  USD: "US dollar",
  EUR: "Euro",
  CAD: "Canadian dollar",
};

export async function ExchangeRates() {
  const [t, rates] = await Promise.all([getT(), getExchangeRates()]);
  if (!rates || rates.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <TrendingUp className="h-4 w-4 text-primary" />
          {t("Exchange rates")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {rates.map((rate) => (
          <div key={rate.code} className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              {t(CURRENCY_KEYS[rate.code] ?? rate.code)}
            </span>
            <span className="font-semibold">
              {rate.mxn.toLocaleString("es-MX", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}{" "}
              MXN
            </span>
          </div>
        ))}
        <p className="text-xs text-muted-foreground">
          {t("Reference only, updated hourly")}
        </p>
      </CardContent>
    </Card>
  );
}
