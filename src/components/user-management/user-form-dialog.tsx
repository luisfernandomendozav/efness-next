"use client";

import { useActionState, useEffect, useState } from "react";
import { Pencil, Plus } from "lucide-react";
import { useT } from "@/i18n/use-t";
import type { AdminUserRow } from "@/server/users-admin";
import { saveUserAction } from "@/server/users-admin-actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const ERROR_MESSAGES: Record<string, string> = {
  invalid_user: "Error saving product",
  email_taken: "The email has already been taken.",
};

export function UserFormDialog({ user }: { user?: AdminUserRow }) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(
    saveUserAction,
    undefined,
  );
  const [wasPending, setWasPending] = useState(false);

  useEffect(() => {
    if (pending) setWasPending(true);
    else if (wasPending && state === undefined) {
      setOpen(false);
      setWasPending(false);
    }
  }, [pending, state, wasPending]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {user ? (
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <Pencil className="h-4 w-4" />
          </Button>
        ) : (
          <Button>
            <Plus className="mr-1 h-4 w-4" />
            {t("Add user")}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{user ? t("Edit") : t("Add user")}</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          {user && <input type="hidden" name="id" value={user.id} />}
          <div className="space-y-2">
            <Label htmlFor="u-name">{t("First name")}</Label>
            <Input
              id="u-name"
              name="name"
              required
              minLength={3}
              maxLength={50}
              defaultValue={user?.name ?? ""}
              placeholder={t("First name")}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="u-last">{t("Last name")}</Label>
            <Input
              id="u-last"
              name="lastName"
              required
              minLength={3}
              maxLength={50}
              defaultValue={user?.lastName ?? ""}
              placeholder={t("Last name")}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="u-email">{t("Email")}</Label>
            <Input
              id="u-email"
              name="email"
              type="email"
              required
              maxLength={50}
              defaultValue={user?.email ?? ""}
              placeholder={t("Email")}
            />
          </div>
          <div className="space-y-2">
            <Label>{t("User type")}</Label>
            <select
              name="userTypeId"
              required
              defaultValue={user?.userTypeId ?? ""}
              className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
            >
              <option value="" disabled>
                {t("Select user type")}
              </option>
              <option value="1">{t("Supplier")}</option>
              <option value="2">{t("Buyer")}</option>
            </select>
          </div>
          {state?.error && (
            <p className="text-sm text-destructive">
              {t(ERROR_MESSAGES[state.error] ?? state.error)}
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
              {pending ? t("Please wait...") : t("Submit")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
