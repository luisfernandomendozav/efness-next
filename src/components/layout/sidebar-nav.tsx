"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useT } from "@/i18n/use-t";
import {
  Gavel,
  Home,
  Package,
  Search,
  BarChart3,
  Users,
  UserCog,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Mismo menú que SidebarMenuMain.tsx del frontend legacy.
const NAV_ITEMS = [
  { href: "/dashboard", key: "Home", icon: Home },
  { href: "/biddings", key: "Biddings", icon: Gavel },
  { href: "/products/catalog", key: "Catalog", icon: Package },
  { href: "/advanced-search/users", key: "Searcher", icon: Search },
  { href: "/reports", key: "Reports", icon: BarChart3 },
  { href: "/my-network", key: "Allies", icon: Users },
] as const;

const ADMIN_ITEM = {
  href: "/user-management/users",
  key: "Users",
  icon: UserCog,
};

export function SidebarNav({ isSuperadmin }: { isSuperadmin: boolean }) {
  const pathname = usePathname();
  const t = useT();
  const items = isSuperadmin ? [...NAV_ITEMS, ADMIN_ITEM] : [...NAV_ITEMS];

  return (
    <nav className="flex flex-col gap-1 p-3">
      {items.map(({ href, key, icon: Icon }) => {
        const active = pathname.startsWith(
          href.split("/").slice(0, 2).join("/"),
        );
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
              active
                ? "bg-white/10 text-white"
                : "text-white/60 hover:bg-white/5 hover:text-white",
            )}
          >
            <Icon
              className={cn("h-4 w-4 shrink-0", active && "text-primary")}
            />
            {t(key)}
          </Link>
        );
      })}
    </nav>
  );
}
