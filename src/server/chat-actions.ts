"use server";

import { auth } from "@/server/auth";
import { db } from "@/server/db";
import {
  findDirectConversationId,
  getAllyIds,
  type ChatMessage,
} from "@/server/chat";
import { uploadImage, uploadPdf } from "@/server/uploads";

// Acciones del chat entre aliados (feedback presentación 2026-09-26,
// lámina 10). Solo se puede conversar con aliados, como en el legacy.

export type SendChatResult =
  | { error: string }
  | { conversationId: number; message: ChatMessage };

async function requireViewer() {
  const session = await auth();
  if (!session?.user?.id) return null;
  return Number(session.user.id);
}

async function ensureDirectConversation(viewerId: number, allyId: number) {
  const existing = await findDirectConversationId(viewerId, allyId);
  if (existing) return existing;
  const conversation = await db.conversation.create({
    data: {
      type: "direct",
      lastActivityAt: new Date(),
      conversationUsers: {
        create: [
          { userId: viewerId, incomeAt: new Date() },
          { userId: allyId, incomeAt: new Date() },
        ],
      },
    },
    select: { id: true },
  });
  return conversation.id;
}

async function createMessage(
  viewerId: number,
  conversationId: number,
  content: string,
  type: "text" | "image" | "document",
): Promise<ChatMessage> {
  const now = new Date();
  const [message] = await db.$transaction([
    db.message.create({
      data: { conversationId, senderId: viewerId, content, type, sentAt: now },
      select: { id: true, content: true, type: true, sentAt: true },
    }),
    db.conversation.update({
      where: { id: conversationId },
      data: { lastActivityAt: now },
    }),
    // Quien envía queda al día en la conversación.
    db.conversationUser.updateMany({
      where: { conversationId, userId: viewerId },
      data: { readAt: now },
    }),
  ]);
  return {
    id: message.id,
    conversationId,
    mine: true,
    content: message.content,
    type: message.type,
    sentAt: message.sentAt.toISOString(),
  };
}

export async function sendChatMessageAction(
  recipientId: number,
  content: string,
): Promise<SendChatResult> {
  const viewerId = await requireViewer();
  if (!viewerId) return { error: "unauthenticated" };

  const text = content.trim();
  if (!text || text.length > 5000) return { error: "invalid_message" };

  const allyIds = await getAllyIds(viewerId);
  if (!allyIds.includes(recipientId)) return { error: "not_ally" };

  const conversationId = await ensureDirectConversation(viewerId, recipientId);
  const message = await createMessage(viewerId, conversationId, text, "text");
  return { conversationId, message };
}

export async function sendChatFileAction(
  recipientId: number,
  formData: FormData,
): Promise<SendChatResult> {
  const viewerId = await requireViewer();
  if (!viewerId) return { error: "unauthenticated" };

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "invalid_file_type" };
  }

  const allyIds = await getAllyIds(viewerId);
  if (!allyIds.includes(recipientId)) return { error: "not_ally" };

  // Igual que el legacy: imágenes o documentos (aquí PDF, como las fichas
  // técnicas); la URL del archivo viaja como contenido del mensaje.
  const isImage = file.type.startsWith("image/");
  const result = isImage
    ? await uploadImage(file, "chat")
    : await uploadPdf(file, "chat");
  if ("error" in result) return { error: result.error };

  const conversationId = await ensureDirectConversation(viewerId, recipientId);
  const message = await createMessage(
    viewerId,
    conversationId,
    result.url,
    isImage ? "image" : "document",
  );
  return { conversationId, message };
}

export async function markChatReadAction(conversationId: number) {
  const viewerId = await requireViewer();
  if (!viewerId) return;
  await db.conversationUser.updateMany({
    where: { conversationId, userId: viewerId },
    data: { readAt: new Date() },
  });
}
