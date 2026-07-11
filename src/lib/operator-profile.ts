import { getPlatformFeeAmount } from "@/lib/checkout-quote";
import { fetchAllLeaderboardOperators } from "@/lib/leaderboard-operators";
import { resolvePriceCurrency } from "@/lib/payment-currency";
import { prisma } from "@/lib/prisma";

const COMPLETED_STATUSES = ["SETTLED", "RELEASED", "FUNDED"] as const;

export type OperatorSale = {
  id: string;
  amount: number;
  currency: string;
  netEarnings: number;
  soldAt: string;
  buyerPaymentSignature: string | null;
  settlementSignature: string | null;
  priceOptionLabel: string | null;
};

export type OperatorCommunity = {
  id: string;
  title: string;
  slug: string;
  viewCount: number;
  accessType: string;
  groupType: string;
  communityImage: string | null;
  completedSales: number;
  solVolume: number;
  usdcVolume: number;
  solEarnings: number;
  usdcEarnings: number;
  sales: OperatorSale[];
};

export type OperatorProfile = {
  user: {
    id: string;
    name: string | null;
    image: string | null;
    xHandle: string | null;
    blueCheckmark: boolean;
    wallet: string | null;
    accounts: { providerAccountId: string }[];
  };
  rank: number | null;
  totalViews: number;
  listingCount: number;
  earnings: {
    solGross: number;
    usdcGross: number;
    solNet: number;
    usdcNet: number;
    solOrders: number;
    usdcOrders: number;
    completedSales: number;
  };
  communities: OperatorCommunity[];
};

function netAfterFees(gross: number, orderCount: number, currency: "USDG" | "ETH"): number {
  const fee = getPlatformFeeAmount(currency);
  return Math.max(0, gross - orderCount * fee);
}

function saleNet(amount: number, currency: string): number {
  const c = resolvePriceCurrency(currency);
  const fee = getPlatformFeeAmount(c);
  return Math.max(0, amount - fee);
}

function saleTimestamp(releasedAt: Date | null, updatedAt: Date, createdAt: Date): string {
  return (releasedAt ?? updatedAt ?? createdAt).toISOString();
}

export async function fetchOperatorProfile(userId: string): Promise<OperatorProfile | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      image: true,
      xHandle: true,
      blueCheckmark: true,
      wallet: true,
      accounts: {
        where: { provider: "twitter" },
        take: 1,
        select: { providerAccountId: true },
      },
    },
  });
  if (!user) return null;

  const doneWhere = { sellerId: userId, status: { in: [...COMPLETED_STATUSES] } };

  const [projects, salesByProject, completedOrders, usdgAgg, ethAgg, completedCount, allOperators] =
    await Promise.all([
    prisma.project.findMany({
      where: { userId, published: true },
      orderBy: [{ viewCount: "desc" }, { createdAt: "desc" }],
      select: {
        id: true,
        title: true,
        slug: true,
        viewCount: true,
        accessType: true,
        groupType: true,
        communityImage: true,
      },
    }),
    prisma.escrowOrder.groupBy({
      by: ["projectId", "currency"],
      where: doneWhere,
      _sum: { amount: true },
      _count: { _all: true },
    }),
    prisma.escrowOrder.findMany({
      where: doneWhere,
      orderBy: [{ releasedAt: "desc" }, { updatedAt: "desc" }],
      select: {
        id: true,
        projectId: true,
        amount: true,
        currency: true,
        buyerPaymentSignature: true,
        settlementSignature: true,
        priceOptionLabel: true,
        releasedAt: true,
        createdAt: true,
        updatedAt: true,
      },
    }),
    prisma.escrowOrder.aggregate({
      where: { ...doneWhere, currency: { in: ["USDG", "SOL"] } },
      _sum: { amount: true },
      _count: { _all: true },
    }),
    prisma.escrowOrder.aggregate({
      where: { ...doneWhere, currency: "ETH" },
      _sum: { amount: true },
      _count: { _all: true },
    }),
    prisma.escrowOrder.count({ where: doneWhere }),
    fetchAllLeaderboardOperators(),
  ]);

  type PerProject = { usdg: number; eth: number; usdgOrders: number; ethOrders: number; orders: number };
  const byProject = new Map<string, PerProject>();

  for (const row of salesByProject) {
    const cur = byProject.get(row.projectId) ?? { usdg: 0, eth: 0, usdgOrders: 0, ethOrders: 0, orders: 0 };
    const amt = row._sum.amount ?? 0;
    const count = row._count._all;
    cur.orders += count;
    if (row.currency === "ETH") {
      cur.eth += amt;
      cur.ethOrders += count;
    } else {
      cur.usdg += amt;
      cur.usdgOrders += count;
    }
    byProject.set(row.projectId, cur);
  }

  const salesByProjectId = new Map<string, OperatorSale[]>();
  for (const order of completedOrders) {
    const list = salesByProjectId.get(order.projectId) ?? [];
    list.push({
      id: order.id,
      amount: order.amount,
      currency: order.currency,
      netEarnings: saleNet(order.amount, order.currency),
      soldAt: saleTimestamp(order.releasedAt, order.updatedAt, order.createdAt),
      buyerPaymentSignature: order.buyerPaymentSignature,
      settlementSignature: order.settlementSignature,
      priceOptionLabel: order.priceOptionLabel,
    });
    salesByProjectId.set(order.projectId, list);
  }

  const communities: OperatorCommunity[] = projects.map((p) => {
    const s = byProject.get(p.id) ?? { usdg: 0, eth: 0, usdgOrders: 0, ethOrders: 0, orders: 0 };
    return {
      id: p.id,
      title: p.title,
      slug: p.slug,
      viewCount: p.viewCount,
      accessType: p.accessType,
      groupType: p.groupType,
      communityImage: p.communityImage,
      completedSales: s.orders,
      solVolume: s.usdg,
      usdcVolume: s.eth,
      solEarnings: netAfterFees(s.usdg, s.usdgOrders, "USDG"),
      usdcEarnings: netAfterFees(s.eth, s.ethOrders, "ETH"),
      sales: salesByProjectId.get(p.id) ?? [],
    };
  });

  const rankIndex = allOperators.findIndex((o) => o.user.id === userId);
  const totalViews = projects.reduce((sum, p) => sum + p.viewCount, 0);

  const usdgGross = usdgAgg._sum.amount ?? 0;
  const usdgOrders = usdgAgg._count._all;
  const ethGross = ethAgg._sum.amount ?? 0;
  const ethOrders = ethAgg._count._all;

  return {
    user,
    rank: rankIndex >= 0 ? rankIndex + 1 : null,
    totalViews,
    listingCount: projects.length,
    earnings: {
      solGross: usdgGross,
      usdcGross: ethGross,
      solNet: netAfterFees(usdgGross, usdgOrders, "USDG"),
      usdcNet: netAfterFees(ethGross, ethOrders, "ETH"),
      solOrders: usdgOrders,
      usdcOrders: ethOrders,
      completedSales: completedCount,
    },
    communities,
  };
}
