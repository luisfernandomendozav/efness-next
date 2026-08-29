import { getT } from "@/i18n/get-t";
import { getLocale } from "next-intl/server";
import { auth } from "@/server/auth";
import {
  getBuyerIndicators,
  getGlobalIndicators,
  getSellerIndicators,
  type Indicator,
} from "@/server/reports";
import { Card, CardContent } from "@/components/ui/card";

const SUPERADMIN_ROLE_ID = 1;
const SELLER_TYPE_ID = 1;

// Paleta de los indicadores del sidebar legacy (SidebarIndicators.tsx).
const COLORS = ["#3699ff", "#8950fc", "#0bb783", "#f64e60", "#1a233e"];

export default async function ReportsPage() {
  const [t, locale, session] = await Promise.all([
    getT(),
    getLocale(),
    auth(),
  ]);

  const companyId = session!.user.companyId;
  const isSeller = session!.user.userTypeId === SELLER_TYPE_ID;
  const isSuperadmin = session!.user.roleId === SUPERADMIN_ROLE_ID;

  let indicators: Indicator[];
  if (isSuperadmin || companyId === null) {
    indicators = await getGlobalIndicators();
  } else if (isSeller) {
    indicators = await getSellerIndicators(
      Number(session!.user.id),
      companyId,
    );
  } else {
    indicators = await getBuyerIndicators(companyId);
  }

  const currency = new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "MXN",
  });

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <h1 className="text-2xl font-bold">{t("Reports")}</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {indicators.map((ind, i) => {
          const color = COLORS[i % COLORS.length];
          return (
            <Card key={ind.key} className="overflow-hidden py-0">
              <div className="h-1.5" style={{ backgroundColor: color }} />
              <CardContent className="space-y-2 py-5">
                <div className="text-3xl font-bold" style={{ color }}>
                  {ind.isCurrency
                    ? currency.format(ind.value)
                    : ind.value.toLocaleString(locale)}
                </div>
                <div className="text-sm font-medium text-muted-foreground">
                  {t(ind.key)}
                </div>
                {ind.percent !== undefined && (
                  <div className="space-y-1">
                    <div className="h-1.5 w-full rounded-full bg-muted">
                      <div
                        className="h-1.5 rounded-full"
                        style={{
                          width: `${Math.min(100, ind.percent)}%`,
                          backgroundColor: color,
                        }}
                      />
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {ind.percent}%
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
