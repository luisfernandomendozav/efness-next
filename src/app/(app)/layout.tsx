import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getLocale } from "next-intl/server";
import { getT } from "@/i18n/get-t";
import { auth } from "@/server/auth";
import { getLinkedAccounts } from "@/server/account-switch";
import { db } from "@/server/db";
import { ChatDock } from "@/components/chat/chat-dock";
import { CompanySwitcher } from "@/components/layout/company-switcher";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import { SidebarRates } from "@/components/layout/sidebar-rates";
import { UserMenu } from "@/components/layout/user-menu";
import { Badge } from "@/components/ui/badge";

const SUPERADMIN_ROLE_ID = 1;
const USER_TYPE_LABELS: Record<number, string> = { 1: "Seller", 2: "Buyer" };

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user || session.user.twoFactorPending) redirect("/login");

  const [t, locale, linkedAccounts, company] = await Promise.all([
    getT(),
    getLocale(),
    getLinkedAccounts(Number(session.user.id)),
    session.user.companyId
      ? db.company.findUnique({
          where: { id: session.user.companyId },
          select: { name: true },
        })
      : null,
  ]);
  const today = new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());
  const userTypeLabel = session.user.userTypeId
    ? USER_TYPE_LABELS[session.user.userTypeId]
    : null;

  return (
    <div className="flex min-h-screen flex-1">
      {/* Sticky a la altura del viewport para que los tipos de cambio queden
          siempre visibles al fondo del sidebar, como el legacy. */}
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col overflow-y-auto bg-[#1d2747] md:flex">
        <div className="flex h-16 items-center px-6">
          <Link href="/dashboard">
            <Image
              src="/efness-logo-dark.png"
              alt="eFness"
              width={231}
              height={61}
              className="h-8 w-auto"
              priority
            />
          </Link>
        </div>
        <SidebarNav isSuperadmin={session.user.roleId === SUPERADMIN_ROLE_ID} />
        <div className="mt-auto">
          <SidebarRates />
          {/* Panel Global "Cambiar empresa" (feedback 2026-09-21). */}
          <CompanySwitcher
            currentCompany={company?.name ?? session.user.email ?? ""}
            accounts={linkedAccounts}
          />
        </div>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 items-center justify-between border-b bg-background px-6">
          <span className="text-sm capitalize text-[#4c5774]">{today}</span>
          <div className="flex items-center gap-4">
            <div className="hidden items-end gap-3 text-right sm:flex sm:flex-col sm:gap-0">
              <span className="text-sm font-semibold leading-tight">
                {session.user.name}
                {userTypeLabel && (
                  <Badge className="ml-2 bg-[#dfffea] text-[#569842]">
                    {t(userTypeLabel)}
                  </Badge>
                )}
              </span>
              <span className="text-xs text-muted-foreground">
                {session.user.email}
              </span>
            </div>
            <UserMenu
              name={session.user.name ?? ""}
              email={session.user.email ?? ""}
              image={session.user.image}
              impersonating={session.user.impersonatorId !== null}
            />
          </div>
        </header>
        <main className="flex-1 bg-muted/40 p-6">{children}</main>
      </div>
      {/* Chat de aliados colapsado, disponible en toda la app
          (feedback presentación 2026-09-26, lámina 10). */}
      <ChatDock />
    </div>
  );
}
