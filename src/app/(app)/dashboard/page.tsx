import Link from "next/link";
import { getT } from "@/i18n/get-t";
import { auth } from "@/server/auth";
import { getFeed, getPotentialAllies } from "@/server/feed";
import { PostComposer } from "@/components/dashboard/post-composer";
import { PostCard } from "@/components/dashboard/post-card";
import { PotentialAllies } from "@/components/dashboard/potential-allies";
import { SponsoredAd } from "@/components/dashboard/sponsored-ad";
import { ExchangeRates } from "@/components/dashboard/exchange-rates";
import { Button } from "@/components/ui/button";

export default async function DashboardPage({
  searchParams,
}: PageProps<"/dashboard">) {
  const [t, session, params] = await Promise.all([
    getT(),
    auth(),
    searchParams,
  ]);
  const userId = Number(session!.user.id);
  const pages = Math.max(1, Number(params.pages) || 1);

  const [feed, allies] = await Promise.all([
    getFeed(userId, pages),
    getPotentialAllies(userId),
  ]);

  return (
    <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[1fr_320px]">
      <div className="min-w-0 space-y-5">
        <PostComposer
          userName={session!.user.name ?? ""}
          avatar={session!.user.image}
        />
        {feed.posts.map((post) => (
          <PostCard key={post.id} post={post} currentUserId={userId} />
        ))}
        {feed.posts.length === 0 &&
          (feed.hasAllies ? (
            <p className="py-10 text-center text-muted-foreground">
              {t("No results found")}
            </p>
          ) : (
            <div className="space-y-3 py-10 text-center">
              <p className="text-muted-foreground">
                {t("You don't have allies yet. Add allies to see their posts here.")}
              </p>
              <Button asChild variant="secondary">
                <Link href="/my-network">{t("Add allies")}</Link>
              </Button>
            </div>
          ))}
        {feed.hasMore && (
          <div className="text-center">
            <Button variant="secondary" asChild>
              <Link href={`/dashboard?pages=${pages + 1}`} scroll={false}>
                {t("Load more")}
              </Link>
            </Button>
          </div>
        )}
      </div>
      <div className="space-y-5 lg:sticky lg:top-6 lg:self-start">
        <SponsoredAd />
        <ExchangeRates />
        <PotentialAllies allies={allies} />
      </div>
    </div>
  );
}
