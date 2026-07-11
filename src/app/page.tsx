import { auth } from "@/auth";
import { CommunityListingCard } from "@/components/community-listing-card";
import { LandingFeatureBento } from "@/components/landing/feature-bento";
import { LandingMetrics } from "@/components/landing/metrics-strip";
import { LandingProtocolFlow } from "@/components/landing/protocol-flow";
import { LandingSocialProof } from "@/components/landing/social-proof";
import { LandingHeroAnimation } from "@/components/landing/hero-animation";
import { LandingOnChainSection } from "@/components/landing/landing-on-chain-section";
import { RobinhoodBrandLockup } from "@/components/robinhood-brand-lockup";
import { TrustedByMarquee } from "@/components/trusted-by-marquee";
import { prisma } from "@/lib/prisma";
import { getTokenContractDisplay } from "@/lib/token-contract";
import {
  applyVipMaskToProject,
  fetchEscrowUnlockedProjectIds,
  resolveVipViewForProject,
} from "@/lib/viewer-listing-access";
import { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";

export const metadata: Metadata = {
  title: "AlphaHub — Degen commerce on Robinhood Chain",
  description:
    "Discover and monetize alpha Degens on Robinhood Chain. Directory, USDG checkout, multi-tier access, and instant delivery for operators.",
};

export default async function Home() {
  const [rawItems, listingCount, operatorCount, viewAgg] = await Promise.all([
    prisma.project.findMany({
      where: { published: true },
      take: 8,
      orderBy: [{ viewCount: "desc" }, { createdAt: "desc" }],
      include: {
        user: {
          select: {
            name: true,
            image: true,
            wallet: true,
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
    }),
    prisma.project.count({ where: { published: true } }),
    prisma.user.count({ where: { projects: { some: { published: true } } } }),
    prisma.project.aggregate({ where: { published: true }, _sum: { viewCount: true } }),
  ]);

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
  }) as (typeof rawItems)[number][];

  const totalViews = viewAgg._sum.viewCount ?? 0;

  const metrics = [
    { value: String(listingCount), label: "Live listings", hint: "published Degens" },
    { value: String(operatorCount), label: "Operators", hint: "active hosts" },
    {
      value: totalViews >= 1000 ? `${(totalViews / 1000).toFixed(1)}K` : String(totalViews),
      label: "Directory views",
      hint: "aggregate opens",
    },
    { value: "USDG", label: "Settlement", hint: "native pricing" },
  ];

  return (
    <div className="landing-page">
      <section className="landing-hero relative overflow-hidden">
        <div className="landing-hero-atmosphere pointer-events-none absolute inset-0" aria-hidden />
        <div className="landing-hero-texture pointer-events-none absolute inset-0" aria-hidden />
        <div className="landing-wrap relative">
          <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_1fr] lg:gap-10 xl:gap-16">
            <div className="text-center lg:text-left">
              <div className="landing-fade-up inline-flex items-center gap-2 border border-[var(--landing-border)] bg-[var(--landing-surface)] px-3 py-1.5">
                <span className="landing-live-dot inline-flex h-1.5 w-1.5 rounded-full bg-brand">
                  <span className="h-full w-full rounded-full bg-brand" />
                </span>
                <span className="hyre-label !tracking-[0.16em]">Degen commerce · Robinhood Chain</span>
              </div>

              <h1 className="hyre-hero-headline landing-fade-up mt-7">
                The marketplace for
                <br />
                <span className="landing-text-gradient">alpha Degens.</span>
              </h1>

              <p className="hyre-hero-body landing-fade-up mx-auto mt-6 max-w-xl lg:mx-0">
                Discover VIP Telegram and Discord groups, pay in USDG on-chain, and launch your own listing with instant
                access delivery — all on Robinhood Chain.
              </p>

              <div className="landing-fade-up mt-9 flex flex-wrap items-center justify-center gap-2 sm:gap-3 lg:justify-start">
                <Link href="/explore" className="hyre-cta-main">
                  Explore directory <ArrowRight className="h-3.5 w-3.5" />
                </Link>
                <Link href="/login" className="hyre-cta-ghost">
                  Launch listing
                </Link>
              </div>

              <div className="landing-fade-up mt-10 flex flex-col items-center gap-4 border-t border-[var(--landing-border)] pt-7 lg:items-start">
                <div className="flex flex-col items-center gap-3 sm:flex-row sm:gap-4 lg:items-center">
                  <span className="hyre-label">Built on</span>
                  <a
                    href="https://robinhood.com"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 transition hover:opacity-90"
                  >
                    <RobinhoodBrandLockup />
                    <ArrowUpRight className="h-3.5 w-3.5 opacity-40" />
                  </a>
                </div>
                <div className="flex flex-col items-center gap-3 sm:flex-row sm:gap-4 lg:items-center">
                  <span className="hyre-label">CA</span>
                  <span
                    className="inline-flex items-center rounded border border-[var(--landing-border)] bg-[var(--landing-surface)] px-3 py-1.5 font-mono text-xs text-[var(--landing-muted)]"
                    title="AlphaHub token contract — coming soon"
                  >
                    {getTokenContractDisplay()}
                  </span>
                </div>
              </div>
            </div>

            <div className="landing-fade-up relative mx-auto w-full max-w-xl lg:max-w-none">
              <div className="landing-hero-visual-glow pointer-events-none absolute -inset-10" aria-hidden />
              <LandingHeroAnimation />
            </div>
          </div>
        </div>
      </section>

      <LandingMetrics metrics={metrics} />

      <LandingOnChainSection />

      <TrustedByMarquee />

      <section className="landing-section border-t border-[var(--landing-border)]">
        <div className="landing-wrap">
          <p className="hyre-label">How it works</p>
          <h2 className="hyre-section-title mt-3 max-w-2xl">From listing to paid access in three steps.</h2>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-[var(--landing-muted)]">
            AlphaHub connects discovery, checkout, and delivery so operators monetize Telegram and Discord without
            chasing payments.
          </p>
          <LandingProtocolFlow />
        </div>
      </section>

      <section className="landing-section border-t border-[var(--landing-border)]">
        <div className="landing-wrap">
          <p className="hyre-label">Platform</p>
          <h2 className="hyre-section-title mt-3 max-w-2xl">Everything operators need to transact.</h2>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-[var(--landing-muted)]">
            Directory, smart-contract checkout, multi-tier pricing, rankings, and rewards — one stack for Degen commerce
            on Robinhood Chain.
          </p>
          <LandingFeatureBento />
        </div>
      </section>

      <LandingSocialProof />

      {items.length > 0 ? (
        <section className="landing-section border-t border-[var(--landing-border)]">
          <div className="landing-wrap">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="hyre-label">Live directory</p>
                <h2 className="hyre-section-title mt-3">Trending Degens</h2>
              </div>
              <Link href="/explore" className="hyre-cta-ghost w-fit">
                View all <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            <div className="explore-tile-grid mt-10">
              {items.map((p) => (
                <CommunityListingCard key={p.id} project={p} showOperatorHandle compact />
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <section className="landing-section border-t border-[var(--landing-border)]">
        <div className="landing-wrap text-center">
          <h2 className="hyre-cta-title">
            Launch your Degen.
            <br />
            <span className="text-[var(--landing-muted)]">Get paid on Robinhood Chain.</span>
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-sm text-[var(--landing-muted)]">
            One listing — wallet checkout in USDG, multi-tier access, and instant invite delivery. Powered by AlphaHub.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            <Link href="/login" className="hyre-cta-main">
              Create listing <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/explore" className="hyre-cta-ghost">
              Browse directory
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
