import type { NextRequest } from "next/server";
import { auth } from "@/server/auth";
import { getChatMessages } from "@/server/chat";

// Historial (y mensajes nuevos con ?after=) de una conversación del viewer.
export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return new Response("Unauthorized", { status: 401 });

  const params = request.nextUrl.searchParams;
  const conversationId = Number(params.get("conversationId"));
  if (!Number.isInteger(conversationId) || conversationId <= 0) {
    return new Response("Bad Request", { status: 400 });
  }
  const after = Number(params.get("after"));

  const messages = await getChatMessages(
    Number(session.user.id),
    conversationId,
    Number.isInteger(after) && after > 0 ? after : undefined,
  );
  if (messages === null) return new Response("Forbidden", { status: 403 });
  return Response.json({ messages });
}
