import { auth } from "@/auth";
import { ListingPriceLabel } from "@/components/listing-price-label";
import { escrowEligible, formatEscrowAmountLabel, resolvePriceCurrency } from "@/lib/listing-price";
import { prisma } from "@/lib/prisma";
import { redactVipSocialLinks } from "@/lib/redact-vip-text";
import { isPaidVipListing } from "@/lib/vip-link-access";
import {
  fetchActiveEscrowAccessForProject,
  fetchEscrowUnlockedProjectIds,
  resolveVipViewForProject,
} from "@/lib/viewer-listing-access";
import { CommunityReviewsSection } from "@/components/community-reviews";
import { ListingDetailTabs, type ListingTabSpec } from "@/components/listing-detail-tabs";
import { ReportListingButton } from "@/components/dashboard/report-listing-button";
import { EscrowBuyButton } from "@/components/escrow-buy-button";
import type { Metadata } from "next";
import { XUsername } from "@/components/x-username";
import { CreatorAvatar } from "@/components/creator-avatar";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ListingGallery } from "@/components/listing-gallery";
import { OperatorPayoutDisplay } from "@/components/operator-payout-display";
import { parseDetailImagesJson } from "@/lib/project-detail-images";

function strOrEmpty(s: string | null | undefined): string | null {
  if (s == null) return null;
  const t = s.trim();
  return t.length > 0 ? t : null;
}

/** Hide accidental console / dev log pasted as pitch */
function isLikelyDevOrConsoleNoise(text: string): boolean {
  return /[\w./-]+\.tsx:\d+/i.test(text) || /solana-provider|registerDefaultProvider|removed from your app|Phantom was registered/i.test(text);
}

function pickRandom<T>(items: T[], n: number): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr.slice(0, n);
}

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const p = await prisma.project.findUnique({ where: { slug } });
  if (!p || !p.published) return { title: "Not found" };
  const publicShortPitch =
    p.accessType === "PAID" && p.shortPitch
      ? redactVipSocialLinks(p.shortPitch)
      : p.shortPitch;
  return {
    title: `${p.title} - AlphaHub`,
    description: publicShortPitch,
  };
}

