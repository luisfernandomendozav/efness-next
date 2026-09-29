import type { Prisma } from "@/generated/prisma/client";
import { db } from "@/server/db";

export const FEED_PAGE_SIZE = 10;

// A diferencia del backend legacy (públicos + aliados), el feed muestra solo
// publicaciones propias y de aliados (feedback presentación 2026-09).

export async function getFriendIds(userId: number) {
  const rows = await db.friendship.findMany({
    where: { OR: [{ userId }, { friendId: userId }] },
    select: { userId: true, friendId: true },
  });
  return rows.map((r) => (r.userId === userId ? r.friendId : r.userId));
}

const postInclude = (viewerId: number) =>
  ({
    user: { select: { id: true, name: true, lastName: true, avatar: true } },
    company: { select: { name: true, logo: true } },
    comments: {
      orderBy: { createdAt: "asc" as const },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            lastName: true,
            avatar: true,
            company: { select: { name: true } },
          },
        },
      },
    },
    postLikes: { where: { userId: viewerId }, select: { id: true } },
    originalPost: {
      include: {
        user: { select: { id: true, name: true, lastName: true, avatar: true } },
        company: { select: { name: true, logo: true } },
      },
    },
  }) as const;

function fetchPosts(
  viewerId: number,
  where: Prisma.PostWhereInput,
  take: number,
) {
  return db.post.findMany({
    where,
    include: postInclude(viewerId),
    orderBy: { createdAt: "desc" },
    take,
  });
}

type PostRow = Awaited<ReturnType<typeof fetchPosts>>[number];

function mapPost(p: PostRow, alliesCount: Map<number, number>) {
  return {
    id: p.id,
    userId: p.userId,
    username: `${p.user.name} ${p.user.lastName}`.trim(),
    avatar: p.user.avatar,
    companyName: p.company.name,
    logo: p.company.logo,
    text: p.content,
    image: p.image,
    visibility: p.visibility,
    createdAt: p.createdAt?.toISOString() ?? "",
    likes: p.likesCount,
    shares: p.sharesCount,
    likedByUser: p.postLikes.length > 0,
    alliesCount: alliesCount.get(p.userId) ?? 0,
    comments: p.comments.map((c) => ({
      id: c.id,
      userId: c.userId,
      username: `${c.user.name} ${c.user.lastName}`.trim(),
      companyName: c.user.company?.name ?? "",
      avatar: c.user.avatar,
      text: c.content,
      createdAt: c.createdAt?.toISOString() ?? "",
    })),
    originalPost: p.originalPost
      ? {
          id: p.originalPost.id,
          username:
            `${p.originalPost.user.name} ${p.originalPost.user.lastName}`.trim(),
          companyName: p.originalPost.company.name,
          text: p.originalPost.content,
          image: p.originalPost.image,
          createdAt: p.originalPost.createdAt?.toISOString() ?? "",
        }
      : null,
  };
}

export async function getFeed(viewerId: number, pages = 1) {
  const friendIds = await getFriendIds(viewerId);
  const where = {
    userId: { in: [...friendIds, viewerId] },
  };

  const [posts, total] = await Promise.all([
    fetchPosts(viewerId, where, pages * FEED_PAGE_SIZE),
    db.post.count({ where }),
  ]);

  const authorIds = [...new Set(posts.map((p) => p.userId))];
  const authorFriendships = await db.friendship.findMany({
    where: {
      OR: [{ userId: { in: authorIds } }, { friendId: { in: authorIds } }],
    },
    select: { userId: true, friendId: true },
  });
  const alliesCount = new Map<number, number>();
  for (const f of authorFriendships) {
    for (const id of [f.userId, f.friendId]) {
      if (authorIds.includes(id)) {
        alliesCount.set(id, (alliesCount.get(id) ?? 0) + 1);
      }
    }
  }

  return {
    hasAllies: friendIds.length > 0,
    posts: posts.map((p) => mapPost(p, alliesCount)),
    hasMore: total > pages * FEED_PAGE_SIZE,
  };
}

// Publicaciones del perfil de un usuario: todas si el que mira es el propio
// usuario o un aliado; solo las públicas en caso contrario (como el legacy
// ProfilePage, que filtraba visibility en el cliente).
export async function getUserPosts(
  viewerId: number,
  authorId: number,
  includeAlliesOnly: boolean,
  authorAlliesCount: number,
) {
  const posts = await fetchPosts(
    viewerId,
    {
      userId: authorId,
      ...(includeAlliesOnly ? {} : { visibility: "public" as const }),
    },
    FEED_PAGE_SIZE,
  );
  const alliesCount = new Map([[authorId, authorAlliesCount]]);
  return posts.map((p) => mapPost(p, alliesCount));
}

export type FeedResult = Awaited<ReturnType<typeof getFeed>>;
export type FeedPost = FeedResult["posts"][number];

// Réplica de FriendshipService::getPotentialAllies: usuarios activos que no
// son el propio usuario, ni aliados actuales, ni tienen solicitud pendiente.
// Con búsqueda por nombre o empresa (feedback presentación 2026-09-26,
// lámina 4), igual que "Mis aliados".
export async function getPotentialAllies(
  viewerId: number,
  limit = 9,
  search = "",
) {
  const [friendIds, pending] = await Promise.all([
    getFriendIds(viewerId),
    db.friendRequest.findMany({
      where: {
        status: "pending",
        OR: [{ senderId: viewerId }, { receiverId: viewerId }],
      },
      select: { senderId: true, receiverId: true },
    }),
  ]);
  const excluded = [
    viewerId,
    ...friendIds,
    ...pending.map((r) => (r.senderId === viewerId ? r.receiverId : r.senderId)),
  ];

  const s = search
    ? { contains: search, mode: "insensitive" as const }
    : null;
  const users = await db.user.findMany({
    where: {
      id: { notIn: excluded },
      accountStatus: "active",
      ...(s
        ? { OR: [{ name: s }, { lastName: s }, { company: { name: s } }] }
        : {}),
    },
    select: {
      id: true,
      name: true,
      lastName: true,
      avatar: true,
      company: { select: { name: true, logo: true } },
      userType: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  return users.map((u) => ({
    id: u.id,
    name: `${u.name} ${u.lastName}`.trim(),
    avatar: u.avatar,
    companyName: u.company?.name ?? null,
    userType: u.userType?.name ?? null,
  }));
}

export type PotentialAlly = Awaited<
  ReturnType<typeof getPotentialAllies>
>[number];
