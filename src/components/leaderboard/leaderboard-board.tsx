import { LeaderboardRankingsView } from "@/components/leaderboard/leaderboard-rankings-view";
import type { LeaderboardOperator } from "@/lib/leaderboard-operators";
import { LayoutGrid, Sparkles, Users } from "lucide-react";

export type LeaderboardListing = {
  id: string;
  slug: string;
  title: string;
  viewCount: number;
  communityImage: string | null;
  user: {
    id: string;
    name: string | null;
    image: string | null;
    xHandle: string | null;
    blueCheckmark: boolean;
    accounts: { providerAccountId: string }[];
  };
};

export const OPERATORS_PREVIEW_COUNT = 12;

type Props = {
  listings: LeaderboardListing[];
  operators: LeaderboardOperator[];
  operatorsPreviewLimit?: number;
  listingsPreviewLimit?: number;
  registeredUserCount?: number;
  allUsersCount?: number;
};

function formatViews(n: number) {
  return n.toLocaleString("en-US");
}

export function LeaderboardBoard({
  listings,
  operators,
  operatorsPreviewLimit = OPERATORS_PREVIEW_COUNT,
  listingsPreviewLimit = 15,
  registeredUserCount,
  allUsersCount,
}: Props) {
  const totalViews = operators.reduce((a, o) => a + o.totalViews, 0);
  const userTotal = allUsersCount ?? registeredUserCount ?? operators.length;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-px border border-[var(--rh-border)] bg-[var(--rh-border)]">
        {[
          { label: "Users", value: userTotal, icon: Users },
          { label: "Listings", value: listings.length, icon: LayoutGrid },
          { label: "Views", value: formatViews(totalViews), icon: Sparkles },
        ].map(({ label, value, icon: Icon }) => (
          <div key={label} className="app-stat-cell">
            <div className="flex items-center gap-1.5 text-[var(--rh-muted)]">
              <Icon className="h-3.5 w-3.5 shrink-0" strokeWidth={1.75} aria-hidden />
              <span className="app-stat-label mt-0">{label}</span>
            </div>
            <p className="app-stat-value mt-1 text-xl sm:text-2xl">{value}</p>
          </div>
        ))}
      </div>

      <LeaderboardRankingsView
        listings={listings}
        operators={operators}
        operatorsPreviewLimit={operatorsPreviewLimit}
        listingsPreviewLimit={listingsPreviewLimit}
        allUsersCount={userTotal}
      />
    </div>
  );
}
