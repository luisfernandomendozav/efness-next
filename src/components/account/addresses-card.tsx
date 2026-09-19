"use client";

import { useActionState, useEffect, useState } from "react";
import { MapPin, Pencil, Plus, Trash2 } from "lucide-react";
import { useT } from "@/i18n/use-t";
import type { DeliveryAddress } from "@/server/account-data";
import {
  deleteAddressAction,
  saveAddressAction,
} from "@/server/account-actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Option = { id: number; name: string };
type StateOption = Option & { countryId: number };

function AddressDialog({
  countries,
  states,
  address,
}: {
  countries: Option[];
  states: StateOption[];
  address?: DeliveryAddress;
}) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const [countryId, setCountryId] = useState(
    address?.countryId ?? countries[0]?.id ?? 0,
  );
  const [state, formAction, pending] = useActionState(
    saveAddressAction,
    undefined,
  );
  const [wasPending, setWasPending] = useState(false);

  useEffect(() => {
    if (pending) setWasPending(true);
    else if (wasPending && state?.success) {
      setOpen(false);
      setWasPending(false);
    }
  }, [pending, state, wasPending]);

  const stateOptions = states.filter((s) => s.countryId === countryId);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {address ? (
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <Pencil className="h-4 w-4" />
          </Button>
        ) : (
          <Button variant="secondary" size="sm">
            <Plus className="mr-1 h-4 w-4" />
            {t("Add address")}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {address ? t("Edit address") : t("Add address")}
          </DialogTitle>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          {address && <input type="hidden" name="id" value={address.id} />}
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>{t("Country")}</Label>
              <select
                name="countryId"
                value={countryId}
                onChange={(e) => setCountryId(Number(e.target.value))}
                className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
              >
                {countries.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label>{t("State")}</Label>
              <select
                name="stateId"
                defaultValue={address?.stateId}
                className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
              >
                {stateOptions.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="a-city">{t("City")}</Label>
            <Input
              id="a-city"
              name="city"
              required
              defaultValue={address?.city ?? ""}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="a-street">{t("Street")}</Label>
            <Input
              id="a-street"
              name="street"
              required
              defaultValue={address?.street ?? ""}
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="a-out">{t("Outdoor number")}</Label>
              <Input
                id="a-out"
                name="outdoorNumber"
                required
                defaultValue={address?.outdoorNumber ?? ""}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="a-int">{t("Interior number")}</Label>
              <Input
                id="a-int"
                name="interiorNumber"
                defaultValue={address?.interiorNumber ?? ""}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="a-zip">{t("Zip code")}</Label>
              <Input
                id="a-zip"
                name="zipCode"
                required
                defaultValue={address?.zipCode ?? ""}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>{t("Address type")}</Label>
            <select
              name="addressType"
              defaultValue={address?.addressType ?? "office"}
              className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
            >
              <option value="office">{t("Office")}</option>
              <option value="home">{t("Home")}</option>
            </select>
          </div>
          {state?.error && (
            <p className="text-sm text-destructive">
              {t("Please review the entered data")}
            </p>
          )}
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setOpen(false)}
            >
              {t("Discard")}
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? t("Please wait") : t("Submit")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function AddressesCard({
  addresses,
  countries,
  states,
}: {
  addresses: DeliveryAddress[];
  countries: Option[];
  states: StateOption[];
}) {
  const t = useT();
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle>{t("Delivery addresses")}</CardTitle>
        <AddressDialog countries={countries} states={states} />
      </CardHeader>
      <CardContent className="space-y-3 pt-4">
        {addresses.length === 0 && (
          <p className="py-6 text-center text-sm text-muted-foreground">
            {t("You have no registered addresses. Add one to use it in your biddings.")}
          </p>
        )}
        {addresses.map((a) => (
          <div
            key={a.id}
            className="flex items-start justify-between gap-3 rounded-md border p-3"
          >
            <div className="flex items-start gap-3">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
              <div className="text-sm">
                <p className="font-medium">
                  {a.street} {a.outdoorNumber}
                  {a.interiorNumber ? ` ${t("Int.")} ${a.interiorNumber}` : ""}
                </p>
                <p className="text-muted-foreground">
                  {a.city}, {a.state}, {a.country} · CP {a.zipCode}
                </p>
                <Badge variant="secondary" className="mt-1 text-xs">
                  {t(a.addressType === "home" ? "Home" : "Office")}
                </Badge>
              </div>
            </div>
            <div className="flex shrink-0">
              <AddressDialog
                countries={countries}
                states={states}
                address={a}
              />
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-destructive"
                onClick={() => deleteAddressAction(a.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
