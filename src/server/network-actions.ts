"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/server/auth";
import { db } from "@/server/db";

async function requireUserId() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("unauthenticated");
  return Number(session.user.id);
}

function revalidateNetwork() {
  revalidatePath("/my-network");
  revalidatePath("/dashboard");
}

// Réplica de FriendshipService::acceptFriendRequest: marca la solicitud como
// aceptada y crea la amistad en AMBAS direcciones, como el backend legacy.
export async function acceptRequestAction(requestId: number) {
  const userId = await requireUserId();
  const request = await db.friendRequest.findUnique({
    where: { id: requestId },
  });
  if (!request || request.receiverId !== userId || request.status !== "pending")
    return;

  await db.$transaction([
    db.friendRequest.update({
      where: { id: requestId },
      data: { status: "accepted" },
    }),
    db.friendship.createMany({
      data: [
        { userId: request.senderId, friendId: request.receiverId },
        { userId: request.receiverId, friendId: request.senderId },
      ],
      skipDuplicates: true,
    }),
  ]);
  revalidateNetwork();
}

export async function rejectRequestAction(requestId: number) {
  const userId = await requireUserId();
  const request = await db.friendRequest.findUnique({
    where: { id: requestId },
  });
  if (!request || request.receiverId !== userId || request.status !== "pending")
    return;

  await db.friendRequest.update({
    where: { id: requestId },
    data: { status: "rejected" },
  });
  revalidateNetwork();
}

export async function cancelRequestAction(requestId: number) {
  const userId = await requireUserId();
  const request = await db.friendRequest.findUnique({
    where: { id: requestId },
  });
  if (!request || request.senderId !== userId) return;

  await db.friendRequest.delete({ where: { id: requestId } });
  revalidateNetwork();
}

// Réplica de FriendshipService::removeFriend: borra ambas direcciones.
export async function removeAllyAction(friendId: number) {
  const userId = await requireUserId();
  if (friendId === userId) return;

  await db.friendship.deleteMany({
    where: {
      OR: [
        { userId, friendId },
        { userId: friendId, friendId: userId },
      ],
    },
  });
  revalidateNetwork();
}
