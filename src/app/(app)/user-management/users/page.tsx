import Link from "next/link";
import { redirect } from "next/navigation";
import { getLocale } from "next-intl/server";
import { getT } from "@/i18n/get-t";
import { auth } from "@/server/auth";
import { getUsersAdmin } from "@/server/users-admin";
import { DeleteUserButton } from "@/components/user-management/delete-user-button";
import { UserFormDialog } from "@/components/user-management/user-form-dialog";
import { TableSearch } from "@/components/table-search";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

const SUPERADMIN_ROLE_ID = 1;
const USER_TYPE_LABELS: Record<number, string> = { 1: "Supplier", 2: "Buyer" };

export default async function UserManagementPage({
  searchParams,
}: PageProps<"/user-management/users">) {
  const [t, locale, session, query] = await Promise.all([
    getT(),
    getLocale(),
    auth(),
    searchParams,
  ]);
  if (session?.user.roleId !== SUPERADMIN_ROLE_ID) redirect("/dashboard");

  const search = typeof query.search === "string" ? query.search : "";
  const page = Math.max(1, Number(query.page) || 1);
  const { users, total, pageCount } = await getUsersAdmin(
    Number(session.user.id),
    search,
    page,
  );

  const dateFmt = new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  const qs = (p: number) =>
    `?${new URLSearchParams({ ...(search ? { search } : {}), page: String(p) })}`;

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t("User management")}</h1>
        <UserFormDialog />
      </div>
      <Card>
        <CardContent className="space-y-4">
          <TableSearch placeholder="Search user" />
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("Name")}</TableHead>
                <TableHead>{t("Company")}</TableHead>
                <TableHead>{t("User type")}</TableHead>
                <TableHead>{t("Two steps")}</TableHead>
                <TableHead>{t("Joined day")}</TableHead>
                <TableHead className="text-right">{t("Actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((u) => (
                <TableRow key={u.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9">
                        {u.avatar && (
                          <AvatarImage src={u.avatar} alt={u.fullName} />
                        )}
                        <AvatarFallback>
                          {u.fullName
                            .split(" ")
                            .map((p) => p[0])
                            .slice(0, 2)
                            .join("")
                            .toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{u.fullName}</div>
                        <div className="text-xs text-muted-foreground">
                          {u.email}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{u.companyName || "—"}</TableCell>
                  <TableCell>
                    {u.userTypeId ? (
                      <Badge variant="secondary">
                        {t(USER_TYPE_LABELS[u.userTypeId] ?? String(u.userTypeId))}
                      </Badge>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge
                      className={
                        u.twoFactorEnabled
                          ? "bg-[#dfffea] text-[#569842]"
                          : "bg-secondary text-muted-foreground"
                      }
                    >
                      {t(u.twoFactorEnabled ? "Enabled" : "Disabled")}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {u.createdAt ? dateFmt.format(new Date(u.createdAt)) : "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end">
                      <UserFormDialog user={u} />
                      <DeleteUserButton userId={u.id} userName={u.fullName} />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {users.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="py-10 text-center text-muted-foreground"
                  >
                    {t("No matching records found")}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          {pageCount > 1 && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                {total} · {page}/{pageCount}
              </span>
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  asChild
                  className={cn(page <= 1 && "pointer-events-none opacity-50")}
                >
                  <Link href={qs(page - 1)}>{t("Previous")}</Link>
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  asChild
                  className={cn(
                    page >= pageCount && "pointer-events-none opacity-50",
                  )}
                >
                  <Link href={qs(page + 1)}>{t("Next")}</Link>
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
