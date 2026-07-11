import { LeaderboardBoard, OPERATORS_PREVIEW_COUNT } from "@/components/leaderboard/leaderboard-board";
import {
  fetchAllLeaderboardOperators,
  fetchRegisteredUserCount,
} from "@/lib/leaderboard-operators";
import { prisma } from "@/lib/prisma";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Leaderboard",
  description: "Top Degens and operators on AlphaHub - Robinhood Chain.",
};

const LISTING_LIMIT = 50;

export default async function LeaderBoardPage() {
  const [topListings, allUsers, registeredCount] = await Promise.all([
    prisma.project.findMany({
      where: { published: true },
      orderBy: [{ viewCount: "desc" }, { createdAt: "desc" }],
      take: LISTING_LIMIT,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
            xHandle: true,
            blueCheckmark: true,
            accounts: {
              where: { provider: "twitter" },
              take: 1,
              select: { providerAccountId: true },
            },
          },
        },
      },
    }),
    fetchAllLeaderboardOperators(),
    fetchRegisteredUserCount(),
  ]);

  return (
    <div className="app-main-container py-6 sm:py-8">
      <header className="page-hero relative mb-8">
        <div className="page-hero-glow page-hero-glow--left pointer-events-none absolute inset-0" aria-hidden />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="ui-page-eyebrow">Rankings</p>
            <h1 className="mt-3 text-2xl font-semibold tracking-tight text-[var(--rh-foreground)] sm:text-3xl">
              Who&apos;s leading
            </h1>
            <p className="mt-2 max-w-lg text-sm text-[var(--rh-muted)]">
              Live view counts and operator standings across the Robinhood Chain directory.
            </p>
          </div>
          <div className="flex gap-px border border-[var(--rh-border)] bg-[var(--rh-border)]">
            <div className="app-stat-cell text-center">
              <p className="app-stat-value text-brand">{topListings.length}</p>
              <p className="app-stat-label">Listings</p>
            </div>
            <div className="app-stat-cell text-center">
              <p className="app-stat-value text-brand">{allUsers.length}</p>
              <p className="app-stat-label">Operators</p>
            </div>
            <div className="app-stat-cell text-center">
              <p className="app-stat-value text-brand">{registeredCount}</p>
              <p className="app-stat-label">Users</p>
            </div>
          </div>
        </div>
      </header>

      <LeaderboardBoard
        listings={topListings}
        operators={allUsers}
        operatorsPreviewLimit={OPERATORS_PREVIEW_COUNT}
        registeredUserCount={registeredCount}
        allUsersCount={allUsers.length}
      />
    </div>
  );
}
