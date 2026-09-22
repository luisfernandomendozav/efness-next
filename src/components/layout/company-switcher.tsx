"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Building2, Check, ChevronsUpDown, Plus } from "lucide-react";
import { useT } from "@/i18n/use-t";
import type { LinkedAccount } from "@/server/account-switch";
import {
  linkAccountAction,
  switchAccountAction,
} from "@/server/account-switch-actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const ERROR_MESSAGES: Record<string, string> = {
  invalid_credentials: "Incorrect email or password",
  own_account: "You cannot link your own account",
  account_unavailable: "That account is not available",
  already_linked: "That account is already linked",
};

const USER_TYPE_LABELS: Record<number, string> = { 1: "Seller", 2: "Buyer" };

export function CompanySwitcher({
  currentCompany,
  accounts,
}: {
  currentCompany: string;
  accounts: LinkedAccount[];
}) {
  const t = useT();
  const router = useRouter();
  const [addOpen, setAddOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const link = (formData: FormData) => {
    startTransition(async () => {
      const result = await linkAccountAction(undefined, formData);
      if (result?.error) {
        setError(result.error);
      } else {
        setError(null);
        setAddOpen(false);
        router.refresh();
      }
    });
  };

  return (
    <div className="px-3 pb-3">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex w-full items-center gap-2 rounded-md border border-white/15 bg-white/5 px-3 py-2 text-left text-white transition-colors hover:bg-white/10">
            <Building2 className="h-4 w-4 shrink-0 text-white/70" />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium">
                {currentCompany}
              </span>
              <span className="block text-xs text-white/60">
                {t("Change company")}
              </span>
            </span>
            <ChevronsUpDown className="h-4 w-4 shrink-0 text-white/60" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent side="top" align="start" className="w-52">
          <DropdownMenuItem disabled className="opacity-100">
            <Check className="mr-2 h-4 w-4 text-primary" />
            <span className="truncate font-medium">{currentCompany}</span>
          </DropdownMenuItem>
          {accounts.map((a) => (
            <DropdownMenuItem
              key={a.userId}
              onClick={() => startTransition(() => switchAccountAction(a.userId))}
            >
              <Building2 className="mr-2 h-4 w-4 shrink-0 text-muted-foreground" />
              <span className="min-w-0 flex-1">
                <span className="block truncate">{a.companyName}</span>
                <span className="block truncate text-xs text-muted-foreground">
                  {a.userTypeId
                    ? t(USER_TYPE_LABELS[a.userTypeId] ?? "")
                    : a.email}
                </span>
              </span>
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setAddOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            {t("Add company")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("Add company")}</DialogTitle>
          </DialogHeader>
          <form action={link} className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {t("Sign in with the credentials of your other account to link it. You will then be able to switch companies without logging out.")}
            </p>
            <div className="space-y-2">
              <Label htmlFor="link-email">{t("Email")}</Label>
              <Input id="link-email" name="email" type="email" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="link-password">{t("Password")}</Label>
              <Input
                id="link-password"
                name="password"
                type="password"
                required
              />
            </div>
            {error && (
              <p className="text-sm text-destructive">
                {t(ERROR_MESSAGES[error] ?? ERROR_MESSAGES.invalid_credentials)}
              </p>
            )}
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setAddOpen(false)}
              >
                {t("Close")}
              </Button>
              <Button type="submit" disabled={pending}>
                {pending ? t("Please wait...") : t("Link account")}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
