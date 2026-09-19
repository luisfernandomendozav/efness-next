"use server";

import { redirect } from "next/navigation";
import { auth, unstable_update } from "@/server/auth";
import { db } from "@/server/db";

const SUPERADMIN_ROLE_ID = 1;

// "Acceder como" desde gestión de usuarios (feedback notas 2026-09-18).
// Se reescribe el JWT de la sesión con los datos del usuario objetivo y se
// guarda el id del superadmin original para poder volver.

function tokenFor(user: {
  id: number;
  name: string;
  lastName: string;
  email: string;
  avatar: string | null;
  roleId: number | null;
  userTypeId: number | null;
  companyId: number | null;
  role: { name: string } | null;
}) {
  return {
    id: String(user.id),
    name: `${user.name} ${user.lastName}`.trim(),
    email: user.email,
    picture: user.avatar,
    role: user.role?.name ?? null,
    roleId: user.roleId,
    userTypeId: user.userTypeId,
    companyId: user.companyId,
  };
}

export async function impersonateUserAction(userId: number) {
  const session = await auth();
  if (session?.user?.roleId !== SUPERADMIN_ROLE_ID) {
    throw new Error("unauthorized");
  }
  // No se encadena una impersonación dentro de otra.
  if (session.user.impersonatorId) throw new Error("already_impersonating");

  const target = await db.user.findUnique({
    where: { id: userId },
    include: { role: true },
  });
  if (!target || target.accountStatus === "deactivated") return;

  await unstable_update({
    ...tokenFor(target),
    impersonatorId: Number(session.user.id),
  } as never);
  redirect("/dashboard");
}

export async function stopImpersonatingAction() {
  const session = await auth();
  const impersonatorId = session?.user?.impersonatorId;
  if (!impersonatorId) return;

  const admin = await db.user.findUnique({
    where: { id: impersonatorId },
    include: { role: true },
  });
  if (!admin) return;

  await unstable_update({
    ...tokenFor(admin),
    impersonatorId: null,
  } as never);
  redirect("/user-management/users");
}
