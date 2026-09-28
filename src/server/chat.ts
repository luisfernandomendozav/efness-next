import { db } from "@/server/db";

// Chat entre aliados (feedback presentación 2026-09-26, lámina 10): réplica
// del chat legacy (ChatContext + conversations/messages de Laravel) sobre
// los modelos Conversation/ConversationUser/Message ya migrados. El legacy
// usaba websockets (Laravel Echo + Pusher); aquí el dock refresca por
// polling. La presencia online/offline quedó pendiente también en el legacy.

export type ChatMessage = {
  id: number;
  conversationId: number;
  mine: boolean;
  content: string;
  type: string;
  sentAt: string;
};

export type ChatContact = {
  userId: number;
  name: string;
  avatar: string | null;
  companyName: string | null;
  conversationId: number | null;
  lastMessage: { content: string; type: string; sentAt: string; mine: boolean } | null;
  unread: number;
};

export async function getAllyIds(viewerId: number) {
  const rows = await db.friendship.findMany({
    where: { OR: [{ userId: viewerId }, { friendId: viewerId }] },
    select: { userId: true, friendId: true },
  });
  return [
    ...new Set(rows.map((r) => (r.userId === viewerId ? r.friendId : r.userId))),
  ];
}

// Conversación directa existente entre dos usuarios, si la hay.
export async function findDirectConversationId(userA: number, userB: number) {
  const conversation = await db.conversation.findFirst({
    where: {
      type: "direct",
      isActive: true,
      AND: [
        { conversationUsers: { some: { userId: userA, isActive: true } } },
        { conversationUsers: { some: { userId: userB, isActive: true } } },
      ],
    },
    select: { id: true },
  });
  return conversation?.id ?? null;
}

export async function getChatContacts(
  viewerId: number,
): Promise<ChatContact[]> {
  const allyIds = await getAllyIds(viewerId);
  if (allyIds.length === 0) return [];

  const [allies, memberships] = await Promise.all([
    db.user.findMany({
      where: { id: { in: allyIds }, accountStatus: "active" },
      select: {
        id: true,
        name: true,
        lastName: true,
        avatar: true,
        company: { select: { name: true } },
      },
    }),
    db.conversationUser.findMany({
      where: {
        userId: viewerId,
        isActive: true,
        conversation: { type: "direct", isActive: true },
      },
      select: { conversationId: true, readAt: true },
    }),
  ]);

  const convIds = memberships.map((m) => m.conversationId);
  const readAtByConv = new Map(
    memberships.map((m) => [m.conversationId, m.readAt]),
  );
  const others = convIds.length
    ? await db.conversationUser.findMany({
        where: { conversationId: { in: convIds }, userId: { not: viewerId } },
        select: { conversationId: true, userId: true },
      })
    : [];
  const convByAlly = new Map(others.map((o) => [o.userId, o.conversationId]));

  const contacts = await Promise.all(
    allies.map(async (ally) => {
      const conversationId = convByAlly.get(ally.id) ?? null;
      let lastMessage: ChatContact["lastMessage"] = null;
      let unread = 0;
      if (conversationId) {
        const readAt = readAtByConv.get(conversationId) ?? null;
        const [last, unreadCount] = await Promise.all([
          db.message.findFirst({
            where: { conversationId, deleted: false },
            orderBy: { sentAt: "desc" },
            select: { content: true, type: true, sentAt: true, senderId: true },
          }),
          db.message.count({
            where: {
              conversationId,
              deleted: false,
              senderId: { not: viewerId },
              ...(readAt ? { sentAt: { gt: readAt } } : {}),
            },
          }),
        ]);
        if (last) {
          lastMessage = {
            content: last.content,
            type: last.type,
            sentAt: last.sentAt.toISOString(),
            mine: last.senderId === viewerId,
          };
        }
        unread = unreadCount;
      }
      return {
        userId: ally.id,
        name: `${ally.name} ${ally.lastName}`.trim(),
        avatar: ally.avatar,
        companyName: ally.company?.name ?? null,
        conversationId,
        lastMessage,
        unread,
      };
    }),
  );

  // Conversaciones con actividad primero (como el chat de Facebook),
  // después el resto de aliados por nombre.
  return contacts.sort((a, b) => {
    const aTime = a.lastMessage?.sentAt ?? "";
    const bTime = b.lastMessage?.sentAt ?? "";
    if (aTime !== bTime) return bTime.localeCompare(aTime);
    return a.name.localeCompare(b.name);
  });
}

const MESSAGES_PAGE = 50;

export async function getChatMessages(
  viewerId: number,
  conversationId: number,
  afterId?: number,
): Promise<ChatMessage[] | null> {
  const membership = await db.conversationUser.findFirst({
    where: { conversationId, userId: viewerId, isActive: true },
    select: { id: true },
  });
  if (!membership) return null;

  const rows = await db.message.findMany({
    where: {
      conversationId,
      deleted: false,
      ...(afterId ? { id: { gt: afterId } } : {}),
    },
    orderBy: { sentAt: "desc" },
    take: MESSAGES_PAGE,
    select: {
      id: true,
      conversationId: true,
      senderId: true,
      content: true,
      type: true,
      sentAt: true,
    },
  });

  return rows.reverse().map((m) => ({
    id: m.id,
    conversationId: m.conversationId,
    mine: m.senderId === viewerId,
    content: m.content,
    type: m.type,
    sentAt: m.sentAt.toISOString(),
  }));
}
