"use client";

import { SiteLogo } from "@/components/site-logo";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { SignInOut } from "./sign-in-out";

const NAV = [
  { href: "/", label: "Home" },
  { href: "/explore", label: "Directory" },
  { href: "/leaderboard", label: "Rankings" },
  { href: "/docs", label: "Docs" },
];

export function LandingHeader() {
  const { data: session } = useSession();
  const user = session?.user;

  return (
    <header className="landing-header fixed inset-x-0 top-0 z-50">
      <div className="landing-wrap flex h-14 items-center justify-between gap-6 sm:h-[3.75rem]">
        <SiteLogo />

        <nav className="hidden items-center gap-6 lg:flex">
          {NAV.map((item) => (
            <Link key={item.href} href={item.href} className="hyre-nav-link">
              {item.label}
            </Link>
          ))}
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
