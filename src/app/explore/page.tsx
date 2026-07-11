import { auth } from "@/auth";
import { CommunityListingCard } from "@/components/community-listing-card";
import { ExploreFilters } from "@/components/explore-filters";
import { RobinhoodChainMark } from "@/components/robinhood-chain-mark";
import { prisma } from "@/lib/prisma";
import {
  applyVipMaskToProject,
  fetchEscrowUnlockedProjectIds,
  resolveVipViewForProject,
} from "@/lib/viewer-listing-access";
import type { Prisma } from "@prisma/client";
import { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

export const metadata: Metadata = {
  title: "Explore Degens",
  description: "Browse public and VIP alpha Degens on Robinhood Chain.",
};

type SortKey = "newest" | "oldest" | "price_asc" | "price_desc";
type PlatformKey = "ALL" | "TELEGRAM" | "DISCORD";
type TypeKey = "ALL" | "PUBLIC" | "PRIVATE";
type AccessKey = "ALL" | "FREE" | "PAID";

type Props = {
  searchParams: Promise<{
    q?: string;
    platform?: PlatformKey;
    type?: TypeKey;
    access?: AccessKey;
    sort?: SortKey;
    minPrice?: string;
    maxPrice?: string;
    page?: string;
  }>;
};

const PAGE_SIZE = 24;

function insensitiveContains(value: string): Prisma.StringFilter {
  return { contains: value, mode: "insensitive" };
}

function parseOptionalPrice(s: string | undefined): number | undefined {
  if (s == null || s === "") return undefined;
  const n = Number(s);
  return Number.isFinite(n) ? n : undefined;
}

function parsePage(s: string | undefined): number {
  if (!s) return 1;
  const n = Number(s);
  if (!Number.isInteger(n) || n < 1) return 1;
  return n;
}

export default async function ExplorePage({ searchParams }: Props) {
  const {
    q,
    platform = "ALL",
    type = "ALL",
    access = "ALL",
    sort = "newest",
    minPrice,
    maxPrice,
    page,
  } = await searchParams;

  const min = parseOptionalPrice(minPrice);
  const max = parseOptionalPrice(maxPrice);
  const query = q?.trim();

  const platformFilter =
    platform === "TELEGRAM"
      ? { AND: [{ telegram: { not: null } }, { telegram: { not: "" } }] }
      : platform === "DISCORD"
        ? { AND: [{ discord: { not: null } }, { discord: { not: "" } }] }
        : {};

  const typeFilter =
    type === "PUBLIC" ? { groupType: "PUBLIC" } : type === "PRIVATE" ? { groupType: "PRIVATE" } : {};

  const accessFilter =
    access === "FREE" ? { accessType: "FREE" } : access === "PAID" ? { accessType: "PAID" } : {};

  const priceFilter =
    (min != null || max != null) && access !== "FREE"
      ? {
          accessType: "PAID",
          priceAmount: {
            ...(min != null ? { gte: min } : {}),
            ...(max != null ? { lte: max } : {}),
          },
        }
      : {};

  let orderBy: Prisma.ProjectOrderByWithRelationInput | Prisma.ProjectOrderByWithRelationInput[] = {
    createdAt: "desc",
  };
  if (sort === "oldest") orderBy = { createdAt: "asc" };
  else if (sort === "price_asc") orderBy = [{ priceAmount: "asc" }, { createdAt: "desc" }];
  else if (sort === "price_desc") orderBy = [{ priceAmount: "desc" }, { createdAt: "desc" }];

  const where = {
    published: true,
    ...(query
      ? {
          OR: [
            { title: insensitiveContains(query) },
            { shortPitch: insensitiveContains(query) },
            { description: insensitiveContains(query) },
            { category: insensitiveContains(query) },
            { user: { name: insensitiveContains(query) } },
            { user: { xHandle: insensitiveContains(query) } },
          ],
        }
      : {}),
    ...platformFilter,
    ...typeFilter,
    ...accessFilter,
    ...priceFilter,
  };

  const total = await prisma.project.count({ where });
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const currentPage = Math.min(parsePage(page), totalPages);
  const skip = (currentPage - 1) * PAGE_SIZE;

  const hasActiveFilters =
    Boolean(query) ||
    platform !== "ALL" ||
    type !== "ALL" ||
    access !== "ALL" ||
    sort !== "newest" ||
    min != null ||
    max != null;

  const rawItems = await prisma.project.findMany({
    where,
    orderBy,
    skip,
    take: PAGE_SIZE,
    include: {
      user: {
        select: {
          name: true,
          image: true,
          wallet: true,
          blueCheckmark: true,
          xHandle: true,
          accounts: {
            where: { provider: "twitter" },
            take: 1,
            select: { providerAccountId: true },
          },
        },
      },
      priceOptions: {
        orderBy: { sortOrder: "asc" },
        select: { priceAmount: true, id: true, label: true, telegramUrl: true, discordUrl: true },
      },
    },
  });

  const session = await auth();
  const viewerId = session?.user?.id;
  const unlocked = await fetchEscrowUnlockedProjectIds(
    viewerId,
    rawItems.map((p) => p.id),
  );
  const items = rawItems.map((p) => {
    const state = resolveVipViewForProject(p, viewerId, unlocked, p.priceOptions);
    return applyVipMaskToProject(p, {
      redactVipText: state.redactVipText,
      maskVipLinks: state.maskVipLinks,
    });
  });

  const startPage = Math.max(1, currentPage - 2);
  const endPage = Math.min(totalPages, startPage + 4);
  const visibleStart = Math.max(1, endPage - 4);
  const visiblePages = Array.from({ length: endPage - visibleStart + 1 }, (_, i) => visibleStart + i);

  const buildPageHref = (targetPage: number) => {
    const params = new URLSearchParams();
    if (q?.trim()) params.set("q", q.trim());
    if (platform !== "ALL") params.set("platform", platform);
    if (type !== "ALL") params.set("type", type);
    if (access !== "ALL") params.set("access", access);
    if (sort !== "newest") params.set("sort", sort);
    if (minPrice?.trim()) params.set("minPrice", minPrice.trim());
    if (maxPrice?.trim()) params.set("maxPrice", maxPrice.trim());
    if (targetPage > 1) params.set("page", String(targetPage));
    const queryString = params.toString();
    return queryString ? `/explore?${queryString}` : "/explore";
  };

  const showingFrom = total === 0 ? 0 : skip + 1;
  const showingTo = Math.min(skip + PAGE_SIZE, total);

  return (
    <div className="app-main-container py-4 sm:py-5">
      <header className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <RobinhoodChainMark className="h-3.5 w-3.5 shrink-0 text-brand" />
            <p className="ui-page-eyebrow">Directory</p>
          </div>
          <h1 className="mt-1 text-xl font-semibold text-[var(--rh-foreground)] sm:text-2xl">Explore Degens</h1>
        </div>
        <div className="flex shrink-0 gap-px border border-[var(--rh-border)] bg-[var(--rh-border)]">
          <div className="app-stat-cell !px-3 !py-2 text-center">
            <p className="text-lg font-semibold tabular-nums text-brand">{total}</p>
            <p className="text-[9px] uppercase tracking-[0.14em] text-[var(--rh-muted)]">Listings</p>
          </div>
          {totalPages > 1 ? (
            <div className="app-stat-cell !px-3 !py-2 text-center">
              <p className="text-lg font-semibold tabular-nums text-[var(--rh-foreground)]">
                {currentPage}<span className="text-[var(--rh-muted)]">/{totalPages}</span>
              </p>
              <p className="text-[9px] uppercase tracking-[0.14em] text-[var(--rh-muted)]">Page</p>
            </div>
          ) : null}
        </div>
      </header>

      <ExploreFilters
        q={q ?? ""}
        platform={platform}
        type={type}
        access={access}
        sort={sort}
        minPrice={minPrice ?? ""}
        maxPrice={maxPrice ?? ""}
        hasActiveFilters={hasActiveFilters}
      />

      <section className="mt-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm text-[var(--rh-muted)]">
            {total === 0 ? (
              "No results"
            ) : (
              <>
                Showing{" "}
                <span className="text-[var(--rh-foreground)]">
                  {showingFrom}–{showingTo}
                </span>{" "}
                of <span className="text-[var(--rh-foreground)]">{total}</span>
              </>
            )}
          </p>
          {hasActiveFilters ? <span className="badge-rh">Filtered</span> : null}
        </div>

        {items.length === 0 ? (
          <div className="card-rh flex flex-col items-center justify-center !rounded-none border-dashed px-6 py-20 text-center">
            <p className="text-lg font-semibold text-[var(--rh-foreground)]">No Degens found</p>
            <p className="mt-2 max-w-md text-sm leading-relaxed text-[var(--rh-muted)]">
              Try a broader search or clear your filters to browse the full directory.
            </p>
            {hasActiveFilters ? (
              <Link href="/explore" className="btn-rh-secondary mt-6">
                Clear all filters
              </Link>
            ) : null}
          </div>
        ) : (
          <div className="explore-tile-grid">
            {items.map((p) => (
              <CommunityListingCard key={p.id} project={p} showOperatorHandle compact />
            ))}
          </div>
        )}

        {totalPages > 1 ? (
          <nav className="mt-8 flex items-center justify-center gap-2" aria-label="Explore pagination">
            <Link
              href={buildPageHref(Math.max(1, currentPage - 1))}
              scroll={false}
              aria-disabled={currentPage === 1}
              className={`explore-page-btn ${currentPage === 1 ? "explore-page-btn--disabled" : ""}`}
            >
              <ChevronLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Prev</span>
            </Link>
            <div className="flex items-center gap-1.5">
              {visiblePages.map((p) => (
                <Link
                  key={p}
                  href={buildPageHref(p)}
                  scroll={false}
                  aria-current={p === currentPage ? "page" : undefined}
                  className={`explore-page-num ${p === currentPage ? "explore-page-num--active" : ""}`}
                >
                  {p}
                </Link>
              ))}
            </div>
            <Link
              href={buildPageHref(Math.min(totalPages, currentPage + 1))}
              scroll={false}
              aria-disabled={currentPage === totalPages}
              className={`explore-page-btn ${currentPage === totalPages ? "explore-page-btn--disabled" : ""}`}
            >
              <span className="hidden sm:inline">Next</span>
              <ChevronRight className="h-4 w-4" />
            </Link>
          </nav>
        ) : null}
      </section>
    </div>
  );
}
