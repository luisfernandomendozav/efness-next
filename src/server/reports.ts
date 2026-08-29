import { db } from "@/server/db";
import { sellerActiveExtras } from "@/server/biddings";

// Réplica de BiddingController::getIndicatorsBuyer / getIndicatorsSeller.
// Los umbrales (2 días para vencidas, 30 días para clientes nuevos) vienen
// del BiddingRepository legacy.

export type Indicator = {
  key: string;
  value: number;
  isCurrency?: boolean;
  percent?: number;
};

export async function getBuyerIndicators(
  companyId: number,
): Promise<Indicator[]> {
  const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
  const [open, bidded, assigned, closed, overdue] = await Promise.all([
    db.bidding.count({
      where: {
        creator: { companyId },
        status: { in: ["open", "quoted"] },
        biddingCompanyStatuses: { none: { companyId } },
      },
    }),
    db.bidding.count({
      where: {
        biddingCompanyStatuses: { some: { companyId, status: "quoted" } },
      },
    }),
    db.bidding.count({
      where: {
        biddingCompanyStatuses: {
          some: { companyId, status: "generated_orders" },
        },
      },
    }),
    db.bidding.count({
      where: {
        biddingCompanyStatuses: {
          some: { companyId, status: { in: ["closed", "rated"] } },
        },
      },
    }),
    db.bidding.count({
      where: {
        creator: { companyId },
        biddingCompanyStatuses: { none: { companyId } },
        createdAt: { lt: twoDaysAgo },
      },
    }),
  ]);

  const all = open + bidded + assigned + closed;
  const pct = (n: number) => (all > 0 ? Math.round((n * 100) / all) : 0);
  return [
    { key: "Open requisitions", value: open, percent: pct(open) },
    { key: "Requisitions with quote", value: bidded, percent: pct(bidded) },
    {
      key: "Requisitions with purchase order",
      value: assigned,
      percent: pct(assigned),
    },
    { key: "Closed requisitions", value: closed, percent: pct(closed) },
    { key: "Overdue requisitions", value: overdue },
  ];
}

export async function getSellerIndicators(
  userId: number,
  companyId: number,
): Promise<Indicator[]> {
  const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const extras = await sellerActiveExtras({
    userId,
    companyId,
    isSeller: true,
    isSuperadmin: false,
  });
  const sellerOpenWhere = {
    AND: [
      { status: "open" },
      { biddingCompanyStatuses: { none: { companyId } } },
      { creator: { companyId: { not: companyId } } },
      ...extras,
    ],
  };

  const [bidded, assigned, notAssigned, open, activeBuyers, sales, newClients] =
    await Promise.all([
      db.bidding.count({
        where: {
          biddingCompanyStatuses: { some: { companyId, status: "quoted" } },
        },
      }),
      db.bidding.count({
        where: {
          biddingCompanyStatuses: {
            some: {
              companyId,
              status: {
                in: ["assigned", "confirmed", "generated_orders", "rated"],
              },
            },
          },
        },
      }),
      db.bidding.count({
        where: {
          biddingCompanyStatuses: { some: { companyId, status: "unassigned" } },
        },
      }),
      db.bidding.count({ where: sellerOpenWhere }),
      db.bidding
        .findMany({
          where: {
            AND: [
              { status: { in: ["open", "quoted"] } },
              { biddingCompanyStatuses: { none: { companyId } } },
              { creator: { companyId: { not: companyId } } },
              ...extras,
            ],
          },
          select: { creator: { select: { companyId: true } } },
        })
        .then(
          (rows) =>
            new Set(rows.map((r) => r.creator.companyId).filter(Boolean)).size,
        ),
      db.orderProduct
        .aggregate({
          where: { order: { companyId } },
          _sum: { total: true },
        })
        .then((r) => Number(r._sum.total ?? 0)),
      db.user.count({
        where: { userTypeId: 2, createdAt: { gte: monthAgo } },
      }),
    ]);

  return [
    { key: "Quoted requisitions, not closed", value: bidded },
    { key: "Assigned requisitions", value: assigned },
    { key: "Quoted, closed, unassigned requisitions", value: notAssigned },
    { key: "Open requisitions", value: open },
    {
      key: "New clients with active biddings",
      value: activeBuyers,
    },
    { key: "Cumulative sale", value: sales, isCurrency: true },
    { key: "New clients", value: newClients },
  ];
}

// El superadmin no tiene empresa: panorama global de la plataforma.
export async function getGlobalIndicators(): Promise<Indicator[]> {
  const [open, quoted, assigned, generated, closed, users, companies, sales] =
    await Promise.all([
      db.bidding.count({ where: { status: "open" } }),
      db.bidding.count({ where: { status: "quoted" } }),
      db.bidding.count({ where: { status: { in: ["assigned", "confirmed"] } } }),
      db.bidding.count({ where: { status: "generated_orders" } }),
      db.bidding.count({ where: { status: { in: ["closed", "rated"] } } }),
      db.user.count({ where: { accountStatus: "active" } }),
      db.company.count(),
      db.orderProduct
        .aggregate({ _sum: { total: true } })
        .then((r) => Number(r._sum.total ?? 0)),
    ]);

  return [
    { key: "Open requisitions", value: open },
    { key: "Requisitions with quote", value: quoted },
    { key: "Assigned requisitions", value: assigned },
    { key: "Requisitions with purchase order", value: generated },
    { key: "Closed requisitions", value: closed },
    { key: "Users", value: users },
    { key: "Companies", value: companies },
    { key: "Cumulative sale", value: sales, isCurrency: true },
  ];
}
