"use client";

import { SiteLogo } from "@/components/site-logo";
import Link from "next/link";
import { useSession } from "next-auth/react";

export function SiteFooter() {
  const { data: session } = useSession();
  const year = 2026;

  return (
    <footer className="mt-auto border-t border-[var(--rh-border)] bg-[var(--rh-surface)]/40">
      <div className="app-container py-6 sm:py-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
            <SiteLogo size="sm" linked={false} />
            <Link href="/explore" className="hyre-footer-link">
              Directory
            </Link>
            <Link href="/leaderboard" className="hyre-footer-link">
              Rankings
            </Link>
            <Link href="/docs" className="hyre-footer-link">
              Docs
            </Link>
            {session?.user ? (
              <Link href="/dashboard" className="hyre-footer-link">
                Dashboard
              </Link>
            ) : (
              <Link href="/login" className="hyre-footer-link">
                Log in
              </Link>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <span className="hyre-footer-tag">Robinhood Chain</span>
            <span className="hyre-footer-tag">© {year}</span>
          </div>
        </div>
        <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.08em] text-[var(--rh-subtle)]">
          User-submitted listings only. Not financial advice. Always do your own research.
        </p>
      </div>
    </footer>
  );
}