export default async function ProjectPage({ params }: Props) {
  const { slug } = await params;
  const p = await prisma.project.findUnique({
    where: { slug },
    include: {
      user: {
        select: {
          name: true,
          image: true,
          wallet: true,
          payoutWallet: true,
          blueCheckmark: true,
          xHandle: true,
          accounts: {
            where: { provider: "twitter" },
            take: 1,
            select: { providerAccountId: true },
          },
        },
      },
      priceOptions: { orderBy: { sortOrder: "asc" } },
    },
  });
  if (!p || !p.published) notFound();

  const session = await auth();
  const viewerId = session?.user?.id;
  /** One view per page load; skip operator so analytics stay buyer-focused. */
  if (viewerId == null || viewerId !== p.userId) {
    /** Raw SQL: works if Prisma Client is stale (e.g. `viewCount` not in DMMF) or generate failed (EPERM on Windows). */
    void prisma
      .$executeRawUnsafe(
        `UPDATE "Project" SET "viewCount" = COALESCE("viewCount", 0) + 1 WHERE "id" = $1`,
        p.id,
      )
      .catch(() => {});
  }

  const unlocked = await fetchEscrowUnlockedProjectIds(viewerId, [p.id]);
  const { isOwner, maskVipLinks, redactVipText } = resolveVipViewForProject(
    p,
    viewerId,
    unlocked,
    p.priceOptions,
  );
  const accessRow =
    viewerId && unlocked.has(p.id) ? await fetchActiveEscrowAccessForProject(viewerId, p.id) : null;
  const aboutText = redactVipText && p.description ? redactVipSocialLinks(p.description) : p.description;
  const shortPitchText = redactVipText && p.shortPitch ? redactVipSocialLinks(p.shortPitch) : p.shortPitch;
  const rulesText = redactVipText && p.rules ? redactVipSocialLinks(p.rules) : p.rules;
  const policyText = redactVipText && p.deliveryPolicy ? redactVipSocialLinks(p.deliveryPolicy) : p.deliveryPolicy;

  const grantedSnapTg = strOrEmpty(accessRow?.grantedTelegramUrl);
  const grantedSnapDc = strOrEmpty(accessRow?.grantedDiscordUrl);
  /** Tier on this order (relation) or same id on the listing (if relation is missing / stale). */
  const tierRowFromListing =
    accessRow?.priceOptionId != null
      ? p.priceOptions?.find((o) => o.id === accessRow.priceOptionId) ?? null
      : null;
  const tierTg =
    strOrEmpty(accessRow?.priceOption?.telegramUrl) ?? strOrEmpty(tierRowFromListing?.telegramUrl);
  const tierDc =
    strOrEmpty(accessRow?.priceOption?.discordUrl) ?? strOrEmpty(tierRowFromListing?.discordUrl);
  const fromProjectTg = strOrEmpty(p.telegram);
  const fromProjectDc = strOrEmpty(p.discord);
  /**
   * Tier purchase: snapshot → that tier’s invites → then listing-wide defaults.
   * No tier: snapshot → project links.
   */
  const effectiveTg = accessRow?.priceOptionId
    ? (grantedSnapTg ?? tierTg ?? fromProjectTg)
    : (grantedSnapTg ?? fromProjectTg);
  const effectiveDc = accessRow?.priceOptionId
    ? (grantedSnapDc ?? tierDc ?? fromProjectDc)
    : (grantedSnapDc ?? fromProjectDc);
  const links = [
    { label: "Telegram" as const, href: effectiveTg },
    { label: "Discord" as const, href: effectiveDc },
  ].filter((x): x is { label: "Telegram" | "Discord"; href: string } => Boolean(x.href));
  const typeLabel = p.groupType === "PUBLIC" ? "Public" : "Private";
  const accessLabel = p.accessType === "PAID" ? "VIP" : "Open";
  const showPriceRow = p.groupType !== "PUBLIC";
  const priceOpts = p.priceOptions?.filter((o) => o.priceAmount > 0) ?? [];
  const offersTelegram =
    Boolean(p.telegram?.trim()) || priceOpts.some((o) => (o.telegramUrl?.trim() ?? "").length > 0);
  const offersDiscord =
    Boolean(p.discord?.trim()) || priceOpts.some((o) => (o.discordUrl?.trim() ?? "").length > 0);
  const hasLinkOffers = offersTelegram || offersDiscord;
  const canEscrow = escrowEligible(p, priceOpts);
  const hasBoughtAccess = Boolean(viewerId && unlocked.has(p.id));
  const minEscrowAmount =
    priceOpts.length > 0 ? Math.min(...priceOpts.map((o) => o.priceAmount)) : p.priceAmount ?? 0;
  const escrowLabel =
    canEscrow && minEscrowAmount > 0
      ? formatEscrowAmountLabel(minEscrowAmount, resolvePriceCurrency(p.priceCurrency))
      : null;
  const showSidebarInviteLinks = hasBoughtAccess && Boolean(effectiveTg || effectiveDc);
  const showPaidNoLinksNote = hasBoughtAccess && !effectiveTg && !effectiveDc;
  /** VIP checkout box already shows Open Telegram/Discord; avoid duplicating a second link card. */
  const communityLinksInEscrowCard = canEscrow && showSidebarInviteLinks;
  const showSidebarCommunityLinkCard =
    (links.length > 0 || (maskVipLinks && isPaidVipListing(p) && hasLinkOffers)) &&
    !communityLinksInEscrowCard;
  const detailImages = parseDetailImagesJson(p.detailImages);

  const [reviewAgg, reviewRows] = await Promise.all([
    prisma.escrowReview.aggregate({
      where: { order: { projectId: p.id } },
      _avg: { rating: true },
      _count: { _all: true },
    }),
    prisma.escrowReview.findMany({
      where: { order: { projectId: p.id } },
      orderBy: { createdAt: "desc" },
      take: 30,
      include: {
        order: {
          select: {
            buyer: {
              select: {
                name: true,
                image: true,
                xHandle: true,
                accounts: {
                  where: { provider: "twitter" },
                  take: 1,
                  select: { providerAccountId: true },
                },
              },
            },
            seller: {
              select: {
                name: true,
                image: true,
                xHandle: true,
                accounts: {
                  where: { provider: "twitter" },
                  take: 1,
                  select: { providerAccountId: true },
                },
              },
            },
          },
        },
      },
    }),
  ]);
  const relatedByCategoryPool = p.category
    ? await prisma.project.findMany({
        where: {
          published: true,
          id: { not: p.id },
          category: p.category,
        },
        orderBy: { createdAt: "desc" },
        take: 30,
        select: {
          id: true,
          slug: true,
          title: true,
          shortPitch: true,
          accessType: true,
          groupType: true,
          priceAmount: true,
          priceCurrency: true,
          communityImage: true,
          user: {
            select: {
              name: true,
              xHandle: true,
              accounts: {
                where: { provider: "twitter" },
                take: 1,
                select: { providerAccountId: true },
              },
            },
          },
        },
      })
    : [];
  const relatedByCategory = pickRandom(relatedByCategoryPool, 5);
  const relatedFallback =
    relatedByCategory.length < 5
      ? await prisma.project.findMany({
          where: {
            published: true,
            id: { notIn: [p.id, ...relatedByCategory.map((x) => x.id)] },
          },
          orderBy: { createdAt: "desc" },
          take: 30,
          select: {
            id: true,
            slug: true,
            title: true,
            shortPitch: true,
            accessType: true,
            groupType: true,
            priceAmount: true,
            priceCurrency: true,
            communityImage: true,
            user: {
              select: {
                name: true,
                xHandle: true,
                accounts: {
                  where: { provider: "twitter" },
                  take: 1,
                  select: { providerAccountId: true },
                },
              },
            },
          },
        })
      : [];
  const recommendedItems = [
    ...relatedByCategory,
    ...pickRandom(relatedFallback, 5 - relatedByCategory.length),
  ];

  const communityReviewItems = reviewRows.map((r) => {
    const buyer = r.order.buyer;
    const seller = r.order.seller;
    return {
      id: r.id,
      rating: r.rating,
      comment: r.comment,
      imageUrl: r.imageUrl,
      createdAt: r.createdAt.toISOString(),
      sellerReply: r.sellerReply,
      sellerRepliedAt: r.sellerRepliedAt?.toISOString() ?? null,
      buyer: {
        name: buyer.name,
        image: buyer.image,
        xHandle: buyer.xHandle,
        xUserId: buyer.accounts[0]?.providerAccountId ?? null,
      },
      operator: {
        name: seller.name,
        image: seller.image,
        xHandle: seller.xHandle,
        xUserId: seller.accounts[0]?.providerAccountId ?? null,
      },
    };
  });
  const reviewAverage = reviewAgg._avg.rating ?? 0;
  const reviewCount = reviewAgg._count._all;

  return (
    <article className="app-main-container py-6 sm:py-8">
      <nav className="mb-5 flex min-w-0 items-center gap-2 font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--rh-muted)] sm:text-[11px]">
        <Link href="/explore" className="shrink-0 transition hover:text-brand">
          Directory
        </Link>
        <span aria-hidden>/</span>
        <span className="min-w-0 truncate text-[var(--rh-foreground)]">{p.title}</span>
      </nav>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px] xl:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
        <div className="min-w-0 space-y-4">
          <header className="listing-hero-compact">
            <div className="flex items-center gap-3 p-3 sm:gap-4 sm:p-4">
              {p.communityImage ? (
                <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded border border-[var(--rh-border)] sm:h-16 sm:w-16">
                  <Image src={p.communityImage} alt="" fill unoptimized className="object-cover" sizes="64px" />
                </div>
              ) : (
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded border border-[var(--rh-border)] bg-[var(--rh-surface-elevated)] text-lg font-semibold text-brand sm:h-16 sm:w-16 sm:text-xl">
                  {(p.title || "C").charAt(0).toUpperCase()}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="badge-rh !px-1.5 !py-0 !text-[8px]">{typeLabel}</span>
                  <span className={`badge-rh !px-1.5 !py-0 !text-[8px] ${p.accessType === "PAID" ? "" : "!border-[var(--rh-border)] !text-[var(--rh-muted)]"}`}>
                    {accessLabel}
                  </span>
                  {p.category ? <span className="badge-rh !border-[var(--rh-border)] !px-1.5 !py-0 !text-[8px] !text-[var(--rh-muted)]">{p.category}</span> : null}
                </div>
                <h1 className="mt-1.5 truncate text-lg font-semibold text-[var(--rh-foreground)] sm:text-xl">{p.title}</h1>
                {shortPitchText && !isLikelyDevOrConsoleNoise(shortPitchText) ? (
                  <p className="mt-1 line-clamp-1 text-sm text-[var(--rh-muted)]">{shortPitchText}</p>
                ) : null}
              </div>
              <div className="hidden shrink-0 items-center gap-2 sm:flex">
                {p.user.image ? (
                  <CreatorAvatar src={p.user.image} alt={p.user.name || "Operator"} width={28} height={28} className="h-7 w-7 rounded-full border border-[var(--rh-border)] object-cover" />
                ) : (
                  <div className="h-7 w-7 rounded-full border border-[var(--rh-border)] bg-[var(--rh-surface-elevated)]" />
                )}
                <div className="min-w-0 max-w-[120px]">
                  <p className="truncate text-sm font-medium text-[var(--rh-foreground)]">
                    <XUsername name={p.user.name || "Operator"} xHandle={p.user.xHandle} xUserId={p.user.accounts?.[0]?.providerAccountId} className="truncate" />
                  </p>
                </div>
                {p.user.blueCheckmark ? (
                  <Image src="/verified-badge.png" alt="Verified" width={12} height={12} className="h-3 w-3 shrink-0" />
                ) : null}
              </div>
            </div>
            {isOwner && isPaidVipListing(p) ? (
              <p className="border-t border-[var(--rh-border)] px-3 py-2 text-sm text-[var(--rh-muted)] sm:px-4">
                <span className="text-brand">Owner view</span> — links hidden until checkout.{" "}
                <Link href="/dashboard" className="text-brand hover:underline">Edit listing</Link>
              </p>
            ) : null}
          </header>

          {(() => {
            const showDescriptionTab = Boolean(p.description?.trim());
            const hasRules = Boolean(p.rules?.trim());
            const hasAccess = Boolean(p.deliveryPolicy?.trim());
            const tabs: ListingTabSpec[] = [];
            if (showDescriptionTab) {
              tabs.push({
                id: "description",
                label: "Description",
                content: (
                  <div>
                    {p.description?.trim() ? (
                      <div>
                        {redactVipText && (
                          <p className="mb-3 rounded border border-brand/20 bg-brand/5 px-3 py-2 text-xs leading-relaxed text-brand">
                            Paid access: community links in this text stay hidden until checkout completes.
                          </p>
                        )}
                        <div className="listing-prose max-w-2xl break-words">
                          <div className="whitespace-pre-wrap text-[var(--rh-foreground)]">{aboutText}</div>
                        </div>
                      </div>
                    ) : null}
                  </div>
                ),
              });
            }
            if (hasRules) {
              tabs.push({
                id: "rules",
                label: "Rules",
                content: <div className="listing-prose whitespace-pre-wrap break-words text-[var(--rh-foreground)]">{rulesText}</div>,
              });
            }
            if (hasAccess) {
              tabs.push({
                id: "access",
                label: "Access",
                content: <div className="listing-prose whitespace-pre-wrap break-words text-[var(--rh-foreground)]">{policyText}</div>,
              });
            }
            const reviewLabel = reviewCount > 0 ? `Reviews · ${reviewCount}` : "Reviews";
            tabs.push({
              id: "reviews",
              label: reviewLabel,
              content: (
                <CommunityReviewsSection
                  items={communityReviewItems}
                  averageRating={reviewAverage}
                  count={reviewCount}
                  embedInTabs
                />
              ),
            });
            return <ListingDetailTabs tabs={tabs} defaultId={tabs[0]!.id} />;
          })()}

          {detailImages.length > 0 && (
            <section className="card-rh" aria-label="Community images">
              <div className="border-b border-[var(--rh-border)] px-4 py-3 sm:px-5">
                <p className="ui-form-label">Photos</p>
              </div>
              <div className="p-4 sm:p-5">
                <ListingGallery images={detailImages} compact />
              </div>
            </section>
          )}
        </div>

        <aside className="listing-sidebar-sticky min-w-0">
          <div className="flex flex-col gap-4">
            <div className="listing-detail-card !p-3 sm:!p-4">
              <p className="ui-form-label">From</p>
              {showPriceRow ? (
                <div className="mt-1.5">
                  <ListingPriceLabel
                    project={p}
                    priceOptions={p.priceOptions}
                    className="items-baseline gap-1"
                    textClassName="text-xl font-semibold text-[var(--rh-foreground)] tabular-nums sm:text-2xl"
                    largeMark
                  />
                </div>
              ) : (
                <p className="mt-1.5 text-base font-semibold text-brand">Free to view</p>
              )}
              <dl className="mt-3 space-y-2 border-t border-[var(--rh-border)] pt-3 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-[var(--rh-muted)]">Type</dt>
                  <dd className="font-medium text-[var(--rh-foreground)]">{typeLabel}</dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-[var(--rh-muted)]">Access</dt>
                  <dd className="font-medium text-[var(--rh-foreground)]">{accessLabel}</dd>
                </div>
                {p.category ? (
                  <div className="flex items-center justify-between gap-3">
                    <dt className="text-[var(--rh-muted)]">Niche</dt>
                    <dd className="max-w-[60%] truncate text-right font-medium text-[var(--rh-foreground)]">{p.category}</dd>
                  </div>
                ) : null}
              </dl>
            </div>

            {canEscrow ? (
              <div className="listing-access-card">
                <h3 className="text-sm font-semibold text-brand">Get access</h3>
                <OperatorPayoutDisplay
                  user={p.user}
                  currency={p.priceCurrency}
                  className="mt-3"
                />
                {showSidebarInviteLinks ? (
                  <div className="mt-3 space-y-3 text-sm">
                    <p className="text-[var(--rh-muted)]">You&apos;re in — your links are below.</p>
                    <p className="text-xs text-[var(--rh-muted)]">
                      <Link href="/dashboard?activity=purchases" className="text-brand underline-offset-2 hover:underline">
                        Dashboard
                      </Link>{" "}
                      has your saved links too.
                    </p>
                    <div className="flex flex-col gap-2">
                      {effectiveTg ? (
                        <a href={effectiveTg} target="_blank" rel="noopener noreferrer" className="btn-rh-glow">
                          Open Telegram
                        </a>
                      ) : null}
                      {effectiveDc ? (
                        <a href={effectiveDc} target="_blank" rel="noopener noreferrer" className="btn-rh-glow">
                          Open Discord
                        </a>
                      ) : null}
                    </div>
                    {accessRow?.accessExpiresAt ? (
                      <p className="text-xs text-[var(--rh-muted)]" suppressHydrationWarning>
                        Until{" "}
                        {new Date(accessRow.accessExpiresAt).toLocaleString("en-US", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}
                        {accessRow.priceOptionLabel ? ` · ${accessRow.priceOptionLabel}` : ""}
                      </p>
                    ) : null}
                  </div>
                ) : showPaidNoLinksNote ? (
                  <p className="mt-3 text-sm text-[var(--rh-muted)]">
                    No invite link stored for this purchase — ask the host to add one in the dashboard.
                  </p>
                ) : (
                  <>
                    {!escrowLabel && (
                      <p className="mt-2 text-sm text-[var(--rh-muted)]">Connect a wallet to see checkout.</p>
                    )}
                    <div className="mt-3">
                      <EscrowBuyButton
                        key={p.id}
                        projectId={p.id}
                        amountLabel={escrowLabel ?? undefined}
                        listingAmount={p.priceAmount}
                        priceCurrency={p.priceCurrency}
                        priceOptions={priceOpts.map((o) => ({
                          id: o.id,
                          label: o.label,
                          priceAmount: o.priceAmount,
                        }))}
                      />
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="listing-detail-card text-sm text-[var(--rh-muted)]">
                {p.accessType === "FREE" ? "Public / free access — no checkout." : "No checkout for this listing type."}
              </div>
            )}

            {showSidebarCommunityLinkCard ? (
              <div className="listing-detail-card !p-3 sm:!p-4">
                <p className="ui-form-label">Community links</p>
                {maskVipLinks ? (
                  <div className="mt-2.5 space-y-2">
                    <p className="text-sm text-[var(--rh-muted)]">
                      Join to unlock Telegram &amp; Discord — links show here after purchase.
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {[
                        ...(offersTelegram ? [{ label: "Telegram" as const }] : []),
                        ...(offersDiscord ? [{ label: "Discord" as const }] : []),
                      ].map((l) => (
                        <span key={l.label} className="badge-rh !text-[9px] opacity-70">
                          {l.label} · locked
                        </span>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="mt-2.5 flex flex-col gap-2">
                    {links.map((l) => (
                      <a
                        key={l.label}
                        href={l.href!}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-rh-glow"
                      >
                        {l.label}
                      </a>
                    ))}
                    {accessRow?.accessExpiresAt ? (
                      <p className="text-sm text-[var(--rh-muted)]" suppressHydrationWarning>
                        Access active until{" "}
                        {new Date(accessRow.accessExpiresAt).toLocaleString("en-US", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}
                        {accessRow.priceOptionLabel ? ` · ${accessRow.priceOptionLabel}` : ""}
                      </p>
                    ) : null}
                    {accessRow?.grantedDiscordRoleId ? (
                      <p className="text-sm text-[var(--rh-muted)]">
                        Discord role ID:{" "}
                        <code className="rounded border border-[var(--rh-border)] bg-[var(--rh-surface-elevated)] px-1.5 py-0.5 font-mono text-[10px] text-[var(--rh-foreground)]">
                          {accessRow.grantedDiscordRoleId}
                        </code>
                      </p>
                    ) : null}
                  </div>
                )}
              </div>
            ) : null}

            <div className="flex flex-col gap-2">
              <Link href="/explore" className="btn-rh-secondary w-full">
                More listings
              </Link>
              <ReportListingButton
                projectId={p.id}
                isOwner={isOwner}
                isLoggedIn={!!session?.user}
                callbackPath={`/p/${slug}`}
              />
            </div>
          </div>
        </aside>
      </div>

      {recommendedItems.length > 0 && (
        <section className="card-rh mt-10">
          <div className="flex flex-wrap items-end justify-between gap-3 border-b border-[var(--rh-border)] px-4 py-4 sm:px-5">
            <div>
              <p className="ui-form-label">Recommended</p>
              <p className="ui-form-hint mt-1">Similar and recent Degens you may like</p>
            </div>
            <Link href="/explore" className="font-mono text-[10px] uppercase tracking-[0.1em] text-brand hover:underline">
              View all
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2 sm:p-5 lg:grid-cols-3 xl:grid-cols-5">
            {recommendedItems.map((item) => {
              const itemShortPitch =
                item.accessType === "PAID" && item.shortPitch ? redactVipSocialLinks(item.shortPitch) : item.shortPitch;
              const isVip = item.accessType === "PAID";
              return (
                <Link key={item.id} href={`/p/${item.slug}`} className="listing-rec-card group">
                  <div className="flex items-start gap-3">
                    {item.communityImage ? (
                      <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded border border-[var(--rh-border)]">
                        <Image src={item.communityImage} alt="" fill unoptimized className="object-cover" />
                      </div>
                    ) : (
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded border border-[var(--rh-border)] bg-[var(--rh-surface-elevated)] text-sm font-bold text-brand">
                        {(item.title || "?").charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-2 text-sm font-semibold text-[var(--rh-foreground)] transition group-hover:text-brand">
                        {item.title}
                      </p>
                      <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.08em] text-[var(--rh-muted)]">
                        {item.groupType === "PUBLIC" ? "Public" : "Private"} · {isVip ? "VIP" : "Open"}
                      </p>
                    </div>
                  </div>
                  <p className="mt-3 line-clamp-2 flex-1 text-xs leading-relaxed text-[var(--rh-muted)]">{itemShortPitch}</p>
                  <p className="mt-3 border-t border-[var(--rh-border)] pt-3 text-xs font-medium tabular-nums text-[var(--rh-foreground)]">
                    {isVip && item.priceAmount
                      ? formatEscrowAmountLabel(item.priceAmount, resolvePriceCurrency(item.priceCurrency))
                      : "Open"}
                  </p>
                </Link>
              );
            })}
          </div>
        </section>
      )}
    </article>
  );
}
