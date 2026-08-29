"use client";

import { useState, useTransition } from "react";
import { Check, UserMinus, UserPlus, X } from "lucide-react";
import { useT } from "@/i18n/use-t";
import { sendAllyRequestAction } from "@/server/feed-actions";
import {
  acceptRequestAction,
  cancelRequestAction,
  rejectRequestAction,
  removeAllyAction,
} from "@/server/network-actions";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

export function ConnectButton({ userId }: { userId: number }) {
  const t = useT();
  const [pending, startTransition] = useTransition();
  return (
    <Button
      size="sm"
      disabled={pending}
      onClick={() => startTransition(() => sendAllyRequestAction(userId))}
    >
      <UserPlus className="mr-1 h-4 w-4" />
      {t("Connect")}
    </Button>
  );
}

export function AcceptRejectButtons({ requestId }: { requestId: number }) {
  const t = useT();
  const [pending, startTransition] = useTransition();
  return (
    <div className="flex gap-1.5">
      <Button
        size="sm"
        disabled={pending}
        onClick={() => startTransition(() => acceptRequestAction(requestId))}
      >
        <Check className="mr-1 h-4 w-4" />
        {t("Accept")}
      </Button>
      <Button
        size="sm"
        variant="secondary"
        disabled={pending}
        className="text-destructive"
        onClick={() => startTransition(() => rejectRequestAction(requestId))}
      >
        <X className="mr-1 h-4 w-4" />
        {t("Reject")}
      </Button>
    </div>
  );
}

export function CancelRequestButton({ requestId }: { requestId: number }) {
  const t = useT();
  const [pending, startTransition] = useTransition();
  return (
    <Button
      size="sm"
      variant="secondary"
      disabled={pending}
      className="text-destructive"
      onClick={() => startTransition(() => cancelRequestAction(requestId))}
    >
      {t("Cancel Request")}
    </Button>
  );
}

export function RemoveAllyButton({
  allyId,
  allyName,
}: {
  allyId: number;
  allyName: string;
}) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button size="sm" variant="secondary" className="text-destructive">
          <UserMinus className="mr-1 h-4 w-4" />
          {t("Remove Ally")}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("Are you sure?")}</AlertDialogTitle>
          <AlertDialogDescription>
            {t("Do you want to remove this ally?")} ({allyName})
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t("Cancel")}</AlertDialogCancel>
          <AlertDialogAction
            disabled={pending}
            onClick={(e) => {
              e.preventDefault();
              startTransition(async () => {
                await removeAllyAction(allyId);
                setOpen(false);
              });
            }}
            className="bg-destructive text-white hover:bg-destructive/90"
          >
            {pending ? t("Please wait...") : t("Yes, remove!")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
