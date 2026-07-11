"use client";

import { SiteLogo } from "@/components/site-logo";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { SignInOut } from "./sign-in-out";

const NAV = [
  { href: "/", label: "Home", match: (p: string) => p === "/" },
  { href: "/explore", label: "Directory", match: (p: string) => p === "/explore" || p.startsWith("/explore/") },
  { href: "/leaderboard", label: "Rankings", match: (p: string) => p === "/leaderboard" || p.startsWith("/leaderboard/") },
  { href: "/docs", label: "Docs", match: (p: string) => p === "/docs" || p.startsWith("/docs/") },
  {
    href: "/dashboard",
    label: "Dashboard",
    match: (p: string) => p === "/dashboard" || p.startsWith("/dashboard/"),
    requiresAuth: true,
  },
];

export function LandingHeader() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const user = session?.user;

  return (
    <header className="landing-header fixed inset-x-0 top-0 z-50">
      <div className="landing-wrap flex h-14 items-center justify-between gap-6 sm:h-[3.75rem]">
        <SiteLogo />

        <nav className="hidden items-center gap-6 lg:flex" aria-label="Main">
          {NAV.map((item) => {
            if (item.requiresAuth && !user) return null;
            const active = item.match(pathname);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`hyre-nav-link ${active ? "!text-brand" : ""}`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex shrink-0 items-center gap-3">
          {user ? (
            <SignInOut
              hasSession
              image={user.image ?? null}
              name={user.name ?? null}
              verified={Boolean(user.blueCheckmark)}
            />
          ) : (
            <Link href="/login" className="hyre-nav-cta">
              Launch app
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
