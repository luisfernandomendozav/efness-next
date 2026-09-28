import { auth } from "@/server/auth";
import { getChatContacts } from "@/server/chat";

// Contactos del dock de chat (aliados + conversación directa + no leídos).
// El cliente lo consulta por polling; el legacy usaba websockets.
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return new Response("Unauthorized", { status: 401 });

  const contacts = await getChatContacts(Number(session.user.id));
  return Response.json({ contacts });
}
