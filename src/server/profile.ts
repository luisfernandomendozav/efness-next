import { db } from "@/server/db";
import { getUserPosts } from "@/server/feed";

// Perfil público de un usuario (pantalla que se abre desde el Buscador),
// como el ProfilePage del legacy: cabecera + publicaciones visibles según
// la relación con el que mira.

export type ProfileRelation = "self" | "ally" | "sent" | "received" | "none";

export async function getUserProfile(viewerId: number, userId: number) {
  const user = await db.user.findFirst({
    where: { id: userId, accountStatus: "active" },
    select: {
      id: true,
      name: true,
      lastName: true,
      email: true,
      avatar: true,
      company: {
        select: {
          id: true,
          name: true,
          logo: true,
          webSite: true,
          country: true,
          state: true,
          city: true,
          rating: true,
          ratingCount: true,
        },
      },
      userType: { select: { name: true } },
      userCategories: { select: { category: { select: { name: true } } } },
    },
  });
  if (!user) return null;

  const isSelf = viewerId === userId;
  const [alliesCount, friendship, request] = await Promise.all([
    // Las amistades se guardan en ambas direcciones; contar una basta.
    db.friendship.count({ where: { userId } }),
    isSelf
      ? null
      : db.friendship.findFirst({
          where: { userId: viewerId, friendId: userId },
          select: { id: true },
        }),
    isSelf
      ? null
      : db.friendRequest.findFirst({
          where: {
            status: "pending",
            OR: [
              { senderId: viewerId, receiverId: userId },
              { senderId: userId, receiverId: viewerId },
            ],
          },
          select: { id: true, senderId: true },
        }),
  ]);

  const isAlly = Boolean(friendship);
  const relation: ProfileRelation = isSelf
    ? "self"
    : isAlly
      ? "ally"
      : request
        ? request.senderId === viewerId
          ? "sent"
          : "received"
        : "none";

  if (!isSelf) {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recent = await db.profileView.findFirst({
      where: { viewerId, viewedId: userId, viewedAt: { gte: since } },
      select: { id: true },
    });
    if (!recent) {
      await db.profileView.create({ data: { viewerId, viewedId: userId } });
    }
  }

  const posts = await getUserPosts(
    viewerId,
    userId,
    isSelf || isAlly,
    alliesCount,
  );

  return {
    id: user.id,
    name: `${user.name} ${user.lastName}`.trim(),
    email: user.email,
    avatar: user.avatar,
    userType: user.userType?.name ?? null,
    categories: user.userCategories.map((c) => c.category.name),
    company: user.company
      ? {
          id: user.company.id,
          name: user.company.name,
          logo: user.company.logo,
          webSite: user.company.webSite,
          location: [user.company.city, user.company.state, user.company.country]
            .filter(Boolean)
            .join(", "),
          rating: user.company.rating,
          ratingCount: user.company.ratingCount,
        }
      : null,
    alliesCount,
    relation,
    requestId: request?.id ?? null,
    posts,
  };
}

export type UserProfile = NonNullable<
  Awaited<ReturnType<typeof getUserProfile>>
>;
