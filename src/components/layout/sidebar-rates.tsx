import { TrendingUp } from "lucide-react";
import { getT } from "@/i18n/get-t";
import { getExchangeRates } from "@/server/exchange-rates";

const CURRENCY_KEYS: Record<string, string> = {
  USD: "US dollar",
  EUR: "Euro",
  CAD: "Canadian dollar",
};

// Tipos de cambio al fondo del sidebar, como el SidebarIndicatorsContainer
// del frontend legacy (feedback notas 2026-09-18).
export async function SidebarRates() {
  const [t, rates] = await Promise.all([getT(), getExchangeRates()]);
  if (!rates || rates.length === 0) return null;

  return (
    <div className="mx-3 mb-3 rounded-md bg-white/5 p-3">
      <p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-white/50">
        <TrendingUp className="h-3.5 w-3.5" />
        {t("Exchange rates")}
      </p>
      <div className="space-y-1.5">
        {rates.map((rate) => (
          <div
            key={rate.code}
            className="flex items-center justify-between text-xs"
          >
            <span className="text-white/60">
              {t(CURRENCY_KEYS[rate.code] ?? rate.code)}
            </span>
            <span className="font-semibold text-white">
              {rate.mxn.toLocaleString("es-MX", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}{" "}
              MXN
            </span>
          </div>
        ))}
      </div>
      <p className="mt-2 text-[10px] leading-snug text-white/40">
        {t("Reference only, updated hourly")}
      </p>
    </div>
  );
}
