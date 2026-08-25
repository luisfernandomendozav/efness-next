"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useT } from "@/i18n/use-t";
import {
  Gavel,
  LayoutDashboard,
  MessageSquare,
  Package,
  Search,
  BarChart3,
  Users,
  UserCog,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/dashboard", key: "Dashboard", icon: LayoutDashboard },
  { href: "/biddings", key: "Biddings", icon: Gavel },
  { href: "/products", key: "Products", icon: Package },
  { href: "/my-network", key: "My Network", icon: Users },
  { href: "/advanced-search", key: "Advanced Search", icon: Search },
  { href: "/reports", key: "Reports", icon: BarChart3 },
  { href: "/chat", key: "Chat", icon: MessageSquare },
] as const;

const ADMIN_ITEM = { href: "/user-management", key: "User Management", icon: UserCog };

export function SidebarNav({ isSuperadmin }: { isSuperadmin: boolean }) {
  const pathname = usePathname();
  const t = useT();
  const items = isSuperadmin ? [...NAV_ITEMS, ADMIN_ITEM] : [...NAV_ITEMS];

  return (
    <nav className="flex flex-col gap-1 p-2">
      {items.map(({ href, key, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          className={cn(
            "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
            pathname.startsWith(href)
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-muted hover:text-foreground",
          )}
        >
          <Icon className="h-4 w-4 shrink-0" />
          {t(key)}
        </Link>
      ))}
    </nav>
  );
}
