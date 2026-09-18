import Image from "next/image";
import { Megaphone } from "lucide-react";
import { getT } from "@/i18n/get-t";
import { Card, CardContent } from "@/components/ui/card";

// Espacio de publicidad pagada sobre la lista de recomendados (feedback
// presentación 2026-09). El legacy mostraba un anuncio de ejemplo hardcodeado;
// mientras no exista backend de anuncios, se muestra el espacio con una
// invitación a anunciarse.
export async function SponsoredAd() {
  const t = await getT();
  return (
    <Card className="overflow-hidden">
      <CardContent className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {t("Sponsored")}
        </p>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#00E84A]/15 text-[#1a9c43]">
            <Megaphone className="h-5 w-5" />
          </div>
          <span className="text-sm font-semibold">
            {t("Your brand here")}
          </span>
        </div>
        <div className="relative flex h-28 items-center justify-center rounded-lg bg-[#293762]">
          <Image
            src="/efness-logo-white.svg"
            alt="efness"
            width={120}
            height={29}
            className="opacity-80"
          />
        </div>
        <p className="text-sm text-muted-foreground">
          {t("Reach buyers across the efness network with paid advertising.")}
        </p>
        <a
          href="mailto:aaron@efness.com?subject=Publicidad%20en%20efness"
          className="text-sm font-semibold text-primary hover:underline"
        >
          {t("Advertise here")}
        </a>
      </CardContent>
    </Card>
  );
}
