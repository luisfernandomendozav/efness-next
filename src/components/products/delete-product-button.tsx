"use client";

import { useState, useTransition } from "react";
import { Trash2 } from "lucide-react";
import { useT } from "@/i18n/use-t";
import { deleteProductAction } from "@/server/product-actions";
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

export function DeleteProductButton({
  productId,
  productName,
}: {
  productId: number;
  productName: string;
}) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 text-destructive hover:text-destructive"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("Delete")}</AlertDialogTitle>
          <AlertDialogDescription className="line-clamp-2">
            {t("Are you sure you want to delete?")} ({productName})
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t("Cancel")}</AlertDialogCancel>
          <AlertDialogAction
            disabled={pending}
            onClick={(e) => {
              e.preventDefault();
              startTransition(async () => {
                await deleteProductAction(productId);
                setOpen(false);
              });
            }}
            className="bg-destructive text-white hover:bg-destructive/90"
          >
            {pending ? t("Please wait...") : t("Delete")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
