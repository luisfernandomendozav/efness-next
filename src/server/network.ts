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

type AllyRow = {
  id: number;
  name: string;
  last_name: string;
  avatar: string | null;
  company_name: string | null;
  user_type_name: string | null;
};

// Réplica de FriendshipService::getFriends: usuarios unidos por friendships
// en cualquier dirección, con búsqueda insensible a mayúsculas y acentos.
export async function getAllies(userId: number, search: string) {
  const rows = search
    ? await db.$queryRaw<AllyRow[]>`
        SELECT u.id, u.name, u.last_name, u.avatar,
               c.name AS company_name, ut.name AS user_type_name
        FROM users u
        LEFT JOIN companies c ON u.company_id = c.id
        LEFT JOIN user_types ut ON u.user_type_id = ut.id
        WHERE (
          EXISTS (SELECT 1 FROM friendships f WHERE f.user_id = ${userId} AND f.friend_id = u.id)
          OR EXISTS (SELECT 1 FROM friendships f WHERE f.friend_id = ${userId} AND f.user_id = u.id)
        )
        AND (
          unaccent(u.name) ILIKE unaccent(${`%${search}%`})
          OR unaccent(u.last_name) ILIKE unaccent(${`%${search}%`})
          OR unaccent(COALESCE(c.name, '')) ILIKE unaccent(${`%${search}%`})
        )
        ORDER BY u.name ASC
      `
    : await db.$queryRaw<AllyRow[]>`
        SELECT u.id, u.name, u.last_name, u.avatar,
               c.name AS company_name, ut.name AS user_type_name
        FROM users u
        LEFT JOIN companies c ON u.company_id = c.id
        LEFT JOIN user_types ut ON u.user_type_id = ut.id
        WHERE (
          EXISTS (SELECT 1 FROM friendships f WHERE f.user_id = ${userId} AND f.friend_id = u.id)
          OR EXISTS (SELECT 1 FROM friendships f WHERE f.friend_id = ${userId} AND f.user_id = u.id)
        )
        ORDER BY u.name ASC
      `;

  return rows.map((r) => ({
    id: r.id,
    name: `${r.name} ${r.last_name}`.trim(),
    avatar: r.avatar,
    companyName: r.company_name ?? null,
    userType: r.user_type_name ?? null,
  }));
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
