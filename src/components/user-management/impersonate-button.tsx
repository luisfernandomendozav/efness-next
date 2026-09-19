"use client";

import { LogIn } from "lucide-react";
import { useT } from "@/i18n/use-t";
import { impersonateUserAction } from "@/server/impersonation-actions";
import { Button } from "@/components/ui/button";

export function ImpersonateButton({
  userId,
  userName,
}: {
  userId: number;
  userName: string;
}) {
  const t = useT();
  return (
    <Button
      variant="ghost"
      size="sm"
      className="h-8 w-8 p-0"
      title={`${t("Sign in as")}: ${userName}`}
      onClick={() => impersonateUserAction(userId)}
    >
      <LogIn className="h-4 w-4" />
    </Button>
  );
}
