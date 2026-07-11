import { ConnectWalletCta } from "@/components/dashboard/connect-wallet-cta";
import { DashboardVerifiedAccountButton } from "@/components/dashboard/dashboard-verified-account-button";
import { DashboardActivityTabs } from "@/components/dashboard/dashboard-activity-tabs";
import { DashboardSettingsPanel } from "@/components/dashboard/dashboard-settings-panel";
import { EscrowReviewForm } from "@/components/dashboard/escrow-review-form";
import { SellerReviewReply } from "@/components/dashboard/seller-review-reply";
import { auth } from "@/auth";
import {
  buildDashboardUrl,
  parseActivity,
  statusItems,
  type ListingFilter,
} from "@/lib/dashboard-nav";
import { formatEscrowAmountLabel, resolvePriceCurrency } from "@/lib/listing-price";
import { prisma } from "@/lib/prisma";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Metadata } from "next";
import { Fragment, type ReactNode } from "react";

export const metadata: Metadata = {
  title: "Dashboard",
};

const reportReasonLabel: Record<string, string> = {
  SPAM: "Spam",
  SCAM: "Scam",
  MISLEADING: "Misleading",
  IP: "Copyright / IP",
  OTHER: "Other",
};

const UNLOCKED_ESCROW_STATUSES = new Set(["SETTLED", "RELEASED", "FUNDED"]);

function purchaseAccessState(o: { status: string; accessExpiresAt: Date | null }): "active" | "expired" | "pending" {
  if (!UNLOCKED_ESCROW_STATUSES.has(o.status)) return "pending";
  if (o.accessExpiresAt && o.accessExpiresAt.getTime() <= Date.now()) return "expired";
  return "active";
}

function strInvite(s: string | null | undefined): string | null {
  if (s == null) return null;
  const t = s.trim();
  return t.length > 0 ? t : null;
}

type Props = {
  searchParams: Promise<{ status?: ListingFilter; activity?: string; connectWallet?: string }>;
};

function SectionCard({
  id,
  title,
  subtitle,
  children,
}: {
  id?: string;
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <section
      id={id}
      className="scroll-mt-20 card-rh"
    >
      <div className="border-b border-[var(--rh-border)] px-3 py-2 sm:px-4 sm:py-2.5">
        <h2 className="text-sm font-semibold text-[var(--rh-foreground)] sm:text-base">{title}</h2>
        {subtitle && <p className="mt-1 max-w-2xl text-xs leading-relaxed text-[var(--rh-muted)] sm:text-sm">{subtitle}</p>}
      </div>
      <div className="p-2.5 sm:p-3">{children}</div>
    </section>
  );
}

const tableTh =
  "whitespace-nowrap px-2 py-2 text-left text-[10px] font-medium uppercase tracking-[0.14em] text-[var(--rh-muted)] first:pl-2 last:pr-2 sm:px-3 sm:text-[11px] sm:first:pl-3 sm:last:pr-3";
const tableTd =
  "border-b border-[var(--rh-border)] px-2 py-2 align-top text-[11px] text-[var(--rh-foreground)] first:pl-2 last:pr-2 sm:px-3 sm:py-2.5 sm:text-xs sm:first:pl-3 sm:last:pr-3";
const tableTdSub =
  "border-b border-[var(--rh-border)] bg-[var(--rh-surface)] px-2 py-2 text-[11px] first:pl-2 last:pr-2 sm:px-3 sm:py-2.5 sm:text-xs sm:first:pl-3 sm:last:pr-3";

/**
 * Activity panels (purchases, sales, reviews, reports) — same card chrome as “Your community listings”
 * (`SectionCard`): bordered header row + padded body.
 */
function ActivityBlock({
  title,
  subtitle,
  children,
  dense,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  /** Slightly smaller title line in the card header (table-heavy views) */
  dense?: boolean;
}) {
  return (
    <section className="scroll-mt-20 card-rh">
      <div className="border-b border-[var(--rh-border)] px-3 py-2 sm:px-4 sm:py-2.5">
        <h2
          className={
            dense
              ? "text-sm font-semibold tracking-tight text-[var(--rh-foreground)]"
              : "text-sm font-semibold text-[var(--rh-foreground)] sm:text-base"
          }
        >
          {title}
        </h2>
        {subtitle ? (
          <p
            className={
              dense
                ? "mt-0.5 max-w-2xl text-sm leading-relaxed text-[var(--rh-muted)]"
                : "mt-1 max-w-2xl text-xs leading-relaxed text-[var(--rh-muted)] sm:text-sm"
            }
          >
            {subtitle}
          </p>
        ) : null}
      </div>
      <div className="p-2.5 sm:p-3">{children}</div>
    </section>
  );
}

