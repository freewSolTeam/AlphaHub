import { DocsCallout, DocsField, DocsSection } from "@/components/docs/docs-section";
import { DocsOnChainPanel } from "@/components/docs/docs-on-chain-panel";
import { DocsFlowPipeline } from "@/components/docs/docs-flow-pipeline";
import { DocsNavRail, DocsNavSidebar, type DocsNavGroup } from "@/components/docs/docs-nav";
import { RobinhoodChainMark } from "@/components/robinhood-chain-mark";
import { getPlatformFee } from "@/lib/escrow-config";
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BookOpen, CircleDollarSign, Layers, ShieldCheck, Zap } from "lucide-react";

export const metadata: Metadata = {
  title: "Documentation",
  description:
    "The AlphaHub playbook — launch Degens on Robinhood Chain, get paid in USDG or ETH, and deliver members without the manual chaos.",
};

const NAV_GROUPS: DocsNavGroup[] = [
  {
    title: "Platform",
    items: [
      { id: "overview", label: "What is AlphaHub", num: "01" },
      { id: "about", label: "Why we built it", num: "02" },
      { id: "system-flow", label: "End-to-end flow", num: "03" },
    ],
  },
  {
    title: "Operators",
    items: [
      { id: "operator-setup", label: "Go live", num: "04" },
      { id: "field-guide", label: "Listing playbook", num: "05" },
      { id: "monetization", label: "Earn with tiers", num: "06" },
      { id: "publish-checklist", label: "Before publish", num: "07" },
    ],
  },
  {
    title: "Buyers & billing",
    items: [
      { id: "buyer-steps", label: "Join a Degen", num: "08" },
      { id: "fees", label: "Pricing", num: "09" },
      { id: "on-chain", label: "Contracts & checkout", num: "10" },
    ],
  },
];

const FLOW_STEPS = [
  { title: "List", desc: "Operator ships a Degen with tiers, pricing, and invite links." },
  { title: "Find", desc: "Buyers discover it in Explore or land on a direct link." },
  { title: "Pay", desc: "Buyer pays the listed price via the AlphaHub contract in USDG or ETH." },
  { title: "Verify", desc: "AlphaHub confirms the on-chain PaymentSettled event." },
  { title: "Enter", desc: "Telegram or Discord invites unlock in the buyer dashboard." },
  { title: "Measure", desc: "Sales, purchases, and reviews live in both dashboards." },
] as const;

const PILLARS = [
  {
    icon: ShieldCheck,
    title: "No guesswork",
    desc: "Every purchase has an on-chain receipt and a clear status in Dashboard.",
  },
  {
    icon: Layers,
    title: "Built for tiers",
    desc: "Run free teasers and paid VIP lanes from one listing — no duct tape.",
  },
  {
    icon: Zap,
    title: "Instant handoff",
    desc: "Paid members get invite links the moment payment confirms.",
  },
] as const;

const CHECKLIST = [
  "Payout wallet connected and saved on Robinhood Chain.",
  "Title and pitch tell buyers exactly what they're buying.",
  "Tier prices and durations match how you actually deliver.",
  "Telegram / Discord invites tested — they work right now.",
  "Rules and onboarding copy are short and unambiguous.",
  "Directory publish turned on if you want Explore traffic.",
] as const;

