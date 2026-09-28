"use client";

import { useActionState, useState, useTransition } from "react";
import { Trash2 } from "lucide-react";
import { useT } from "@/i18n/use-t";
import type { BusinessProfile } from "@/server/account-business";
import {
  addGeoScopeAction,
  deleteGeoScopeAction,
  saveCategoriesAction,
} from "@/server/account-actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const ERROR_MESSAGES: Record<string, string> = {
  validation_error: "Please review the entered data",
  state_required: "Select a state to add a city",
  duplicate_scope: "That geographic scope already exists",
};

function StatusBanner({
  state,
  successKey,
}: {
  state: { error?: string; success?: boolean } | undefined;
  successKey: string;
}) {
  const t = useT();
  if (state?.error) {
    return (
      <div className="rounded-md border border-destructive bg-[#ffeef3] px-4 py-3 text-sm text-destructive">
        {t(ERROR_MESSAGES[state.error] ?? ERROR_MESSAGES.validation_error)}
      </div>
    );
  }
  if (state?.success) {
    return (
      <div className="rounded-md border border-[#569842] bg-[#dfffea] px-4 py-3 text-sm text-[#569842]">
        {t(successKey)}
      </div>
    );
  }
  return null;
}

export function CategoriesForm({
  categories,
  selectedCategoryIds,
}: {
  categories: BusinessProfile["categories"];
  selectedCategoryIds: number[];
}) {
  const t = useT();
  const [state, formAction, pending] = useActionState(
    saveCategoriesAction,
    undefined,
  );
  const [selected, setSelected] = useState<number[]>(selectedCategoryIds);

  return (
    <Card>
      <form action={formAction}>
        <CardHeader>
          <CardTitle>{t("Business line")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pt-4">
          <StatusBanner state={state} successKey="Business line updated successfully" />
          <p className="text-sm text-muted-foreground">
            {t("Select the categories of products and services your company works with.")}
          </p>
          <div className="max-h-72 space-y-1.5 overflow-y-auto rounded-md border p-3">
            {categories.map((category) => (
              <label
                key={category.id}
                className="flex items-start gap-2 text-sm"
              >
                <Checkbox
                  className="mt-0.5"
                  name="categoryIds"
                  value={category.id}
                  checked={selected.includes(category.id)}
                  onCheckedChange={(checked) =>
                    setSelected((prev) =>
                      checked
                        ? [...prev, category.id]
                        : prev.filter((id) => id !== category.id),
                    )
                  }
                />
                {category.name}
              </label>
            ))}
          </div>
        </CardContent>
        <CardFooter className="justify-end pt-4">
          <Button type="submit" disabled={pending}>
            {pending ? t("Please wait") : t("Save Changes")}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}

function ScopeRow({
  scope,
}: {
  scope: BusinessProfile["scopes"][number];
}) {
  const t = useT();
  const [pending, startTransition] = useTransition();
  const place = [scope.cityName, scope.stateName, scope.countryName]
    .filter(Boolean)
    .join(", ");

  return (
    <div className="flex items-center justify-between rounded-md border px-3 py-2 text-sm">
      <div className="flex items-center gap-2">
        <Badge
          className={
            scope.scopeType === "include"
              ? "bg-[#dfffea] text-[#569842]"
              : "bg-[#ffeef3] text-[#f8285a]"
          }
        >
          {t(scope.scopeType === "include" ? "Include" : "Exclude")}
        </Badge>
        <span>{place}</span>
      </div>
      <Button
        variant="ghost"
        size="sm"
        className="h-8 w-8 p-0 text-destructive"
        disabled={pending}
        onClick={() => startTransition(() => deleteGeoScopeAction(scope.id))}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}

const selectClass =
  "h-9 w-full rounded-md border border-input bg-background px-2 text-sm";

// Réplica de la mecánica del GeographicScopeManagement legacy (feedback
// presentación 2026-09-26, lámina 2): país completo, estado completo o
// ciudades específicas, cada uno incluible o excluible; combinando reglas
// se cubre p. ej. "todo el estado excepto ciertas ciudades". El mapa con
// colores del legacy (Google Maps) queda pendiente.
export function GeoScopesForm({
  countries,
  states,
  scopes,
}: {
  countries: BusinessProfile["countries"];
  states: BusinessProfile["states"];
  scopes: BusinessProfile["scopes"];
}) {
  const t = useT();
  const [state, formAction, pending] = useActionState(
    addGeoScopeAction,
    undefined,
  );
  const [countryId, setCountryId] = useState(countries[0]?.id ?? 0);
  const [mode, setMode] = useState<"country" | "state" | "cities">("country");
  const countryStates = states.filter((s) => s.countryId === countryId);
  const included = scopes.filter((s) => s.scopeType === "include");
  const excluded = scopes.filter((s) => s.scopeType === "exclude");

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("Geographic zone")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 pt-4">
        <StatusBanner state={state} successKey="Geographic zone updated successfully" />
        <p className="text-sm text-muted-foreground">
          {t("Define the areas where your company operates. As a supplier, this filters the opportunities you see.")}
        </p>
        {included.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase text-[#569842]">
              {t("Included zones")}
            </p>
            {included.map((scope) => (
              <ScopeRow key={scope.id} scope={scope} />
            ))}
          </div>
        )}
        {excluded.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase text-[#f8285a]">
              {t("Excluded zones")}
            </p>
            {excluded.map((scope) => (
              <ScopeRow key={scope.id} scope={scope} />
            ))}
          </div>
        )}
        <form action={formAction} className="space-y-3 rounded-md border p-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>{t("Zone type")}</Label>
              <select
                value={mode}
                onChange={(e) =>
                  setMode(e.target.value as "country" | "state" | "cities")
                }
                className={selectClass}
              >
                <option value="country">{t("Whole country")}</option>
                <option value="state">{t("Whole state")}</option>
                <option value="cities">{t("Specific cities")}</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label>{t("Country")}</Label>
              <select
                name="countryId"
                value={countryId}
                onChange={(e) => setCountryId(Number(e.target.value))}
                className={selectClass}
              >
                {countries.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            {mode !== "country" && (
              <div className="space-y-2">
                <Label>{t("State")}</Label>
                <select name="stateId" defaultValue="" required className={selectClass}>
                  <option value="" disabled>
                    {t("Select a state")}
                  </option>
                  {countryStates.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
            {mode === "cities" && (
              <div className="space-y-2">
                <Label htmlFor="geo-city">{t("Cities (comma separated)")}</Label>
                <Input
                  id="geo-city"
                  name="cityName"
                  required
                  maxLength={2000}
                  placeholder="Hermosillo, Nogales, Guaymas"
                />
              </div>
            )}
            <div className="space-y-2">
              <Label>{t("Scope type")}</Label>
              <select name="scopeType" defaultValue="include" className={selectClass}>
                <option value="include">{t("Include")}</option>
                <option value="exclude">{t("Exclude")}</option>
              </select>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            {t("Tip: to cover a whole state except some cities, include the state and then exclude those cities.")}
          </p>
          <div className="flex justify-end">
            <Button type="submit" disabled={pending}>
              {pending ? t("Please wait") : t("Add zone")}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
