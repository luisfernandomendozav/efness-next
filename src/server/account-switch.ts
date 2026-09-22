import { db } from "@/server/db";

// Cuentas vinculadas del Panel Global (solo lectura; las mutaciones viven en
// account-switch-actions.ts).
export async function getLinkedAccounts(userId: number) {
  const links = await db.userLinkedAccount.findMany({
    where: { userId, linkedUser: { accountStatus: { not: "deactivated" } } },
    include: {
      linkedUser: {
        select: {
          id: true,
          name: true,
          lastName: true,
          email: true,
          userTypeId: true,
          company: { select: { name: true } },
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });
  return links.map((l) => ({
    userId: l.linkedUser.id,
    name: `${l.linkedUser.name} ${l.linkedUser.lastName}`.trim(),
    email: l.linkedUser.email,
    userTypeId: l.linkedUser.userTypeId,
    companyName: l.linkedUser.company?.name ?? l.linkedUser.email,
  }));
}

export type LinkedAccount = Awaited<
  ReturnType<typeof getLinkedAccounts>
>[number];
