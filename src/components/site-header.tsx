"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { SiteLogo } from "@/components/site-logo";
import { HeaderWalletConnect } from "@/components/wallet/header-wallet-connect";
import { SignInOut } from "./sign-in-out";

const NAV = [
  { href: "/explore", label: "Directory", match: (p: string) => p === "/explore" || p.startsWith("/explore/") },
  { href: "/leaderboard", label: "Rankings", match: (p: string) => p === "/leaderboard" || p.startsWith("/leaderboard/") },
  {
    href: "/dashboard",
    label: "Dashboard",
    match: (p: string) => p === "/dashboard" || p.startsWith("/dashboard/"),
    requiresAuth: true,
  },
  { href: "/docs", label: "Docs", match: (p: string) => p === "/docs" || p.startsWith("/docs/") },
];

export function SiteHeader() {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const user = session?.user;
  const isAuthenticated = status === "authenticated";

  return (
    <header
      className="sticky top-0 z-30 border-b border-brand/10 backdrop-blur-xl"
      style={{ background: "var(--site-header-bg)" }}
    >
      <div className="app-main-container flex h-14 items-center justify-between gap-4 sm:h-[3.75rem]">
        <SiteLogo />

        <nav className="hidden items-center gap-5 lg:flex" aria-label="Main">
          {NAV.map((item) => {
            const active = item.match(pathname);
            const locked = item.requiresAuth && !isAuthenticated;
            const href = locked ? "/login?callbackUrl=/dashboard" : item.href;
            return (
              <Link
                key={item.href}
                href={href}
                aria-current={active ? "page" : undefined}
                className={`hyre-nav-link ${active ? "!text-brand" : ""} ${locked ? "opacity-60" : ""}`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
          <HeaderWalletConnect
            isAuthenticated={!!user}
            userId={user?.id ?? null}
            savedWallet={user?.wallet ?? null}
          />
          <SignInOut
            hasSession={!!user}
            image={user?.image ?? null}
            name={user?.name ?? null}
            verified={Boolean(user?.blueCheckmark)}
          />
        </div>
      </div>
    </header>
  );
}
