import type { Prisma } from "@/generated/prisma/client";
import { db } from "@/server/db";

export const USERS_PAGE_SIZE = 10;

export const SUPERADMIN_ROLE_ID = 1;

// Réplica de UserRepository::allWithRelationsExcept. Como el legacy, la
// gestión de usuarios es de la empresa del superadmin: un superadmin y sus
// usuarios (feedback presentación 2026-09-26, lámina 3). Incluye al propio
// superadmin para que quede claro quién es. Un superadmin sin empresa
// (operación de la plataforma) sigue viendo todos.
export async function getUsersAdmin(
  viewerId: number,
  viewerCompanyId: number | null,
  search: string,
  page: number,
) {
  const s = search
    ? { contains: search, mode: "insensitive" as const }
    : null;
  const where: Prisma.UserWhereInput = {
    ...(viewerCompanyId === null ? {} : { companyId: viewerCompanyId }),
    ...(s ? { OR: [{ name: s }, { lastName: s }, { email: s }] } : {}),
  };

  const [rows, total] = await Promise.all([
    db.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        lastName: true,
        email: true,
        avatar: true,
        userTypeId: true,
        roleId: true,
        twoFactorAuthenticationEnabled: true,
        createdAt: true,
        userType: { select: { name: true } },
        company: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
      take: USERS_PAGE_SIZE,
      skip: (page - 1) * USERS_PAGE_SIZE,
    }),
    db.user.count({ where }),
  ]);

  return {
    users: rows.map((u) => ({
      id: u.id,
      name: u.name,
      lastName: u.lastName,
      fullName: `${u.name} ${u.lastName}`.trim(),
      email: u.email,
      avatar: u.avatar,
      userTypeId: u.userTypeId,
      userTypeName: u.userType?.name ?? null,
      isSuperadmin: u.roleId === SUPERADMIN_ROLE_ID,
      companyName: u.company?.name ?? null,
      twoFactorEnabled: u.twoFactorAuthenticationEnabled,
      createdAt: u.createdAt?.toISOString() ?? null,
    })),
    total,
    pageCount: Math.max(1, Math.ceil(total / USERS_PAGE_SIZE)),
  };
}

export type AdminUserRow = Awaited<
  ReturnType<typeof getUsersAdmin>
>["users"][number];
