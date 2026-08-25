import { redirect } from "next/navigation";
import { auth } from "@/server/auth";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import { UserMenu } from "@/components/layout/user-menu";

const SUPERADMIN_ROLE_ID = 1;

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user || session.user.twoFactorPending) redirect("/login");

  return (
    <div className="flex min-h-screen flex-1">
      <aside className="hidden w-60 shrink-0 border-r bg-background md:block">
        <div className="flex h-14 items-center border-b px-5">
          <span className="text-lg font-bold tracking-tight">efness</span>
        </div>
        <SidebarNav
          isSuperadmin={session.user.roleId === SUPERADMIN_ROLE_ID}
        />
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 items-center justify-end gap-2 border-b bg-background px-4">
          <UserMenu
            name={session.user.name ?? ""}
            email={session.user.email ?? ""}
            image={session.user.image}
          />
        </header>
        <main className="flex-1 bg-muted/40 p-6">{children}</main>
      </div>
    </div>
  );
}
