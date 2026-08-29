"use server";

import { randomBytes } from "crypto";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { Prisma } from "@/generated/prisma/client";
import { auth } from "@/server/auth";
import { hashPassword } from "@/server/auth/password";
import { db } from "@/server/db";

const SUPERADMIN_ROLE_ID = 1;
const ADMIN_ROLE_ID = 2;

export type UserAdminActionState = { error?: string } | undefined;

async function requireSuperadmin() {
  const session = await auth();
  if (session?.user?.roleId !== SUPERADMIN_ROLE_ID) {
    throw new Error("unauthorized");
  }
  return Number(session.user.id);
}

const userSchema = z.object({
  id: z.coerce.number().int().optional(),
  name: z.string().trim().min(3).max(50),
  lastName: z.string().trim().min(3).max(50),
  email: z.string().trim().email().max(50),
  userTypeId: z.coerce.number().int().min(1).max(2),
});

export async function saveUserAction(
  _prev: UserAdminActionState,
  formData: FormData,
): Promise<UserAdminActionState> {
  await requireSuperadmin();

  const parsed = userSchema.safeParse({
    id: formData.get("id") || undefined,
    name: formData.get("name"),
    lastName: formData.get("lastName"),
    email: formData.get("email"),
    userTypeId: formData.get("userTypeId"),
  });
  if (!parsed.success) return { error: "invalid_user" };
  const data = parsed.data;

  try {
    if (data.id) {
      await db.user.update({
        where: { id: data.id },
        data: {
          name: data.name,
          lastName: data.lastName,
          email: data.email,
          userTypeId: data.userTypeId,
        },
      });
    } else {
      // Como el modal legacy no pide contraseña, se genera una aleatoria;
      // el usuario deberá restablecerla para poder entrar.
      const password = await hashPassword(randomBytes(24).toString("base64"));
      await db.user.create({
        data: {
          name: data.name,
          lastName: data.lastName,
          email: data.email,
          userTypeId: data.userTypeId,
          roleId: ADMIN_ROLE_ID,
          password,
          emailVerifiedAt: new Date(),
        },
      });
    }
  } catch (e) {
    if (
      e instanceof Prisma.PrismaClientKnownRequestError &&
      e.code === "P2002"
    ) {
      return { error: "email_taken" };
    }
    throw e;
  }

  revalidatePath("/user-management/users");
  return undefined;
}

export async function deleteUserAction(userId: number) {
  const viewerId = await requireSuperadmin();
  if (userId === viewerId) return;
  await db.user.delete({ where: { id: userId } });
  revalidatePath("/user-management/users");
}
