// Tipos de cambio de referencia para el dashboard (feedback presentación
// 2026-09). El legacy usaba api.exchangerate.host con API key; aquí usamos
// open.er-api.com, que es gratuito y sin clave, cacheado una hora.
const TARGETS = ["USD", "EUR", "CAD"] as const;

export type ExchangeRate = { code: string; mxn: number };

export async function getExchangeRates(): Promise<ExchangeRate[] | null> {
  try {
    const res = await fetch("https://open.er-api.com/v6/latest/USD", {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      result: string;
      rates: Record<string, number>;
    };
    if (data.result !== "success" || !data.rates?.MXN) return null;

    // Convertimos a "pesos por unidad de divisa" (misma referencia que el
    // widget del legacy: USD, EUR, CAD contra MXN).
    return TARGETS.map((code) => ({
      code,
      mxn: data.rates.MXN / data.rates[code],
    })).filter((r) => Number.isFinite(r.mxn));
  } catch {
    return null;
  }
}
