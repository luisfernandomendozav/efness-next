"use client";

import { useActionState, useEffect, useRef } from "react";
import { useT } from "@/i18n/use-t";
import { createPostAction } from "@/server/feed-actions";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const ERROR_MESSAGES: Record<string, string> = {
  invalid_post: "Please write something before posting.",
  no_company: "Your user has no company assigned, so it cannot publish posts.",
};

export function PostComposer({
  userName,
  avatar,
}: {
  userName: string;
  avatar?: string | null;
}) {
  const t = useT();
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, pending] = useActionState(
    createPostAction,
    undefined,
  );

  useEffect(() => {
    if (state === undefined && !pending) formRef.current?.reset();
  }, [state, pending]);

  const initials = userName
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <Card>
      <CardContent className="pt-0">
        <form ref={formRef} action={formAction} className="space-y-3">
          <div className="flex items-start gap-3">
            <Avatar className="h-10 w-10">
              {avatar && <AvatarImage src={avatar} alt={userName} />}
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <textarea
              name="content"
              required
              maxLength={5000}
              rows={2}
              placeholder={`${t("What do you want to share")}, ${userName}?`}
              className="min-h-16 w-full resize-y rounded-md border border-input bg-muted/50 px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring/50"
            />
          </div>
          {state?.error && (
            <p className="text-sm text-destructive">
              {t(ERROR_MESSAGES[state.error] ?? state.error)}
            </p>
          )}
          <div className="flex items-center justify-end gap-3">
            <select
              name="visibility"
              defaultValue="public"
              className="h-9 rounded-md border border-input bg-background px-2 text-sm"
            >
              <option value="public">{t("Public")}</option>
              <option value="allies">{t("Allies")}</option>
            </select>
            <Button type="submit" disabled={pending}>
              {pending ? t("Please wait...") : t("Post")}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
