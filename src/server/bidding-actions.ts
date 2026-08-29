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
    select: { creator: { select: { companyId: true } } },
  });
  if (!bidding) return;

  const isSuperadmin = session.user.roleId === SUPERADMIN_ROLE_ID;
  const ownCompany =
    session.user.companyId !== null &&
    bidding.creator.companyId === session.user.companyId;
  if (!isSuperadmin && !ownCompany) return;

  await db.bidding.delete({ where: { id: biddingId } });
  revalidatePath("/biddings");
}
