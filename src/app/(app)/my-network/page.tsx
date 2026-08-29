import Link from "next/link";
import { getT } from "@/i18n/get-t";
import { auth } from "@/server/auth";
import { getPotentialAllies } from "@/server/feed";
import {
  getAllies,
  getReceivedRequests,
  getSentRequests,
  type NetworkUser,
} from "@/server/network";
import {
  AcceptRejectButtons,
  CancelRequestButton,
  ConnectButton,
  RemoveAllyButton,
} from "@/components/network/network-buttons";
import { TableSearch } from "@/components/table-search";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

function initialsOf(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function UserInfo({
  user,
  size = "md",
  t,
}: {
  user: NetworkUser;
  size?: "sm" | "md";
  t: (key: string) => string;
}) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <Avatar className={size === "sm" ? "h-10 w-10" : "h-12 w-12"}>
        {user.avatar && <AvatarImage src={user.avatar} alt={user.name} />}
        <AvatarFallback>{initialsOf(user.name)}</AvatarFallback>
      </Avatar>
      <div className="min-w-0">
        <div className="truncate font-semibold">{user.name}</div>
        <div className="truncate text-xs text-muted-foreground">
          {[user.companyName, user.userType && t(user.userType)]
            .filter(Boolean)
            .join(" · ")}
        </div>
      </div>
    </div>
  );
}

export default async function MyNetworkPage({
  searchParams,
}: PageProps<"/my-network">) {
  const [t, session, query] = await Promise.all([getT(), auth(), searchParams]);
  const userId = Number(session!.user.id);
  const tab = query.tab === "allies" ? "allies" : "potential";
  const search = typeof query.search === "string" ? query.search : "";

  const [potential, allies, received, sent] = await Promise.all([
    getPotentialAllies(userId, 12),
    getAllies(userId, search),
    getReceivedRequests(userId),
    getSentRequests(userId),
  ]);

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <h1 className="text-2xl font-bold">{t("My Network")}</h1>
      <div className="grid gap-5 lg:grid-cols-[1fr_340px]">
        <div className="min-w-0 space-y-4">
          <div className="flex gap-1 border-b">
            {(
              [
                ["potential", "Potential Allies"],
                ["allies", "My Allies"],
              ] as const
            ).map(([key, label]) => (
              <Link
                key={key}
                href={`/my-network?tab=${key}`}
                className={cn(
                  "border-b-2 px-4 py-2 text-sm font-semibold transition-colors",
                  tab === key
                    ? "border-primary text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground",
                )}
              >
                {t(label)}
              </Link>
            ))}
          </div>

          {tab === "potential" ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {potential.map((ally) => (
                <Card key={ally.id}>
                  <CardContent className="flex flex-col items-center gap-3 text-center">
                    <Avatar className="h-14 w-14">
                      {ally.avatar && (
                        <AvatarImage src={ally.avatar} alt={ally.name} />
                      )}
                      <AvatarFallback>{initialsOf(ally.name)}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <div className="truncate font-semibold">{ally.name}</div>
                      <div className="truncate text-xs text-muted-foreground">
                        {[ally.companyName, ally.userType && t(ally.userType)]
                          .filter(Boolean)
                          .join(" · ")}
                      </div>
                    </div>
                    <ConnectButton userId={ally.id} />
                  </CardContent>
                </Card>
              ))}
              {potential.length === 0 && (
                <p className="col-span-full py-10 text-center text-muted-foreground">
                  {t("No potential allies found")}
                </p>
              )}
            </div>
          ) : (
            <Card>
              <CardContent className="space-y-4">
                <TableSearch placeholder="Search allies" />
                <div className="max-h-[550px] space-y-3 overflow-y-auto">
                  {allies.map((ally) => (
                    <div
                      key={ally.id}
                      className="flex items-center justify-between gap-3 rounded-md border p-3"
                    >
                      <UserInfo user={ally} t={t} />
                      <RemoveAllyButton allyId={ally.id} allyName={ally.name} />
                    </div>
                  ))}
                  {allies.length === 0 && (
                    <p className="py-10 text-center text-muted-foreground">
                      {t("No allies yet")}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-5">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                {t("Received Ally Requests")}
              </CardTitle>
            </CardHeader>
            <CardContent className="max-h-80 space-y-4 overflow-y-auto">
              {received.map((req) => (
                <div key={req.id} className="space-y-2">
                  <UserInfo user={req.user} size="sm" t={t} />
                  <AcceptRejectButtons requestId={req.id} />
                </div>
              ))}
              {received.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  {t("No pending ally requests")}
                </p>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                {t("Sent Ally Requests")}
              </CardTitle>
            </CardHeader>
            <CardContent className="max-h-80 space-y-4 overflow-y-auto">
              {sent.map((req) => (
                <div
                  key={req.id}
                  className="flex items-center justify-between gap-2"
                >
                  <UserInfo user={req.user} size="sm" t={t} />
                  <CancelRequestButton requestId={req.id} />
                </div>
              ))}
              {sent.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  {t("No sent ally requests")}
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
