import Link from "next/link";
import { notFound } from "next/navigation";
import { Check, MapPin, ShoppingBag, Star, Users } from "lucide-react";
import { getT } from "@/i18n/get-t";
import { auth } from "@/server/auth";
import { getUserProfile } from "@/server/profile";
import { PostCard } from "@/components/dashboard/post-card";
import {
  AcceptRejectButtons,
  CancelRequestButton,
  ConnectButton,
} from "@/components/network/network-buttons";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default async function UserProfilePage({
  params,
}: PageProps<"/users/[id]">) {
  const [t, session, { id }] = await Promise.all([getT(), auth(), params]);

  const userId = Number(id);
  if (!Number.isInteger(userId) || userId <= 0) notFound();

  const viewerId = Number(session!.user.id);
  const profile = await getUserProfile(viewerId, userId);
  if (!profile) notFound();

  const initials = profile.name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <Card>
        <CardContent className="flex flex-col gap-5 sm:flex-row sm:items-start">
          <Avatar className="h-20 w-20">
            {(profile.avatar ?? profile.company?.logo) && (
              <AvatarImage
                src={(profile.avatar ?? profile.company?.logo)!}
                alt={profile.name}
              />
            )}
            <AvatarFallback className="text-xl">{initials}</AvatarFallback>
          </Avatar>

          <div className="min-w-0 flex-1 space-y-2">
            <div>
              <h1 className="text-2xl font-bold">{profile.name}</h1>
              <div className="text-muted-foreground">
                {profile.company?.name}
                {profile.userType && (
                  <> · {t(profile.userType)}</>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
              {profile.company?.location && (
                <span className="inline-flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" />
                  {profile.company.location}
                </span>
              )}
              <span className="inline-flex items-center gap-1">
                <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                {(profile.company?.rating ?? 0).toFixed(1)}/5 (
                {profile.company?.ratingCount ?? 0})
              </span>
              <span className="inline-flex items-center gap-1">
                <Users className="h-3.5 w-3.5" />
                {profile.alliesCount} {t("Allies").toLowerCase()}
              </span>
            </div>

            {profile.categories.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {profile.categories.map((c) => (
                  <Badge key={c} variant="secondary" className="text-xs">
                    {c}
                  </Badge>
                ))}
              </div>
            )}

            <div className="flex flex-wrap items-center gap-2 pt-1">
              {profile.relation === "none" && (
                <ConnectButton userId={profile.id} />
              )}
              {profile.relation === "sent" && (
                <CancelRequestButton requestId={profile.requestId!} />
              )}
              {profile.relation === "received" && (
                <AcceptRejectButtons requestId={profile.requestId!} />
              )}
              {profile.relation === "ally" && (
                <Badge className="gap-1">
                  <Check className="h-3.5 w-3.5" />
                  {t("Ally")}
                </Badge>
              )}
              {profile.company && (
                <Button size="sm" variant="secondary" asChild>
                  <Link
                    href={`/advanced-search/users?type=products&company=${profile.company.id}`}
                  >
                    <ShoppingBag className="mr-1 h-4 w-4" />
                    {t("View catalog")}
                  </Link>
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold">{t("Posts")}</h2>
        {profile.posts.map((post) => (
          <PostCard key={post.id} post={post} currentUserId={viewerId} />
        ))}
        {profile.posts.length === 0 && (
          <Card>
            <CardContent className="py-10 text-center text-muted-foreground">
              {t("No posts yet")}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