export default function DocsPage() {
  const platformFee = getPlatformFee();

  return (
    <div className="app-main-container docs-page min-w-0 py-6 sm:py-8">
      <header className="docs-hero page-hero relative mb-6 overflow-hidden sm:mb-8">
        <div className="docs-hero-texture pointer-events-none absolute inset-0" aria-hidden />
        <div className="page-hero-glow pointer-events-none absolute inset-0" aria-hidden />
        <div className="relative">
          <div className="flex flex-wrap items-center gap-3">
            <RobinhoodChainMark className="h-5 w-5 text-brand" />
            <p className="ui-page-eyebrow">AlphaHub playbook</p>
            <span className="docs-hero-badge">Robinhood Chain · USDG or ETH</span>
          </div>

          <h1 className="mt-4 max-w-3xl text-2xl font-semibold tracking-tight text-[var(--rh-foreground)] sm:text-3xl lg:text-4xl">
            Publish Degens. Get paid. Ship access — without the spreadsheet life.
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[var(--rh-muted)] sm:text-base">
            This is the operating manual for AlphaHub: how listings work, how buyers join, how payments move on-chain, and what to
            check before you flip a Degen live.
          </p>

          <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            <Link href="#operator-setup" className="btn-rh-primary inline-flex w-full items-center justify-center gap-2 sm:w-auto">
              <BookOpen className="h-3.5 w-3.5" aria-hidden />
              I&apos;m an operator
            </Link>
            <Link href="#buyer-steps" className="btn-rh-secondary inline-flex w-full items-center justify-center gap-2 sm:w-auto">
              I&apos;m a buyer
              <ArrowRight className="h-3.5 w-3.5" aria-hidden />
            </Link>
          </div>

          <div className="docs-hero-strip mt-6 grid grid-cols-2 gap-px border border-[var(--rh-border)] bg-[var(--rh-border)] sm:mt-8 sm:grid-cols-4">
            {[
              { k: "Listings", v: "$0", hint: "Always free to publish" },
              { k: "Currency", v: "USDG / ETH", hint: "You pick per listing" },
              { k: "Access", v: "Auto", hint: "Links unlock on confirm" },
              { k: "Fee", v: `${platformFee}`, hint: "USDG per successful sale" },
            ].map((row) => (
              <div key={row.k} className="docs-hero-strip-cell bg-[var(--rh-black)] px-4 py-3">
                <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--rh-subtle)]">{row.k}</p>
                <p className="mt-1 text-xl font-semibold tabular-nums text-[var(--rh-foreground)]">{row.v}</p>
                <p className="mt-0.5 text-[11px] text-[var(--rh-muted)]">{row.hint}</p>
              </div>
            ))}
          </div>
        </div>
      </header>

      <DocsNavRail groups={NAV_GROUPS} />

      <div className="docs-page-split">
        <aside className="docs-sidebar hidden min-w-0 lg:block">
          <DocsNavSidebar groups={NAV_GROUPS} />
          <div className="card-rh mt-px p-4">
            <p className="hyre-label mb-3">Jump in</p>
            <div className="flex flex-col gap-2">
              <Link href="/login" className="btn-rh-primary w-full text-center">
                Start a Degen
              </Link>
              <Link href="/explore" className="btn-rh-secondary w-full text-center">
                See live listings
              </Link>
            </div>
          </div>
        </aside>

        <div className="docs-content min-w-0 space-y-4 sm:space-y-5">
          <DocsSection
            id="overview"
            num="01"
            title="What is AlphaHub"
            subtitle="A Degen marketplace on Robinhood Chain — list alpha rooms, choose USDG or ETH checkout, deliver members automatically."
          >
            <p className="text-sm leading-relaxed text-[var(--rh-muted)] sm:text-[15px]">
              Operators run Telegram or Discord Degens with structured listings. Buyers browse, pay from wallet, and
              land in the right tier without DMing you for a payment screenshot. Public or private, free or paid — you
              set the lanes; AlphaHub runs the checkout and access handoff.
            </p>
            <div className="mt-5 grid gap-px border border-[var(--rh-border)] bg-[var(--rh-border)] sm:grid-cols-3">
              {[
                { label: "Ship the offer", body: "One listing, multiple tiers, real invite links." },
                { label: "Pull buyers", body: "Explore discovery or your own share link." },
                { label: "Get paid", body: "USDG or ETH — you choose the currency per listing." },
              ].map((card) => (
                <div key={card.label} className="docs-tile bg-[var(--rh-surface)] p-4">
                  <span className="signal-dot mb-3 inline-block h-2 w-2 rounded-full bg-brand" aria-hidden />
                  <p className="text-sm font-medium text-[var(--rh-foreground)]">{card.label}</p>
                  <p className="mt-1.5 text-xs leading-relaxed text-[var(--rh-muted)]">{card.body}</p>
                </div>
              ))}
            </div>
          </DocsSection>

          <DocsSection
            id="about"
            num="02"
            title="Why we built it"
            subtitle="Degens deserve storefronts, not scattered payment links and honor-system invites."
          >
            <p className="text-sm leading-relaxed text-[var(--rh-muted)] sm:text-[15px]">
              Most alpha groups still sell access through manual DMs, screenshots, and spreadsheets. AlphaHub wraps that
              into a repeatable storefront: listing pages, verified smart-contract checkout on Robinhood Chain, and
              dashboard tooling so operators can scale without chasing every payment.
            </p>

            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              {PILLARS.map(({ icon: Icon, title, desc }) => (
                <div key={title} className="docs-pillar border border-[var(--rh-border)] bg-[var(--rh-black)]/50 p-4">
                  <Icon className="h-4 w-4 text-brand" aria-hidden />
                  <p className="mt-3 text-sm font-medium text-[var(--rh-foreground)]">{title}</p>
                  <p className="mt-1.5 text-xs leading-relaxed text-[var(--rh-muted)]">{desc}</p>
                </div>
              ))}
            </div>
          </DocsSection>

          <DocsSection
            id="system-flow"
            num="03"
            title="End-to-end flow"
            subtitle="From first publish to a member sitting in your Telegram — six beats, no detours."
          >
            <DocsFlowPipeline steps={[...FLOW_STEPS]} />
          </DocsSection>

          <DocsSection
            id="operator-setup"
            num="04"
            title="Go live"
            subtitle="Wallet in, listing out. Roughly seven minutes if your copy is ready."
          >
            <ol className="docs-step-list">
              <li>Sign in with a Robinhood Chain wallet.</li>
              <li>Link X from Dashboard — verified badge helps conversion.</li>
              <li>Connect the wallet that should receive USDG or ETH payouts.</li>
              <li>Head to <DocsField>Dashboard → New listing</DocsField>.</li>
              <li>Drop in your pitch, tiers, prices, and invite links.</li>
              <li>Flip on <DocsField>Publish in directory</DocsField> if you want Explore traffic.</li>
              <li>Save, then sanity-check the card and detail page like a buyer would.</li>
            </ol>
            <DocsCallout title="Operator tip">
              Write your pitch like a tweet, not a whitepaper. Buyers decide in seconds — give them the outcome, the
              cadence, and the price lane in one glance.
            </DocsCallout>
          </DocsSection>

          <DocsSection
            id="field-guide"
            num="05"
            title="Listing playbook"
            subtitle="The fields that move conversion — and the ones that kill trust when left blank."
          >
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="doc-subcard card-rh p-5">
                <p className="text-sm font-semibold text-[var(--rh-foreground)]">Face of the listing</p>
                <ul className="docs-bullet-list mt-4">
                  <li>
                    <DocsField>Name</DocsField> — specific beats clever. Say what the room is.
                  </li>
                  <li>
                    <DocsField>Pitch</DocsField> — one line: who it&apos;s for, what they get, how often.
                  </li>
                  <li>
                    <DocsField>Description</DocsField> — the real detail: strategy, rules, expectations.
                  </li>
                  <li>Logo + cover — listings with visuals convert; blank cards look abandoned.</li>
                </ul>
              </div>
              <div className="doc-subcard card-rh p-5">
                <p className="text-sm font-semibold text-[var(--rh-foreground)]">Access & delivery</p>
                <ul className="docs-bullet-list mt-4">
                  <li>
                    <DocsField>Call type</DocsField> — public (discoverable) or private (link-only).
                  </li>
                  <li>
                    <DocsField>Access</DocsField> — free entry point, paid VIP, or both.
                  </li>
                  <li>
                    <DocsField>Price / tier</DocsField> — amount in your chosen currency (USDG or ETH).
                  </li>
                  <li>Invite URLs — must work today; dead links are the fastest way to get reported.</li>
                </ul>
              </div>
            </div>
          </DocsSection>

          <DocsSection
            id="monetization"
            num="06"
            title="Earn with tiers"
            subtitle="Free builds the funnel. Paid VIP captures the people who were going to pay anyway."
          >
            <p className="text-sm leading-relaxed text-[var(--rh-muted)] sm:text-[15px]">
              Run a <span className="font-medium text-[var(--rh-foreground)]">free or public lane</span> so strangers
              can taste the room. Move serious members into{" "}
              <span className="font-medium text-[var(--rh-foreground)]">paid tiers</span> with tighter signals, faster
              updates, or a private channel. Name the deliverable, the frequency, and the window — vague tiers get
              refunded in spirit if not in code.
            </p>

            <div className="docs-table-wrap mt-5">
              <table className="docs-tier-table w-full min-w-[18rem] border-collapse text-left">
                <thead>
                  <tr>
                    <th>Tier</th>
                    <th>What buyers get</th>
                    <th>Example</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { tier: "Entry", offer: "Light signals, slower cadence", price: "5 USDG / week" },
                    { tier: "Pro", offer: "Deeper breakdowns, faster updates", price: "15 USDG / month" },
                    { tier: "Inner", offer: "Private room, direct operator access", price: "40 USDG / month" },
                  ].map((row) => (
                    <tr key={row.tier}>
                      <td className="font-medium text-[var(--rh-foreground)]">{row.tier}</td>
                      <td>{row.offer}</td>
                      <td className="font-mono text-[11px] text-brand">{row.price}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </DocsSection>

          <DocsSection
            id="publish-checklist"
            num="07"
            title="Before publish"
            subtitle="Thirty-second audit so you don't ship a broken funnel."
          >
            <ul className="docs-checklist">
              {CHECKLIST.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </DocsSection>

          <DocsSection
            id="buyer-steps"
            num="08"
            title="Join a Degen"
            subtitle="From wallet connect to sitting in the Telegram — no middleman DMs."
          >
            <ol className="docs-step-list">
              <li>Sign in and connect a Robinhood Chain wallet with enough USDG or ETH.</li>
              <li>Read the listing — pitch, rules, tier table, all of it.</li>
              <li>Pick your lane and hit <DocsField>Join</DocsField>.</li>
              <li>Choose <DocsField>USDG</DocsField> or <DocsField>ETH</DocsField> at checkout if the listing supports both.</li>
              <li>Approve the transfer in your wallet — payment goes through the AlphaHub contract.</li>
              <li>Wait for on-chain confirmation in the app.</li>
              <li>Open <DocsField>Dashboard → Purchases</DocsField> and use the unlocked invite.</li>
            </ol>
          </DocsSection>

          <DocsSection
            id="fees"
            num="09"
            title="Pricing"
            subtitle="List for free. Pay the platform only when money actually moves."
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="docs-fee-card docs-fee-card--highlight p-5">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-brand" aria-hidden />
                  <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-brand">
                    Listing
                  </p>
                </div>
                <p className="mt-3 text-2xl font-semibold text-[var(--rh-foreground)]">Free</p>
                <p className="mt-2 text-sm leading-relaxed text-[var(--rh-muted)]">
                  Publish as many Degens as you want. No setup invoice, no monthly rent.
                </p>
              </div>
              <div className="docs-fee-card p-5">
                <div className="flex items-center gap-2">
                  <CircleDollarSign className="h-4 w-4 text-[var(--rh-muted)]" aria-hidden />
                  <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--rh-muted)]">
                    Platform
                  </p>
                </div>
                <p className="mt-3 text-2xl font-semibold text-[var(--rh-foreground)]">{platformFee} USDG</p>
                <p className="mt-2 text-sm leading-relaxed text-[var(--rh-muted)]">
                  Per successful sale, deducted from the operator&apos;s share inside the AlphaHub contract — not added on
                  top of what the buyer pays. ETH checkouts use the equivalent ETH fee at the live USDG/ETH rate.
                </p>
              </div>
            </div>
          </DocsSection>

          <DocsSection
            id="on-chain"
            num="10"
            title="Contracts & checkout"
            subtitle="Token CA and the verified AlphaHub smart contract — two different addresses, one checkout flow."
          >
            <p className="text-sm leading-relaxed text-[var(--rh-muted)] sm:text-[15px]">
              <DocsField>CA</DocsField> on the homepage is the AlphaHub <span className="font-medium text-[var(--rh-foreground)]">token</span> contract — announced when live. Paid listings use the separate{" "}
              <DocsField>AlphaHub</DocsField> checkout contract below; buyers never send funds directly to an operator wallet.
            </p>
            <div className="mt-5">
              <DocsOnChainPanel />
            </div>
            <DocsCallout title="Cross-currency checkout">
              Listings can be priced in USDG or ETH. At checkout the buyer can pay in either currency — AlphaHub converts
              using the configured USDG/ETH rate. The operator still receives payout in the payment currency chosen by the buyer.
            </DocsCallout>
          </DocsSection>

          <section id="help" className="docs-help-banner scroll-mt-28 card-rh p-4 sm:scroll-mt-24 sm:p-6">
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-brand">Still stuck?</p>
            <h2 className="mt-2 text-lg font-semibold text-[var(--rh-foreground)]">Browse live Degens or open your dashboard.</h2>
            <p className="mt-2 max-w-xl text-sm text-[var(--rh-muted)]">
              The fastest way to learn AlphaHub is to click through a real listing, then mirror it with your own.
            </p>
            <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
              <Link href="/explore" className="btn-rh-secondary w-full text-center sm:w-auto">
                Explore directory
              </Link>
              <Link href="/dashboard" className="btn-rh-primary w-full text-center sm:w-auto">
                Operator dashboard
              </Link>
              <a href="https://t.me/alphahub_co" target="_blank" rel="noreferrer" className="btn-rh-ghost">
                Telegram
              </a>
              <a href="https://x.com/alphahub_co" target="_blank" rel="noreferrer" className="btn-rh-ghost">
                X
              </a>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
