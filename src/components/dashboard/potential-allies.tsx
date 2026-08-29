"use client";

import { useTransition } from "react";
import { UserPlus } from "lucide-react";
import { useT } from "@/i18n/use-t";
import type { PotentialAlly } from "@/server/feed";
import { sendAllyRequestAction } from "@/server/feed-actions";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function AllyRow({ ally }: { ally: PotentialAlly }) {
  const t = useT();
  const [pending, startTransition] = useTransition();
  const initials = ally.name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="flex items-center gap-3">
      <Avatar className="h-10 w-10">
        {ally.avatar && <AvatarImage src={ally.avatar} alt={ally.name} />}
        <AvatarFallback>{initials}</AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-semibold">{ally.name}</div>
        <div className="truncate text-xs text-muted-foreground">
          {[ally.companyName, ally.userType && t(ally.userType)]
            .filter(Boolean)
            .join(" · ")}
        </div>
      </div>
      <Button
        size="sm"
        variant="secondary"
        disabled={pending}
        onClick={() => startTransition(() => sendAllyRequestAction(ally.id))}
      >
        <UserPlus className="mr-1 h-4 w-4" />
        {t("Connect")}
      </Button>
    </div>
  );
}

export function PotentialAllies({ allies }: { allies: PotentialAlly[] }) {
  const t = useT();
  if (allies.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{t("Potential Allies")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {allies.map((ally) => (
          <AllyRow key={ally.id} ally={ally} />
        ))}
      </CardContent>
    </Card>
  );
}
