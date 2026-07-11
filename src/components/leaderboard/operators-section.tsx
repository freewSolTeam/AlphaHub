import { CreatorAvatar } from "@/components/creator-avatar";
import type { LeaderboardOperator } from "@/lib/leaderboard-operators";
import { XUsername } from "@/components/x-username";
import { ArrowRight, Crown, Medal, Users } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

function formatViews(n: number) {
  return n.toLocaleString("en-US");
}

function RankChip({ rank }: { rank: number }) {
  if (rank === 1) {
    return (
      <span className="inline-flex h-6 w-6 items-center justify-center border border-amber-400/40 bg-amber-400/10">
        <Crown className="h-3.5 w-3.5 text-amber-300" strokeWidth={2} aria-hidden />
      </span>
    );
  }
  if (rank === 2) {
    return (
      <span className="inline-flex h-6 w-6 items-center justify-center border border-zinc-400/30 bg-zinc-400/10">
        <Medal className="h-3.5 w-3.5 text-zinc-300" strokeWidth={2} aria-hidden />
      </span>
    );
  }
  if (rank === 3) {
    return (
      <span className="inline-flex h-6 w-6 items-center justify-center border border-orange-400/35 bg-orange-400/10">
        <Medal className="h-3.5 w-3.5 text-orange-300" strokeWidth={2} aria-hidden />
      </span>
    );
  }
  return (
    <span className="inline-flex h-6 w-6 items-center justify-center text-xs font-semibold tabular-nums text-[var(--rh-muted)]">
      {rank}
    </span>
  );
}

function OperatorName({ user, linkToProfile }: { user: LeaderboardOperator["user"]; linkToProfile?: boolean }) {
  const display = user.name || "Anonymous";

  return (
    <span className="inline-flex min-w-0 max-w-full items-center gap-1">
      {linkToProfile ? (
        <Link
          href={`/leaderboard/operators/${user.id}`}
          className="truncate text-[13px] font-medium leading-tight text-[var(--rh-foreground)] transition hover:text-brand sm:text-sm"
        >
          {display}
        </Link>
      ) : (
        <XUsername
          name={display}
          xHandle={user.xHandle}
          xUserId={user.accounts?.[0]?.providerAccountId}
          className="truncate text-xs font-medium text-[var(--rh-foreground)] sm:text-sm"
        />
      )}
      {user.blueCheckmark ? (
        <Image src="/verified-badge.png" alt="Verified" width={12} height={12} className="h-3 w-3 shrink-0" />
      ) : null}
    </span>
  );
}

function OperatorRow({
  row,
  rank,
  maxViews,
  linkToProfile = false,
}: {
  row: LeaderboardOperator;
  rank: number;
  maxViews: number;
  linkToProfile?: boolean;
}) {
  const pct = maxViews > 0 ? Math.max(3, Math.round((row.totalViews / maxViews) * 100)) : 0;
  const top3 = rank <= 3;

  return (
    <div
      className={`grid grid-cols-[1.25rem_2rem_minmax(0,1fr)_3.25rem] items-center gap-x-2 border-b border-[var(--rh-border)] px-2.5 py-2.5 transition last:border-0 hover:bg-[var(--rh-surface-elevated)] sm:grid-cols-[1.75rem_2.25rem_minmax(0,1fr)_4rem_3.5rem] sm:gap-x-2.5 sm:px-3.5 sm:py-2 ${top3 ? "bg-brand/[0.03]" : ""}`}
    >
      <div className="flex justify-center">
        <RankChip rank={rank} />
      </div>
      {linkToProfile ? (
        <Link href={`/leaderboard/operators/${row.user.id}`} className="shrink-0 transition hover:opacity-90">
          <CreatorAvatar
            src={row.user.image}
            alt={row.user.name || "Operator"}
            width={28}
            height={28}
            className="h-7 w-7 rounded-full border border-[var(--rh-border)] object-cover"
          />
        </Link>
      ) : (
        <CreatorAvatar
          src={row.user.image}
          alt={row.user.name || "Operator"}
          width={28}
          height={28}
          className="h-7 w-7 shrink-0 rounded-full border border-[var(--rh-border)] object-cover"
        />
      )}
      <div className="min-w-0 overflow-hidden">
        <OperatorName user={row.user} linkToProfile={linkToProfile} />
        {row.topListing ? (
          <Link
            href={`/p/${row.topListing.slug}`}
            className="mt-0.5 block truncate text-[11px] leading-tight text-[var(--rh-muted)] transition hover:text-[var(--rh-foreground)] sm:text-xs"
          >
            {row.topListing.title}
          </Link>
        ) : (
          <p className="mt-0.5 text-[11px] text-[var(--rh-subtle)] sm:text-xs">No listings</p>
        )}
        <p className="mt-0.5 text-[10px] tabular-nums text-[var(--rh-subtle)] sm:hidden">
          {row.listingCount} listing{row.listingCount === 1 ? "" : "s"}
        </p>
        <div className="mt-1.5 hidden h-0.5 max-w-[140px] overflow-hidden bg-[var(--rh-border)] sm:block">
          <div className="h-full bg-brand/60" style={{ width: `${pct}%` }} />
        </div>
      </div>
      <span className="hidden text-right text-xs tabular-nums text-[var(--rh-muted)] sm:block">
        {row.listingCount}
      </span>
      <span className="text-right text-[11px] font-semibold tabular-nums leading-none text-brand sm:text-sm">
        {formatViews(row.totalViews)}
      </span>
    </div>
  );
}