export default async function DashboardPage({ searchParams }: Props) {
  const { status = "ALL", activity: activityParam, connectWallet } = await searchParams;
  const activity = parseActivity(activityParam);
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/dashboard");

  const userId = session.user.id;
  const hasWallet = !!session.user.wallet;

  const [me, xAccount, projects, buyerOrders, sellerOrders, incomingReports, reviewAgg, projectCounts] = await Promise.all([
    /** Raw: works when Prisma client is stale (e.g. after failed `prisma generate` on Windows). */
    prisma
      .$queryRawUnsafe<Array<{ xHandle: string | null }>>(
        `SELECT "xHandle" FROM "User" WHERE "id" = $1`,
        userId,
      )
      .then((rows) => rows[0] ?? null),
    prisma.account.findFirst({
      where: { userId, provider: "twitter" },
      select: { id: true },
    }),
    prisma.project.findMany({
      where: {
        userId,
        ...(status === "PUBLIC"
          ? { groupType: "PUBLIC" }
          : status === "PRIVATE"
            ? { groupType: "PRIVATE" }
            : status === "PAID"
              ? { accessType: "PAID" }
              : {}),
      },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.escrowOrder.findMany({
      where: { buyerId: userId },
      orderBy: { createdAt: "desc" },
      take: 40,
      include: {
        project: { select: { id: true, title: true, slug: true, communityImage: true } },
        review: true,
        seller: { select: { name: true, image: true, xHandle: true } },
      },
    }),
    prisma.escrowOrder.findMany({
      where: { sellerId: userId },
      orderBy: { createdAt: "desc" },
      take: 40,
      include: {
        project: { select: { id: true, title: true, slug: true, communityImage: true } },
        review: true,
        buyer: { select: { name: true, image: true, id: true } },
      },
    }),
    prisma.projectReport.findMany({
      where: { project: { userId } },
      orderBy: { createdAt: "desc" },
      take: 30,
      include: {
        project: { select: { title: true, slug: true, id: true } },
        reporter: { select: { name: true, image: true, id: true } },
      },
    }),
    prisma.escrowReview.aggregate({
      where: { order: { sellerId: userId } },
      _avg: { rating: true },
      _count: { _all: true },
    }),
    prisma.$transaction([
      prisma.project.count({ where: { userId } }),
      prisma.project.count({ where: { userId, groupType: "PUBLIC" } }),
      prisma.project.count({ where: { userId, groupType: "PRIVATE" } }),
      prisma.project.count({ where: { userId, accessType: "PAID" } }),
    ]),
  ]);

  const [totalProjects, publicCount, privateCount, paidCount] = projectCounts;
  const avgIncoming = reviewAgg._avg.rating ?? 0;
  const reviewAsSellerCount = reviewAgg._count._all;
  const now = new Date();
  const activeMemberships = buyerOrders.filter(
    (o) => UNLOCKED_ESCROW_STATUSES.has(o.status) && (o.accessExpiresAt == null || o.accessExpiresAt > now),
  ).length;
  const completedSalesAsSeller = sellerOrders.filter((o) => UNLOCKED_ESCROW_STATUSES.has(o.status)).length;

  const sellerAnalytics = await (async () => {
    const doneStatuses = ["SETTLED", "RELEASED", "FUNDED"] as const;
    const doneWhere = { sellerId: userId, status: { in: [...doneStatuses] } };
    const [usdgNet, ethNet, usdcNet, completedCount, byStatus, byProjectCur] = await Promise.all([
      prisma.escrowOrder.aggregate({
        where: { ...doneWhere, currency: { in: ["SOL", "USDG"] } },
        _sum: { amount: true },
        _count: { _all: true },
      }),
      prisma.escrowOrder.aggregate({
        where: { ...doneWhere, currency: "ETH" },
        _sum: { amount: true },
        _count: { _all: true },
      }),
      prisma.escrowOrder.aggregate({
        where: { ...doneWhere, currency: "USDC" },
        _sum: { amount: true },
        _count: { _all: true },
      }),
      prisma.escrowOrder.count({ where: doneWhere }),
      prisma.escrowOrder.groupBy({
        by: ["status"],
        where: { sellerId: userId },
        _count: { _all: true },
      }),
      prisma.escrowOrder.groupBy({
        by: ["projectId", "currency"],
        where: doneWhere,
        _sum: { amount: true },
        _count: { _all: true },
      }),
    ]);
    const projectIds = [...new Set(byProjectCur.map((r) => r.projectId))];
    const projectRows =
      projectIds.length > 0
        ? await prisma.project.findMany({
            where: { id: { in: projectIds } },
            select: { id: true, title: true, slug: true },
          })
        : [];
    const projectById = new Map(projectRows.map((p) => [p.id, p]));
    type PerProject = { usdg: number; eth: number; usdc: number; orders: number };
    const byProject = new Map<string, PerProject>();
    for (const r of byProjectCur) {
      const cur = byProject.get(r.projectId) ?? { usdg: 0, eth: 0, usdc: 0, orders: 0 };
      cur.orders += r._count._all;
      const amt = r._sum.amount ?? 0;
      if (r.currency === "SOL" || r.currency === "USDG") cur.usdg += amt;
      if (r.currency === "ETH") cur.eth += amt;
      if (r.currency === "USDC") cur.usdc += amt;
      byProject.set(r.projectId, cur);
    }
    const byProjectSorted = [...byProject.entries()]
      .map(([projectId, v]) => ({
        projectId,
        project: projectById.get(projectId),
        ...v,
      }))
      .sort((a, b) => b.orders - a.orders);

    const allProjects = await prisma.$queryRawUnsafe<
      Array<{
        id: string;
        title: string;
        slug: string;
        viewCount: number;
        published: number | boolean;
      }>
    >(
      `SELECT "id", "title", "slug", "viewCount", "published" FROM "Project" WHERE "userId" = $1 ORDER BY "viewCount" DESC`,
      userId,
    );
    const totalPageViews = allProjects.reduce((acc, pr) => acc + (pr.viewCount ?? 0), 0);
    const listingReport = allProjects.map((proj) => {
      const s = byProject.get(proj.id) ?? { usdg: 0, eth: 0, usdc: 0, orders: 0 };
      return {
        projectId: proj.id,
        title: proj.title,
        slug: proj.slug,
        published: Boolean(proj.published),
        views: proj.viewCount ?? 0,
        completedSales: s.orders,
        usdg: s.usdg,
        eth: s.eth,
        usdc: s.usdc,
      };
    });
    const topByViews = [...listingReport].sort((a, b) => b.views - a.views).slice(0, 8);
    const topBySales = [...listingReport]
      .sort((a, b) => {
        if (b.completedSales !== a.completedSales) return b.completedSales - a.completedSales;
        const vol = (x: (typeof listingReport)[0]) => x.usdg + x.eth + x.usdc;
        return vol(b) - vol(a);
      })
      .slice(0, 8);

    return {
      usdgTotal: usdgNet._sum.amount ?? 0,
      ethTotal: ethNet._sum.amount ?? 0,
      usdcTotal: usdcNet._sum.amount ?? 0,
      usdgOrders: usdgNet._count._all,
      ethOrders: ethNet._count._all,
      usdcOrders: usdcNet._count._all,
      completedCount,
      byStatus: byStatus.sort((a, b) => (b._count._all ?? 0) - (a._count._all ?? 0)),
      byProjectSorted,
      totalPageViews,
      listingReport,
      topByViews,
      topBySales,
    };
  })();

  return (
    <div className="app-main-container py-6 sm:py-8">
      <header className="page-hero relative mb-6">
        <div className="page-hero-glow pointer-events-none absolute inset-0" aria-hidden />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="ui-page-eyebrow">Operator</p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight text-[var(--rh-foreground)] sm:text-3xl">Dashboard</h1>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-[var(--rh-muted)]">
              Manage listings, track on-chain sales, and link your wallet and X profile.
            </p>
            {connectWallet === "1" ? (
              <p className="mt-2 text-xs text-amber-200/85 sm:text-sm">
                Connect and save your wallet first to create a new listing.
              </p>
            ) : null}
          </div>
          <div className="flex flex-wrap items-end justify-end gap-2 sm:gap-3">
            <DashboardVerifiedAccountButton
              hasWallet={hasWallet}
              hasXAccount={Boolean(xAccount)}
              verified={Boolean(session.user.blueCheckmark)}
              xHandle={me?.xHandle ?? session.user.xHandle ?? null}
            />
            {hasWallet ? (
              <Link href="/dashboard/new" className="btn-rh-primary w-fit shrink-0">
                + New listing
              </Link>
            ) : (
              <ConnectWalletCta />
            )}
          </div>
        </div>
      </header>

      <div className="mb-6 grid grid-cols-2 gap-px border border-[var(--rh-border)] bg-[var(--rh-border)] sm:grid-cols-2 xl:grid-cols-4">
        <div className="app-stat-cell">
          <p className="app-stat-label">Listings</p>
          <p className="app-stat-value mt-1 text-lg sm:text-xl">{totalProjects}</p>
          <p className="mt-0.5 text-[10px] text-[var(--rh-muted)]">Public {publicCount} · private {privateCount}</p>
        </div>
        <div className="app-stat-cell">
          <p className="app-stat-label">Purchases</p>
          <p className="app-stat-value mt-1 text-lg sm:text-xl">{buyerOrders.length}</p>
          <p className="mt-0.5 text-[10px] text-[var(--rh-muted)]">As buyer</p>
        </div>
        <div className="app-stat-cell">
          <p className="app-stat-label">Active access</p>
          <p className="app-stat-value mt-1 text-lg sm:text-xl">{activeMemberships}</p>
          <p className="mt-0.5 text-[10px] text-[var(--rh-muted)]">Not expired</p>
        </div>
        <div className="app-stat-cell">
          <p className="app-stat-label">Reviews in</p>
          <p className="app-stat-value mt-1 text-lg sm:text-xl">
            {reviewAsSellerCount > 0 ? avgIncoming.toFixed(1) : "—"}
            {reviewAsSellerCount > 0 && <span className="ml-0.5 text-[10px] font-normal text-[var(--rh-muted)]">/5</span>}
          </p>
          <p className="mt-0.5 text-[10px] text-[var(--rh-muted)]">{reviewAsSellerCount} from buyers</p>
        </div>
      </div>

      <DashboardActivityTabs status={status} activity={activity} />

      <div className="mt-5 space-y-5">
          {activity === "settings" && (
            <DashboardSettingsPanel
              name={session.user.name ?? null}
              image={session.user.image ?? null}
              blueCheckmark={Boolean(session.user.blueCheckmark)}
              xHandle={me?.xHandle ?? session.user.xHandle ?? null}
              hasXAccount={Boolean(xAccount)}
              loginWallet={session.user.wallet ?? null}
              payoutWallet={session.user.payoutWallet ?? null}
              totalProjects={totalProjects}
              paidCount={paidCount}
            />
          )}

          {activity === "listings" && (
          <SectionCard
            id="listings"
            title="Your Degen listings"
            subtitle="Public and private / VIP calls. Filter, edit, or open the public page."
          >
            <div className="flex flex-wrap gap-1.5">
              {statusItems.map((item) => {
                const active = status === item.key;
                return (
                  <Link
                    key={item.key}
                    href={buildDashboardUrl(item.key, activity)}
                    className={`dash-pill ${active ? "dash-pill--active" : "dash-pill--idle"}`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </div>
            {projects.length === 0 ? (
              <div className="dash-empty mt-3">
                <p className="text-xs text-[var(--rh-muted)]">No listings yet.</p>
                <p className="mt-1 text-xs text-[var(--rh-subtle)]">Connect your wallet, then create a listing with the button above.</p>
              </div>
            ) : (
              <ul className="mt-3 space-y-2">
                {projects.map((p) => (
                  <li key={p.id} className="dash-listing-row">
                    <div className="flex min-w-0 items-start gap-2.5">
                      {p.communityImage ? (
                        <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded border border-[var(--rh-border)]">
                          <Image
                            src={p.communityImage}
                            alt=""
                            width={40}
                            height={40}
                            unoptimized
                            className="h-full w-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded border border-[var(--rh-border)] bg-[var(--rh-surface-elevated)] font-brand text-sm text-[var(--rh-muted)]">
                          {(p.title || "?").charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-[var(--rh-foreground)]">{p.title}</p>
                        <p className="mt-0.5 text-xs text-[var(--rh-muted)]">
                          {p.published ? "Published" : "Draft"} · {p.groupType} · {p.accessType}
                          {p.category ? ` · ${p.category}` : ""}
                        </p>
                      </div>
                    </div>
                    <div className="flex shrink-0 flex-wrap items-center gap-1.5">
                      {p.published && (
                        <Link href={`/p/${p.slug}`} className="btn-rh-ghost">
                          View
                        </Link>
                      )}
                      <Link href={`/dashboard/edit/${p.id}`} className="btn-rh-secondary !px-3 !py-1.5">
                        Edit
                      </Link>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </SectionCard>
          )}

          {activity === "purchases" && (
            <ActivityBlock
              dense
              title="Purchase history"
              subtitle="Table of orders. Invites and review live in the second row of each order."
            >
              {buyerOrders.length === 0 ? (
                <p className="text-xs leading-relaxed text-[var(--rh-muted)]">No purchases yet. Find paid private listings in Explore.</p>
              ) : (
                <div className="dash-table-wrap">
                  <table className="w-full min-w-[800px] border-collapse text-left">
                    <thead>
                      <tr className="dash-table-head">
                        <th className={tableTh}>Product</th>
                        <th className={tableTh}>Status</th>
                        <th className={tableTh}>Price</th>
                        <th className={tableTh}>Date</th>
                        <th className={tableTh}>Access</th>
                        <th className={tableTh}>Invites</th>
                        <th className={tableTh}>Host</th>
                        <th className={tableTh}> </th>
                      </tr>
                    </thead>
                    <tbody>
                      {buyerOrders.map((o) => {
                        const acc = purchaseAccessState(o);
                        const tg = strInvite(o.grantedTelegramUrl);
                        const dc = strInvite(o.grantedDiscordUrl);
                        const showInvites = acc === "active" && (Boolean(tg) || Boolean(dc));
                        const accessLine = o.accessExpiresAt
                          ? acc === "expired"
                            ? `Ended ${new Date(o.accessExpiresAt).toLocaleString("en-US", { dateStyle: "short", timeStyle: "short" })}`
                            : `Until ${new Date(o.accessExpiresAt).toLocaleString("en-US", { dateStyle: "short", timeStyle: "short" })}`
                          : acc === "active" && UNLOCKED_ESCROW_STATUSES.has(o.status)
                            ? "No expiry"
                            : "—";
                        return (
                          <Fragment key={o.id}>
                            <tr>
                              <td className={tableTd}>
                                <p className="max-w-[220px] font-medium text-[var(--rh-foreground)]">{o.project.title}</p>
                                {o.priceOptionLabel ? (
                                  <p className="mt-0.5 text-xs text-[var(--rh-muted)]">Tier: {o.priceOptionLabel}</p>
                                ) : null}
                              </td>
                              <td className={tableTd}>
                                {acc === "active" && (
                                  <span className="inline-block rounded border border-brand/25 bg-brand/10 px-1.5 py-0.5 text-[10px] font-medium uppercase leading-none text-brand/80 sm:text-xs">
                                    Active
                                  </span>
                                )}
                                {acc === "expired" && (
                                  <span className="inline-block rounded border border-[var(--rh-border)] bg-[var(--rh-surface-elevated)] px-1.5 py-0.5 text-[10px] font-medium uppercase leading-none text-[var(--rh-muted)] sm:text-xs">
                                    Expired
                                  </span>
                                )}
                                {acc === "pending" && (
                                  <span className="inline-block max-w-[100px] truncate text-xs text-amber-200/90" title={o.status}>
                                    {o.status}
                                  </span>
                                )}
                              </td>
                              <td className={`${tableTd} whitespace-nowrap text-[var(--rh-foreground)]`}>
                                {formatEscrowAmountLabel(o.amount, resolvePriceCurrency(o.currency))}
                              </td>
                              <td className={`${tableTd} whitespace-nowrap text-[var(--rh-muted)]`}>
                                {new Date(o.createdAt).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "2-digit" })}
                              </td>
                              <td className={`${tableTd} max-w-[140px] text-xs text-[var(--rh-muted)]`} suppressHydrationWarning>
                                {accessLine}
                              </td>
                              <td className={tableTd}>
                                {showInvites ? (
                                  <div className="flex flex-wrap gap-x-2 gap-y-1 text-xs">
                                    {tg ? (
                                      <a
                                        href={tg}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="font-medium text-brand/90 underline decoration-sky-500/30 hover:text-sky-300"
                                      >
                                        TG
                                      </a>
                                    ) : null}
                                    {dc ? (
                                      <a
                                        href={dc}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="font-medium text-indigo-300/90 underline decoration-indigo-500/30 hover:text-indigo-200"
                                      >
                                        Discord
                                      </a>
                                    ) : null}
                                  </div>
                                ) : acc === "active" && !tg && !dc && UNLOCKED_ESCROW_STATUSES.has(o.status) ? (
                                  <p className="text-xs leading-snug text-amber-200/80">
                                    None stored ·{" "}
                                    <Link href={`/p/${o.project.slug}`} className="text-brand/90 underline">
                                      try listing
                                    </Link>
                                  </p>
                                ) : (
                                  <span className="text-[var(--rh-subtle)]">—</span>
                                )}
                              </td>
                              <td className={`${tableTd} max-w-[100px] truncate text-[var(--rh-muted)]`} title={o.seller.name ?? ""}>
                                {o.seller.name || "—"}
                              </td>
                              <td className={`${tableTd} text-right`}>
                                <Link
                                  href={`/p/${o.project.slug}`}
                                  className="text-sm font-medium text-brand/90 hover:underline"
                                >
                                  Open
                                </Link>
                              </td>
                            </tr>
                            <tr>
                              <td className={tableTdSub} colSpan={8}>
                                <div className="max-w-3xl">
                                  <p className="mb-1.5 text-sm font-medium uppercase tracking-wider text-[var(--rh-muted)]">Review</p>
                                  <EscrowReviewForm
                                    compact
                                    orderId={o.id}
                                    review={o.review ? { ...o.review, createdAt: o.review.createdAt } : null}
                                    operatorName={o.seller.name}
                                  />
                                </div>
                              </td>
                            </tr>
                          </Fragment>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </ActivityBlock>
          )}

          {activity === "sales" && (
            <ActivityBlock
              dense
              title="Sales & buyers"
              subtitle="On-chain sales. Reply to reviews in the Buyer reviews tab."
            >
              {sellerOrders.length === 0 ? (
                <p className="text-xs leading-relaxed text-[var(--rh-muted)]">
                  No sales yet. Publish a private, paid listing with a price to enable smart contract checkout.
                </p>
              ) : (
                <div className="dash-table-wrap">
                  <table className="w-full min-w-[700px] border-collapse text-left">
                    <thead>
                      <tr className="dash-table-head">
                        <th className={tableTh}>Buyer</th>
                        <th className={tableTh}>Listing</th>
                        <th className={tableTh}>Amount</th>
                        <th className={tableTh}>Date</th>
                        <th className={tableTh}>Review</th>
                        <th className={tableTh}> </th>
                      </tr>
                    </thead>
                    <tbody>
                      {sellerOrders.map((o) => (
                        <tr key={o.id}>
                          <td className={tableTd}>
                            <div className="flex max-w-[200px] items-center gap-2">
                              {o.buyer.image ? (
                                <Image
                                  src={o.buyer.image}
                                  width={24}
                                  height={24}
                                  className="h-6 w-6 shrink-0 rounded-full border border-[var(--rh-border)] object-cover"
                                  alt=""
                                />
                              ) : (
                                <div className="h-6 w-6 shrink-0 rounded-full border border-[var(--rh-border)] bg-[var(--rh-surface-elevated)]" />
                              )}
                              <span className="truncate text-xs font-medium text-[var(--rh-foreground)]">{o.buyer.name || "Buyer"}</span>
                            </div>
                          </td>
                          <td className={tableTd}>
                            <p className="max-w-[200px] truncate text-[var(--rh-foreground)]" title={o.project.title}>
                              {o.project.title}
                            </p>
                          </td>
                          <td className={`${tableTd} whitespace-nowrap`}>
                            {formatEscrowAmountLabel(o.amount, resolvePriceCurrency(o.currency))}
                          </td>
                          <td className={`${tableTd} whitespace-nowrap text-[var(--rh-muted)]`}>
                            {new Date(o.createdAt).toLocaleString("en-US", { dateStyle: "short", timeStyle: "short" })}
                          </td>
                          <td className={`${tableTd} max-w-[220px] text-sm text-[var(--rh-muted)]`}>
                            {o.review ? (
                              <span>
                                <span className="text-amber-400/90">★{o.review.rating}/5</span>
                                {o.review.comment?.trim()
                                  ? ` · ${o.review.comment.slice(0, 48)}${o.review.comment.length > 48 ? "…" : ""}`
                                  : ""}
                                {o.review.imageUrl ? " · photo" : ""}
                              </span>
                            ) : (
                              <span className="text-[var(--rh-subtle)]">—</span>
                            )}
                          </td>
                          <td className={`${tableTd} text-right`}>
                            <Link
                              href={`/p/${o.project.slug}`}
                              className="text-sm font-medium text-brand/90 hover:underline"
                            >
                              Open
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </ActivityBlock>
          )}

          {activity === "analytics" && (
            <ActivityBlock
              dense
              title="Seller analytics"
              subtitle="Real page views (each open of a public /p/… page, not your own) plus completed on-chain sales. Sort below is by default: most views; sales columns are completed orders only."
            >
              {totalProjects === 0 ? (
                <p className="text-xs leading-relaxed text-[var(--rh-muted)]">
                  No listings yet. Create one, publish it, and open the public page from another account or a browser where you&apos;re not the operator — that counts a view. Sales show up after a buyer completes checkout. See{" "}
                  <Link href={buildDashboardUrl(status, "sales")} className="text-brand/90 underline">Sales &amp; buyers</Link> for raw rows.
                </p>
              ) : (
                <div className="space-y-4">
                  {sellerAnalytics.completedCount === 0 && (
                    <p className="text-xs leading-relaxed text-[var(--rh-muted)]">
                      No <strong className="font-medium text-[var(--rh-muted)]">completed</strong> on-chain sales (settled) yet — gross &amp; per-listing sales may be 0. In-flight orders are in the status table when you have any.
                    </p>
                  )}

                  <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
                    <div className="dash-metric-cell">
                      <p className="app-stat-label">Page views (all)</p>
                      <p className="app-stat-value mt-1 text-lg sm:text-xl">
                        {sellerAnalytics.totalPageViews}
                      </p>
                      <p className="mt-0.5 text-[10px] text-[var(--rh-subtle)] sm:text-xs">Public listing loads</p>
                    </div>
                    <div className="dash-metric-cell">
                      <p className="app-stat-label">Completed sales</p>
                      <p className="app-stat-value mt-1 text-lg sm:text-xl">
                        {sellerAnalytics.completedCount}
                      </p>
                      <p className="mt-0.5 text-[10px] text-[var(--rh-subtle)] sm:text-xs">Settled on-chain</p>
                    </div>
                    <div className="dash-metric-cell border-brand/20 bg-brand/5">
                      <p className="app-stat-label text-brand">Gross (USDG)</p>
                      <p className="app-stat-value mt-1 text-lg text-brand sm:text-xl">
                        {formatEscrowAmountLabel(sellerAnalytics.usdgTotal, "USDG")}
                      </p>
                      <p className="mt-0.5 text-[10px] text-[var(--rh-muted)] sm:text-xs">{sellerAnalytics.usdgOrders} order{sellerAnalytics.usdgOrders === 1 ? "" : "s"}</p>
                    </div>
                    <div className="dash-metric-cell">
                      <p className="app-stat-label">Gross (ETH)</p>
                      <p className="app-stat-value mt-1 text-lg sm:text-xl">
                        {formatEscrowAmountLabel(sellerAnalytics.ethTotal, "ETH")}
                      </p>
                      <p className="mt-0.5 text-[10px] text-[var(--rh-subtle)] sm:text-xs">{sellerAnalytics.ethOrders} order{sellerAnalytics.ethOrders === 1 ? "" : "s"}</p>
                    </div>
                  </div>

                  {sellerAnalytics.topByViews.length > 0 && (
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <p className="mb-1.5 text-xs font-medium uppercase tracking-[0.12em] text-[var(--rh-muted)]">Top by views</p>
                        <div className="dash-table-wrap">
                          <table className="w-full min-w-[220px] border-collapse text-left text-[11px]">
                            <thead>
                              <tr className="dash-table-head">
                                <th className={tableTh}>#</th>
                                <th className={tableTh}>Listing</th>
                                <th className={tableTh}>Views</th>
                              </tr>
                            </thead>
                            <tbody>
                              {sellerAnalytics.topByViews.map((row, i) => (
                                <tr key={row.projectId} className="border-b border-[var(--rh-border)]">
                                  <td className={`${tableTd} w-6 text-[var(--rh-muted)]`}>{i + 1}</td>
                                  <td className={tableTd}>
                                    <Link href={`/p/${row.slug}`} className="font-medium text-brand/90 hover:underline">
                                      {row.title}
                                    </Link>
                                  </td>
                                  <td className={`${tableTd} tabular-nums`}>{row.views}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                      <div>
                        <p className="mb-1.5 text-xs font-medium uppercase tracking-[0.12em] text-[var(--rh-muted)]">Top by sales</p>
                        <div className="dash-table-wrap">
                          <table className="w-full min-w-[220px] border-collapse text-left text-[11px]">
                            <thead>
                              <tr className="dash-table-head">
                                <th className={tableTh}>#</th>
                                <th className={tableTh}>Listing</th>
                                <th className={tableTh}>Sales</th>
                              </tr>
                            </thead>
                            <tbody>
                              {sellerAnalytics.topBySales
                                .filter((row) => row.completedSales > 0)
                                .map((row, i) => (
                                <tr key={row.projectId} className="border-b border-[var(--rh-border)]">
                                  <td className={`${tableTd} w-6 text-[var(--rh-muted)]`}>{i + 1}</td>
                                  <td className={tableTd}>
                                    <Link href={`/p/${row.slug}`} className="font-medium text-brand/90 hover:underline">
                                      {row.title}
                                    </Link>
                                  </td>
                                  <td className={`${tableTd} tabular-nums`}>{row.completedSales}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                        {sellerAnalytics.topBySales.every((r) => r.completedSales === 0) && (
                          <p className="mt-1 text-xs text-[var(--rh-subtle)]">No completed sales to rank — table empty until contracts settle.</p>
                        )}
                      </div>
                    </div>
                  )}

                  {sellerAnalytics.byStatus.length > 0 && (
                    <div>
                      <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-[var(--rh-muted)]">Orders by status</p>
                      <div className="dash-table-wrap">
                        <table className="w-full min-w-[280px] border-collapse text-left text-[11px]">
                          <thead>
                            <tr className="dash-table-head">
                              <th className={tableTh}>Status</th>
                              <th className={tableTh}>Count</th>
                            </tr>
                          </thead>
                          <tbody>
                            {sellerAnalytics.byStatus.map((row) => (
                              <tr key={row.status} className="border-b border-[var(--rh-border)]">
                                <td className={`${tableTd} font-mono text-sm text-[var(--rh-muted)]`}>{row.status}</td>
                                <td className={`${tableTd} tabular-nums text-[var(--rh-foreground)]`}>{row._count._all}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {sellerAnalytics.listingReport.length > 0 && (
                    <div>
                      <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-[var(--rh-muted)]">Full listing report</p>
                      <p className="mb-1.5 text-xs text-[var(--rh-subtle)]">Rows sorted by most views. Views count only public page loads; your own visits are excluded.</p>
                      <div className="dash-table-wrap">
                        <table className="w-full min-w-[640px] border-collapse text-left text-[11px]">
                          <thead>
                            <tr className="dash-table-head">
                              <th className={tableTh}>Listing</th>
                              <th className={tableTh}>Status</th>
                              <th className={tableTh}>Views</th>
                              <th className={tableTh}>Done sales</th>
                              <th className={tableTh}>Volume</th>
                            </tr>
                          </thead>
                          <tbody>
                            {sellerAnalytics.listingReport
                              .sort((a, b) => b.views - a.views)
                              .map((row) => (
                                <tr key={row.projectId} className="border-b border-[var(--rh-border)]">
                                  <td className={tableTd}>
                                    <Link href={`/p/${row.slug}`} className="font-medium text-brand/90 hover:underline">
                                      {row.title}
                                    </Link>
                                  </td>
                                  <td className={`${tableTd} text-sm text-[var(--rh-muted)]`}>
                                    {row.published ? "Live" : "Draft"}
                                  </td>
                                  <td className={`${tableTd} tabular-nums`}>{row.views}</td>
                                  <td className={`${tableTd} tabular-nums`}>{row.completedSales}</td>
                                  <td className={`${tableTd} text-[var(--rh-muted)]`}>
                                    {[
                                      row.usdg > 0 ? formatEscrowAmountLabel(row.usdg, "USDG") : null,
                                      row.eth > 0 ? formatEscrowAmountLabel(row.eth, "ETH") : null,
                                    ]
                                      .filter(Boolean)
                                      .join(" · ") || "—"}
                                  </td>
                                </tr>
                              ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </ActivityBlock>
          )}

          {activity === "reviews" && (
            <ActivityBlock
              dense
              title="Buyer reviews"
              subtitle="Feedback on your paid listings. Reply in the second row of each review."
            >
              {reviewAsSellerCount === 0 ? (
                <p className="text-xs leading-relaxed text-[var(--rh-muted)]">
                  Reviews show up when buyers rate their purchase in Purchase history.
                </p>
              ) : (
                <div className="dash-table-wrap">
                  <table className="w-full min-w-[720px] border-collapse text-left">
                    <thead>
                      <tr className="dash-table-head">
                        <th className={tableTh}>Buyer</th>
                        <th className={tableTh}>Listing</th>
                        <th className={tableTh}>Rating</th>
                        <th className={tableTh}>Date</th>
                        <th className={tableTh}>Comment</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sellerOrders
                        .filter((o) => o.review)
                        .map((o) => (
                          <Fragment key={o.id}>
                            <tr>
                              <td className={tableTd}>
                                <p className="max-w-[140px] truncate font-medium text-[var(--rh-foreground)]">{o.buyer.name || "Buyer"}</p>
                              </td>
                              <td className={tableTd}>
                                <p className="max-w-[180px] truncate text-[var(--rh-muted)]" title={o.project.title}>
                                  {o.project.title}
                                </p>
                              </td>
                              <td className={tableTd}>
                                {o.review && (
                                  <span className="text-amber-400/90">
                                    {o.review && "★".repeat(o.review.rating)}
                                    {o.review && <span className="text-[var(--rh-subtle)]">{"☆".repeat(5 - o.review.rating)}</span>}
                                  </span>
                                )}
                              </td>
                              <td className={`${tableTd} whitespace-nowrap text-[var(--rh-muted)]`}>
                                {o.review &&
                                  new Date(o.review.createdAt).toLocaleString("en-US", {
                                    dateStyle: "short",
                                    timeStyle: "short",
                                  })}
                              </td>
                              <td className={`${tableTd} max-w-[280px] text-sm text-[var(--rh-foreground)]`}>
                                {o.review?.comment ? (
                                  <p className="line-clamp-2">{o.review.comment}</p>
                                ) : (
                                  <span className="text-[var(--rh-subtle)]">—</span>
                                )}
                              </td>
                            </tr>
                            <tr>
                              <td className={tableTdSub} colSpan={5}>
                                <div className="flex max-w-3xl flex-col gap-2 sm:flex-row sm:items-start sm:gap-4">
                                  {o.review?.imageUrl ? (
                                    <div className="relative w-full max-w-[160px] shrink-0 overflow-hidden rounded border border-[var(--rh-border)]">
                                      <Image
                                        src={o.review.imageUrl}
                                        width={320}
                                        height={240}
                                        unoptimized
                                        className="h-auto max-h-32 w-full object-cover"
                                        alt="Review"
                                      />
                                    </div>
                                  ) : null}
                                  <div className="min-w-0 flex-1">
                                    {o.review?.comment ? (
                                      <p className="text-xs leading-relaxed text-[var(--rh-muted)] sm:text-sm">{o.review.comment}</p>
                                    ) : null}
                                    {o.review && (
                                      <div className="mt-2">
                                        <SellerReviewReply
                                          key={`${o.id}-${o.review.sellerReply}`}
                                          compact
                                          orderId={o.id}
                                          initialReply={o.review.sellerReply}
                                          initialRepliedAt={o.review.sellerRepliedAt}
                                        />
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </td>
                            </tr>
                          </Fragment>
                        ))}
                    </tbody>
                  </table>
                </div>
              )}
            </ActivityBlock>
          )}

          {activity === "reports" && (
            <ActivityBlock
              dense
              title="Visitor flags on your listings"
              subtitle="Only appears when someone uses “Report listing” on your public page (spam, scam, etc.). On-chain orders and buyers are under Sales & buyers — this tab is unrelated to sales."
            >
              {incomingReports.length === 0 ? (
                <div className="space-y-3 text-xs leading-relaxed text-[var(--rh-muted)]">
                  <p>
                    No visitor flags yet. This stays empty until a visitor reports your listing; completing on-chain sales
                    does not add anything here.
                  </p>
                  {completedSalesAsSeller > 0 ? (
                    <div className="rounded border border-[var(--rh-border)] bg-[var(--rh-surface)] px-3 py-2.5 text-[var(--rh-muted)]">
                      <p className="text-sm text-[var(--rh-foreground)]">
                        You have{" "}
                        <span className="font-medium tabular-nums text-[var(--rh-foreground)]">{completedSalesAsSeller}</span>{" "}
                        completed sale{completedSalesAsSeller === 1 ? "" : "s"} as a seller — see them in{" "}
                        <Link
                          href={buildDashboardUrl(status, "sales")}
                          className="font-medium text-brand/90 underline decoration-sky-500/30 hover:text-sky-300"
                        >
                          Sales & buyers
                        </Link>
                        , not on this tab.
                      </p>
                    </div>
                  ) : null}
                </div>
              ) : (
                <ul className="divide-y divide-rose-500/10">
                  {incomingReports.map((r) => (
                    <li
                      key={r.id}
                      className="py-2.5 first:pt-0 last:pb-0 sm:py-3"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-1.5">
                        <p className="text-xs font-medium text-rose-100/90">
                          {reportReasonLabel[r.reason] ?? r.reason}
                        </p>
                        <span
                          className={`rounded px-1.5 py-0.5 text-xs font-medium sm:text-xs ${
                            r.status === "OPEN" ? "border border-amber-500/25 bg-amber-500/10 text-amber-200" : "border border-[var(--rh-border)] bg-[var(--rh-surface-elevated)] text-[var(--rh-muted)]"
                          }`}
                        >
                          {r.status}
                        </span>
                      </div>
                      <p className="mt-0.5 text-xs text-[var(--rh-muted)] sm:text-sm">Listing: {r.project.title}</p>
                      <p className="text-xs text-[var(--rh-muted)] sm:text-sm">
                        Reporter: {r.reporter.name || "User"}{" "}
                        {new Date(r.createdAt).toLocaleString("en-US", { dateStyle: "short" })}
                      </p>
                      {r.message ? (
                        <p className="mt-1.5 pl-0 text-sm leading-relaxed text-[var(--rh-muted)] sm:text-sm">
                          {r.message}
                        </p>
                      ) : null}
                    </li>
                  ))}
                </ul>
              )}
            </ActivityBlock>
          )}
      </div>
    </div>
  );
}
