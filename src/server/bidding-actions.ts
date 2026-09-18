"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/server/auth";
import { db } from "@/server/db";

const SUPERADMIN_ROLE_ID = 1;

export async function deleteBiddingAction(biddingId: number) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("unauthenticated");

  const bidding = await db.bidding.findUnique({
    where: { id: biddingId },
    select: { createdBy: true },
  });
  if (!bidding) return;

  // Solo el creador (o el superadmin) puede borrar; alineado con el listado,
  // que ya solo muestra las requisiciones propias.
  const isSuperadmin = session.user.roleId === SUPERADMIN_ROLE_ID;
  if (!isSuperadmin && bidding.createdBy !== Number(session.user.id)) return;

  await db.bidding.delete({ where: { id: biddingId } });
  revalidatePath("/biddings");
}
