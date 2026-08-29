"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { useLocale } from "next-intl";
import { Globe, Heart, MessageCircle, MoreHorizontal, Trash2, Users } from "lucide-react";
import { useT } from "@/i18n/use-t";
import type { FeedPost } from "@/server/feed";
import {
  addCommentAction,
  deletePostAction,
  toggleLikeAction,
} from "@/server/feed-actions";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

function initialsOf(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function useRelativeTime(iso: string) {
  const locale = useLocale();
  if (!iso) return "";
  const diffMs = Date.now() - new Date(iso).getTime();
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
  const minutes = Math.round(diffMs / 60_000);
  if (minutes < 60) return rtf.format(-minutes, "minute");
  const hours = Math.round(minutes / 60);
  if (hours < 24) return rtf.format(-hours, "hour");
  const days = Math.round(hours / 24);
  if (days < 30) return rtf.format(-days, "day");
  return new Date(iso).toLocaleDateString(locale, {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function CommentForm({ postId }: { postId: number }) {
  const t = useT();
  const formRef = useRef<HTMLFormElement>(null);
  const boundAction = addCommentAction.bind(null, postId);
  const [state, formAction, pending] = useActionState(boundAction, undefined);

  useEffect(() => {
    if (state === undefined && !pending) formRef.current?.reset();
  }, [state, pending]);

  return (
    <form ref={formRef} action={formAction} className="flex gap-2">
      <Input
        name="content"
        required
        placeholder={`${t("Comment")}...`}
        className="h-9"
      />
      <Button type="submit" size="sm" variant="secondary" disabled={pending}>
        {t("Comment")}
      </Button>
    </form>
  );
}

export function PostCard({
  post,
  currentUserId,
}: {
  post: FeedPost;
  currentUserId: number;
}) {
  const t = useT();
  const createdAt = useRelativeTime(post.createdAt);
  const [showComments, setShowComments] = useState(false);
  const [likePending, startLike] = useTransition();
  const [deletePending, startDelete] = useTransition();
  const isOwn = post.userId === currentUserId;
  const VisibilityIcon = post.visibility === "public" ? Globe : Users;

  return (
    <Card className={cn("gap-4", deletePending && "opacity-50")}>
      <CardHeader className="flex flex-row items-start gap-3">
        <Avatar className="h-12 w-12">
          {post.avatar && <AvatarImage src={post.avatar} alt={post.username} />}
          <AvatarFallback>{initialsOf(post.username)}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <div className="font-semibold">{post.username}</div>
          <div className="text-sm text-muted-foreground">
            {post.companyName}
            {post.alliesCount > 0 && (
              <> · {post.alliesCount} {t("Allies").toLowerCase()}</>
            )}
          </div>
          <div className="flex items-center gap-1 text-xs text-[#57aadf]">
            {createdAt} <VisibilityIcon className="h-3 w-3" />
          </div>
        </div>
        {isOwn && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                variant="destructive"
                onClick={() => startDelete(() => deletePostAction(post.id))}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                {t("Delete")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="whitespace-pre-wrap text-[15px]">{post.text}</p>
        {post.originalPost && (
          <div className="rounded-md border bg-muted/40 p-3">
            <div className="text-sm font-semibold">
              {post.originalPost.username}
              <span className="ml-2 font-normal text-muted-foreground">
                {post.originalPost.companyName}
              </span>
            </div>
            <p className="mt-1 whitespace-pre-wrap text-sm">
              {post.originalPost.text}
            </p>
          </div>
        )}
        <div className="flex gap-4 text-sm text-muted-foreground">
          <span>{post.likes} {t("Like").toLowerCase()}</span>
          <span>{post.comments.length} {t("Comments").toLowerCase()}</span>
          {post.shares > 0 && <span>{post.shares} {t("Share").toLowerCase()}</span>}
        </div>
      </CardContent>
      <CardFooter className="flex-col items-stretch gap-3">
        <Separator />
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            disabled={likePending}
            onClick={() => startLike(() => toggleLikeAction(post.id))}
            className={cn(post.likedByUser && "text-destructive")}
          >
            <Heart
              className={cn("mr-1 h-4 w-4", post.likedByUser && "fill-current")}
            />
            {t("Like")}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowComments((v) => !v)}
          >
            <MessageCircle className="mr-1 h-4 w-4" />
            {t("Comment")}
          </Button>
        </div>
        {showComments && (
          <div className="space-y-3">
            {post.comments.map((c) => (
              <div key={c.id} className="flex items-start gap-2">
                <Avatar className="h-8 w-8">
                  {c.avatar && <AvatarImage src={c.avatar} alt={c.username} />}
                  <AvatarFallback className="text-xs">
                    {initialsOf(c.username)}
                  </AvatarFallback>
                </Avatar>
                <div className="rounded-md bg-muted/60 px-3 py-2 text-sm">
                  <span className="font-semibold">{c.username}</span>
                  {c.companyName && (
                    <span className="ml-2 text-xs text-muted-foreground">
                      {c.companyName}
                    </span>
                  )}
                  <p className="mt-0.5 whitespace-pre-wrap">{c.text}</p>
                </div>
              </div>
            ))}
            <CommentForm postId={post.id} />
          </div>
        )}
      </CardFooter>
    </Card>
  );
}
