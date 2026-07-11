import { NewProjectSplit } from "@/components/dashboard/new-project-split";
import { RobinhoodChainMark } from "@/components/robinhood-chain-mark";
import { auth } from "@/auth";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Metadata } from "next";
import { ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "New call listing - AlphaHub",
};

export default async function NewProjectPage() {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/dashboard/new");
  if (!session.user.wallet) redirect("/dashboard?connectWallet=1");

  return (
    <div className="app-main-container py-6 sm:py-8">
      <header className="page-hero relative mb-6 overflow-hidden">
        <div className="page-hero-glow pointer-events-none absolute inset-0" aria-hidden />
        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--rh-muted)] transition hover:text-brand"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to dashboard
            </Link>
            <div className="mt-4 flex items-center gap-2">
              <RobinhoodChainMark className="h-4 w-4 shrink-0 text-brand" />
              <p className="ui-page-eyebrow">New listing</p>
            </div>
            <h1 className="mt-3 text-2xl font-semibold tracking-tight text-[var(--rh-foreground)] sm:text-3xl lg:text-4xl">
              Create a call
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-[var(--rh-muted)] sm:text-[15px]">
              Set up your Degen listing — details on the left, live preview on the right.
            </p>
          </div>
          <div className="flex shrink-0 gap-px border border-[var(--rh-border)] bg-[var(--rh-border)]">
            <div className="app-stat-cell min-w-[120px] text-center">
              <p className="app-stat-value text-brand">3</p>
              <p className="app-stat-label">Steps</p>
            </div>
            <div className="app-stat-cell min-w-[120px] text-center">
              <p className="app-stat-value">Live</p>
              <p className="app-stat-label">Preview</p>
            </div>
          </div>
        </div>
      </header>
      <NewProjectSplit
        creatorName={session.user.name ?? null}
        creatorImage={session.user.image ?? null}
        wallet={session.user.wallet ?? null}
        payoutWallet={session.user.payoutWallet ?? null}
      />
    </div>
  );
}
