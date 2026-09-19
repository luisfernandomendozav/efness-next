"use client";

import { useActionState, useRef, useState } from "react";
import { useT } from "@/i18n/use-t";
import {
  removeAvatarAction,
  updateAvatarAction,
} from "@/server/account-actions";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const ERROR_MESSAGES: Record<string, string> = {
  validation_error: "Please review the entered data",
  file_too_large: "The image must not exceed 2MB",
  invalid_file_type: "Invalid file type",
  upload_failed: "The file could not be uploaded",
};

export function AvatarForm({
  fullName,
  avatar,
}: {
  fullName: string;
  avatar: string | null;
}) {
  const t = useT();
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [state, formAction, pending] = useActionState(
    updateAvatarAction,
    undefined,
  );

  const initials = fullName
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  const shown = preview ?? avatar;

  return (
    <Card>
      <form action={formAction}>
        <CardHeader>
          <CardTitle>{t("Profile photo")}</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center gap-5 pt-4">
          <Avatar className="h-20 w-20">
            {shown && <AvatarImage src={shown} alt={fullName} />}
            <AvatarFallback className="text-lg">{initials}</AvatarFallback>
          </Avatar>
          <div className="space-y-2">
            <input
              ref={inputRef}
              type="file"
              name="avatar"
              accept="image/png,image/jpeg,image/webp,image/gif"
              className="block text-sm file:mr-3 file:rounded-md file:border-0 file:bg-secondary file:px-3 file:py-1.5 file:text-sm file:font-medium"
              onChange={(e) => {
                const file = e.target.files?.[0];
                setPreview(file ? URL.createObjectURL(file) : null);
              }}
            />
            <p className="text-xs text-muted-foreground">
              {t("Allowed file types: png, jpg, jpeg. Max 2MB")}
            </p>
            {state?.error && (
              <p className="text-sm text-destructive">
                {t(ERROR_MESSAGES[state.error] ?? ERROR_MESSAGES.upload_failed)}
              </p>
            )}
          </div>
        </CardContent>
        <CardFooter className="justify-end gap-2 pt-4">
          {avatar && (
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setPreview(null);
                if (inputRef.current) inputRef.current.value = "";
                removeAvatarAction();
              }}
            >
              {t("Remove")}
            </Button>
          )}
          <Button type="submit" disabled={pending}>
            {pending ? t("Please wait") : t("Save Changes")}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
