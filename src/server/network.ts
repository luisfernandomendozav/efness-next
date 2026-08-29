import type { Prisma } from "@/generated/prisma/client";
import { db } from "@/server/db";

const userSelect = {
  id: true,
  name: true,
  lastName: true,
  avatar: true,
  company: { select: { name: true, logo: true } },
  userType: { select: { name: true } },
} satisfies Prisma.UserSelect;

type NetworkUserRecord = Prisma.UserGetPayload<{ select: typeof userSelect }>;

function toNetworkUser(u: NetworkUserRecord) {
  return {
    id: u.id,
    name: `${u.name} ${u.lastName}`.trim(),
    avatar: u.avatar,
    companyName: u.company?.name ?? null,
    userType: u.userType?.name ?? null,
  };
}

export type NetworkUser = ReturnType<typeof toNetworkUser>;

// Réplica de FriendshipService::getFriends: usuarios unidos por friendships
// en cualquier dirección, con búsqueda por nombre o empresa.
export async function getAllies(userId: number, search: string) {
  const s = search
    ? { contains: search, mode: "insensitive" as const }
    : null;
  const rows = await db.user.findMany({
    where: {
      OR: [
        { friendshipsAsFriend: { some: { userId } } },
        { friendshipsAsUser: { some: { friendId: userId } } },
      ],
      ...(s
        ? {
            AND: [
              {
                OR: [
                  { name: s },
                  { lastName: s },
                  { company: { name: s } },
                ],
              },
            ],
          }
        : {}),
    },
    select: userSelect,
    orderBy: { name: "asc" },
  });
  return rows.map(toNetworkUser);
}

export async function getReceivedRequests(userId: number) {
  const rows = await db.friendRequest.findMany({
    where: { receiverId: userId, status: "pending" },
    select: { id: true, sender: { select: userSelect } },
    orderBy: { createdAt: "desc" },
  });
  return rows.map((r) => ({ id: r.id, user: toNetworkUser(r.sender) }));
}

export async function getSentRequests(userId: number) {
  const rows = await db.friendRequest.findMany({
    where: { senderId: userId, status: "pending" },
    select: { id: true, receiver: { select: userSelect } },
    orderBy: { createdAt: "desc" },
  });
  return rows.map((r) => ({ id: r.id, user: toNetworkUser(r.receiver) }));
}

export type NetworkRequest = Awaited<
  ReturnType<typeof getReceivedRequests>
>[number];
