"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/server/auth";
import { db } from "@/server/db";

export type FeedActionState = { error?: string } | undefined;

async function requireUserId() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("unauthenticated");
  return Number(session.user.id);
}

const createPostSchema = z.object({
  content: z.string().trim().min(1).max(5000),
  visibility: z.enum(["public", "allies"]),
});

export async function createPostAction(
  _prev: FeedActionState,
  formData: FormData,
): Promise<FeedActionState> {
  const userId = await requireUserId();
  const parsed = createPostSchema.safeParse({
    content: formData.get("content"),
    visibility: formData.get("visibility"),
  });
  if (!parsed.success) return { error: "invalid_post" };

  const user = await db.user.findUnique({
    where: { id: userId },
    select: { companyId: true },
  });
  if (!user?.companyId) return { error: "no_company" };

  await db.post.create({
    data: {
      userId,
      companyId: user.companyId,
      content: parsed.data.content,
      visibility: parsed.data.visibility,
    },
  });
  revalidatePath("/dashboard");
  return undefined;
}

export async function toggleLikeAction(postId: number) {
  const userId = await requireUserId();
  const existing = await db.postLike.findUnique({
    where: { postId_userId: { postId, userId } },
  });
  if (existing) {
    await db.$transaction([
      db.postLike.delete({ where: { id: existing.id } }),
      db.post.update({
        where: { id: postId },
        data: { likesCount: { decrement: 1 } },
      }),
    ]);
  } else {
    await db.$transaction([
      db.postLike.create({ data: { postId, userId } }),
      db.post.update({
        where: { id: postId },
        data: { likesCount: { increment: 1 } },
      }),
    ]);
  }
  revalidatePath("/dashboard");
}

export async function addCommentAction(
  postId: number,
  _prev: FeedActionState,
  formData: FormData,
): Promise<FeedActionState> {
  const userId = await requireUserId();
  const content = String(formData.get("content") ?? "").trim();
  if (!content) return { error: "invalid_comment" };

  await db.$transaction([
    db.comment.create({ data: { postId, userId, content } }),
    db.post.update({
      where: { id: postId },
      data: { commentsCount: { increment: 1 } },
    }),
  ]);
  revalidatePath("/dashboard");
  return undefined;
}

export async function deletePostAction(postId: number) {
  const userId = await requireUserId();
  const post = await db.post.findUnique({
    where: { id: postId },
    select: { userId: true },
  });
  if (!post || post.userId !== userId) return;
  await db.post.delete({ where: { id: postId } });
  revalidatePath("/dashboard");
}

export async function sendAllyRequestAction(receiverId: number) {
  const userId = await requireUserId();
  if (receiverId === userId) return;
  await db.friendRequest.upsert({
    where: { senderId_receiverId: { senderId: userId, receiverId } },
    create: { senderId: userId, receiverId, status: "pending" },
    update: { status: "pending" },
  });
  revalidatePath("/dashboard");
}
