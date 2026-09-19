"use client";

import { useTransition } from "react";
import { useT } from "@/i18n/use-t";
import {
  toggleMessageCategoryAction,
  toggleNotificationChannelAction,
} from "@/server/account-actions";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";

type Pref = {
  id: number;
  name: string;
  description: string | null;
  enabled: boolean;
};

function PrefList({
  items,
  onToggle,
}: {
  items: Pref[];
  onToggle: (id: number, enabled: boolean) => void;
}) {
  const t = useT();
  const [pending, startTransition] = useTransition();
  return (
    <div className="space-y-2">
      {items.map((item) => (
        <label
          key={item.id}
          className="flex items-start gap-3 rounded-md border p-3 text-sm"
        >
          <Checkbox
            checked={item.enabled}
            disabled={pending}
            onCheckedChange={(v) =>
              startTransition(() => onToggle(item.id, v === true))
            }
          />
          <span>
            <span className="font-medium">{t(item.name)}</span>
            {item.description && (
              <span className="block text-xs text-muted-foreground">
                {t(item.description)}
              </span>
            )}
          </span>
        </label>
      ))}
    </div>
  );
}

export function NotificationPrefs({
  channels,
  categories,
}: {
  channels: Pref[];
  categories: Pref[];
}) {
  const t = useT();
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("Notifications")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5 pt-4">
        {channels.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-semibold">{t("Channels")}</p>
            <PrefList
              items={channels}
              onToggle={(id, enabled) =>
                toggleNotificationChannelAction(id, enabled)
              }
            />
          </div>
        )}
        {categories.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-semibold">{t("Message types")}</p>
            <PrefList
              items={categories}
              onToggle={(id, enabled) =>
                toggleMessageCategoryAction(id, enabled)
              }
            />
          </div>
        )}
        {channels.length === 0 && categories.length === 0 && (
          <p className="py-4 text-center text-sm text-muted-foreground">
            {t("No results found")}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
