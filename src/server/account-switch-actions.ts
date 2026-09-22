"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { auth, unstable_update } from "@/server/auth";
import { verifyPassword } from "@/server/auth/password";
import { db } from "@/server/db";

// Panel Global "Cambiar empresa" (feedback 2026-09-21): el usuario vincula
// sus otras cuentas demostrando sus credenciales una vez y después alterna
// entre empresas sin cerrar sesión. El cambio reescribe el JWT igual que la
// impersonación del superadmin.

export type LinkAccountState = { error?: string } | undefined;

const linkSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function linkAccountAction(
  _prev: LinkAccountState,
  formData: FormData,
): Promise<LinkAccountState> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("unauthenticated");
  const userId = Number(session.user.id);

  const parsed = linkSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { error: "invalid_credentials" };

  const target = await db.user.findUnique({
    where: { email: parsed.data.email },
  });
  if (!target || !(await verifyPassword(parsed.data.password, target.password))) {
    return { error: "invalid_credentials" };
  }
  if (target.id === userId) return { error: "own_account" };
  if (target.accountStatus === "deactivated" || !target.emailVerifiedAt) {
    return { error: "account_unavailable" };
  }

  const existing = await db.userLinkedAccount.findFirst({
    where: { userId, linkedUserId: target.id },
  });
  if (existing) return { error: "already_linked" };

  // Vínculo bidireccional: cualquiera de las dos cuentas puede cambiar a la otra.
  await db.userLinkedAccount.createMany({
    data: [
      { userId, linkedUserId: target.id },
      { userId: target.id, linkedUserId: userId },
    ],
    skipDuplicates: true,
  });
  return undefined;
}

export async function switchAccountAction(targetUserId: number) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("unauthenticated");
  const userId = Number(session.user.id);

  const link = await db.userLinkedAccount.findFirst({
    where: { userId, linkedUserId: targetUserId },
  });
  if (!link) return;

  const target = await db.user.findUnique({
    where: { id: targetUserId },
    include: { role: true },
  });
  if (!target || target.accountStatus === "deactivated") return;

  await unstable_update({
    id: String(target.id),
    name: `${target.name} ${target.lastName}`.trim(),
    email: target.email,
    picture: target.avatar,
    role: target.role?.name ?? null,
    roleId: target.roleId,
    userTypeId: target.userTypeId,
    companyId: target.companyId,
    // Una impersonación del superadmin no sobrevive al cambio de empresa.
    impersonatorId: null,
  } as never);
  redirect("/dashboard");
}

export async function unlinkAccountAction(targetUserId: number) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("unauthenticated");
  const userId = Number(session.user.id);

  await db.userLinkedAccount.deleteMany({
    where: {
      OR: [
        { userId, linkedUserId: targetUserId },
        { userId: targetUserId, linkedUserId: userId },
      ],
    },
  });
}
