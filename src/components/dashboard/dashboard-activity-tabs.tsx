import {
  buildDashboardUrl,
  escrowActivityTabs,
  escrowMenuIcon,
  listingsNav,
  type ActivityTab,
  type ListingFilter,
} from "@/lib/dashboard-nav";
import { LayoutGrid } from "lucide-react";
import Link from "next/link";

type Props = {
  status: ListingFilter;
  activity: ActivityTab;
};

export function DashboardActivityTabs({ status, activity }: Props) {
  const tabs = [
    { key: listingsNav.key, label: listingsNav.label, icon: LayoutGrid },
    ...escrowActivityTabs.map((t) => ({ key: t.key, label: t.label, icon: escrowMenuIcon[t.key] })),
  ] as const;

  return (
    <nav
      className="lb-scroll -mx-1 flex gap-1 overflow-x-auto border-b border-[var(--rh-border)] px-1 pb-px"
      aria-label="Dashboard sections"
    >
      {tabs.map((tab) => {
        const active = activity === tab.key;
        const Icon = tab.icon;
        return (
          <Link
            key={tab.key}
            href={buildDashboardUrl(status, tab.key)}
            aria-current={active ? "page" : undefined}
            className={`dash-tab shrink-0 ${active ? "dash-tab--active" : ""}`}
          >
            <Icon className="h-3.5 w-3.5 shrink-0" strokeWidth={active ? 2.25 : 1.75} aria-hidden />
            <span>{tab.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
