import Link from "next/link";

const FEATURES = [
  {
    code: "01",
    title: "Discover Degens",
    body: "Browse verified public and VIP alpha Degens in one directory. Filter by platform, access type, and price in USDG.",
    href: "/explore",
    badge: null as string | null,
  },
  {
    code: "02",
    title: "On-chain checkout",
    body: "VIP access settles through smart contracts on Robinhood Chain. Buyers pay from wallet — operators receive funds automatically.",
    href: "/docs#money-flow",
    badge: null,
  },
  {
    code: "03",
    title: "Launch in minutes",
    body: "Publish your Telegram or Discord Degen with public and paid tiers, invite links, and live listing controls.",
    href: "/login",
    badge: null,
  },
  {
    code: "04",
    title: "Multi-tier access",
    body: "Run free and VIP side by side. Independent pricing, duration, and delivery links per tier — one listing, full control.",
    href: "/docs#monetization",
    badge: null,
  },
  {
    code: "05",
    title: "Operator rankings",
    body: "Track top Degens by engagement and sales. Transparent leaderboards for hosts building real audiences.",
    href: "/leaderboard",
    badge: null,
  },
  {
    code: "06",
    title: "Instant delivery",
    body: "Invite links unlock the moment payment confirms on-chain. No manual approvals, no waiting — buyers get access instantly.",
    href: "/docs#money-flow",
    badge: null,
  },
] as const;

export function LandingFeatureBento() {
  return (
    <div className="hyre-bento-grid mt-12 grid gap-px border border-[var(--landing-border)] bg-[var(--landing-border)] sm:grid-cols-2 lg:grid-cols-3">
      {FEATURES.map((f) => (
        <Link key={f.code} href={f.href} className="hyre-bento-cell group">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--landing-accent)]">{f.code}</p>
              <p className="mt-2 text-base font-semibold tracking-tight text-[var(--landing-text)]">{f.title}</p>
            </div>
            {f.badge ? <span className="hyre-badge">{f.badge}</span> : null}
          </div>
          <p className="hyre-bento-body">{f.body}</p>
        </Link>
      ))}
    </div>
  );
}
