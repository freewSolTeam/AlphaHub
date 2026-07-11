import type { LucideIcon } from "lucide-react";
import { BarChart2, Flag, Settings, ShoppingBag, Star, Users } from "lucide-react";

export type ListingFilter = "ALL" | "PUBLIC" | "PRIVATE" | "PAID";
export const statusItems: Array<{ key: ListingFilter; label: string }> = [
  { key: "ALL", label: "All" },
  { key: "PUBLIC", label: "Public" },
  { key: "PRIVATE", label: "Private" },
  { key: "PAID", label: "Paid" },
];

export const activityTabKeys = ["listings", "purchases", "sales", "analytics", "reviews", "reports", "settings"] as const;
export type ActivityTab = (typeof activityTabKeys)[number];

export const listingsNav = {
  key: "listings" as const,
  label: "Listings",
  line: "Your Degen listings",
};

export const escrowActivityTabs: { key: Exclude<ActivityTab, "listings">; label: string; line: string }[] = [
  { key: "purchases", label: "Purchases", line: "Your on-chain purchases" },
  { key: "sales", label: "Sales", line: "Who bought your VIP calls" },
  { key: "analytics", label: "Analytics", line: "Views, sales, per-listing report" },
  { key: "reviews", label: "Reviews", line: "Feedback from buyers" },
  { key: "reports", label: "Flags", line: "Visitor abuse reports" },
  { key: "settings", label: "Settings", line: "Account, wallet, and X profile" },
];

export const escrowMenuIcon: Record<Exclude<ActivityTab, "listings">, LucideIcon> = {
  purchases: ShoppingBag,
  sales: Users,
  analytics: BarChart2,
  reviews: Star,
  reports: Flag,
  settings: Settings,
};

export function buildDashboardUrl(status: ListingFilter, activity: ActivityTab) {
  const p = new URLSearchParams();
  if (status !== "ALL") p.set("status", status);
  if (activity !== "listings") p.set("activity", activity);
  const q = p.toString();
  return q ? `/dashboard?${q}` : "/dashboard";
}

export function parseActivity(s: string | undefined): ActivityTab {
  if (s && (activityTabKeys as readonly string[]).includes(s)) {
    return s as ActivityTab;
  }
  return "listings";
}