type Props = {
  operators: LeaderboardOperator[];
  /** Main page: max rows shown (rest via View all) */
  previewLimit?: number;
  /** Total users before slice — drives View all visibility */
  fullCount?: number;
  viewAllHref?: string;
  className?: string;
  /** Search bar rendered below the section header (all-operators page) */
  searchSlot?: React.ReactNode;
  /** Original count before client-side search filter */
  unfilteredTotal?: number;
  isFiltering?: boolean;
  /** Link operator name/avatar to public profile page */
  linkToProfile?: boolean;
  /** On mobile tab layout: slim header with subtitle + View all only */
  compactMobileHeader?: boolean;
};

export function OperatorsSection({
  operators,
  previewLimit,
  fullCount,
  viewAllHref = "/leaderboard/operators",
  className = "",
  searchSlot,
  unfilteredTotal,
  isFiltering = false,
  linkToProfile = false,
  compactMobileHeader = false,
}: Props) {
  const total = fullCount ?? unfilteredTotal ?? operators.length;
  const isPreview = previewLimit != null;
  const displayed = isPreview ? operators.slice(0, previewLimit) : operators;
  const maxViews = displayed[0]?.totalViews ?? operators[0]?.totalViews ?? 1;
  const showViewAll = isPreview && total > previewLimit;
  const sectionHeight = isPreview
    ? "md:h-full md:min-h-0"
    : "max-md:max-h-none md:max-h-[min(calc(100dvh-14rem),680px)]";

  const subtitle = isPreview
    ? `Showing ${displayed.length} of ${total} users`
    : isFiltering && unfilteredTotal != null
      ? `${operators.length} of ${unfilteredTotal} users`
      : `${total} users by views`;

  return (
    <section
      className={`flex flex-col border border-[var(--rh-border)] bg-[var(--rh-surface)] max-md:overflow-visible md:overflow-hidden ${sectionHeight} ${className}`}
    >
      {compactMobileHeader ? (
        <div className="flex shrink-0 items-center justify-between gap-2 border-b border-[var(--rh-border)] px-3 py-2 md:hidden">
          <p className="min-w-0 truncate text-[11px] text-[var(--rh-muted)]">{subtitle}</p>
          {showViewAll ? (
            <Link
              href={viewAllHref}
              className="inline-flex h-7 shrink-0 items-center gap-1 border border-[var(--rh-border)] px-2 text-[11px] font-medium text-[var(--rh-muted)] transition hover:border-brand/30 hover:text-brand"
            >
              View all
              <ArrowRight className="h-3 w-3" strokeWidth={2} aria-hidden />
            </Link>
          ) : null}
        </div>
      ) : null}

      <div
        className={`shrink-0 items-center justify-between gap-2 border-b border-[var(--rh-border)] px-3.5 py-3 ${
          compactMobileHeader ? "hidden md:flex" : "flex"
        }`}
      >
        <div className="flex min-w-0 items-center gap-2">
          <Users className="h-4 w-4 shrink-0 text-brand" strokeWidth={1.75} aria-hidden />
          <div className="min-w-0">
            <h2 className="ui-form-section-title text-sm">Top operators</h2>
            <p className="truncate text-[11px] text-[var(--rh-muted)] sm:text-xs">{subtitle}</p>
          </div>
        </div>
        {showViewAll ? (
          <Link
            href={viewAllHref}
            className="inline-flex h-7 shrink-0 items-center gap-1 border border-[var(--rh-border)] px-2.5 text-xs font-medium text-[var(--rh-muted)] transition hover:border-brand/30 hover:text-brand"
          >
            View all
            <ArrowRight className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
          </Link>
        ) : null}
      </div>

      {searchSlot ? (
        <div className="shrink-0 border-b border-[var(--rh-border)] px-3.5 py-2">{searchSlot}</div>
      ) : null}

      {operators.length === 0 ? (
        <p className="px-3.5 py-10 text-center text-xs text-[var(--rh-muted)]">
          {isFiltering ? "No operators match your search." : "No published listings yet."}
        </p>
      ) : (
        <div className="max-md:overflow-visible md:lb-scroll md:min-h-0 md:flex-1 md:overflow-y-auto md:overscroll-contain md:touch-pan-y">
          <div className="hidden grid-cols-[1.75rem_2.25rem_minmax(0,1fr)_4rem_3.5rem] gap-x-2.5 border-b border-[var(--rh-border)] px-3.5 py-2 font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-[var(--rh-muted)] sm:sticky sm:top-0 sm:z-10 sm:grid sm:bg-[var(--rh-surface-elevated)]">
            <span />
            <span />
            <span>Operator</span>
            <span className="text-right">Listings</span>
            <span className="text-right">Views</span>
          </div>
          <div>
            {displayed.map((row, i) => (
              <OperatorRow
                key={row.user.id}
                row={row}
                rank={i + 1}
                maxViews={maxViews}
                linkToProfile={linkToProfile}
              />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
