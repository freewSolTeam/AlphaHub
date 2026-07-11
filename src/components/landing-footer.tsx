"use client";

import Link from "next/link";
import { RobinhoodBrandLockup } from "@/components/robinhood-brand-lockup";

export function LandingFooter() {
  return (
    <footer className="landing-footer border-t border-[var(--landing-border)] py-12">
      <div className="landing-wrap">
        <div className="flex flex-col items-center gap-8 text-center sm:flex-row sm:items-start sm:justify-between sm:text-left">
          <div>
            <p className="hyre-footer-tag">ALPHAHUB · Degen commerce on Robinhood Chain</p>
            <div className="mt-4 flex justify-center sm:justify-start">
              <RobinhoodBrandLockup compact href="https://robinhood.com" />
            </div>
          </div>
          <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 sm:justify-end">
            <Link href="/explore" className="hyre-footer-link">
              Directory
            </Link>
            <Link href="/dashboard" className="hyre-footer-link">
              Dashboard
            </Link>
            <Link href="/docs" className="hyre-footer-link">
              Docs
            </Link>
            <a href="https://x.com/alphahub_market" target="_blank" rel="noreferrer" className="hyre-footer-link">
              X
            </a>
          </nav>
        </div>
        <p className="mt-10 text-center text-[11px] text-[var(--landing-muted)] sm:text-left">
          © {2026} AlphaHub. Robinhood® is a trademark of Robinhood Markets, Inc. AlphaHub is an independent product
          built on Robinhood Chain.
        </p>
      </div>
    </footer>
  );
}
