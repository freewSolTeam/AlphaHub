"use client";

import { Compass, FileText, Home, LayoutGrid, Trophy } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import type { LucideIcon } from "lucide-react";

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  isActive: (pathname: string) => boolean;
  requiresAuth?: boolean;
};

const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Home", icon: Home, isActive: (p) => p === "/" },
  {
    href: "/explore",
    label: "Explore",
    icon: Compass,
    isActive: (p) => p === "/explore" || p.startsWith("/explore/"),
  },
  {
    href: "/leaderboard",
    label: "Board",
    icon: Trophy,
    isActive: (p) => p === "/leaderboard" || p.startsWith("/leaderboard/"),
  },
  {
    href: "/docs",
    label: "Docs",
    icon: FileText,
    isActive: (p) => p === "/docs" || p.startsWith("/docs/"),
  },
  {
    href: "/dashboard",
    label: "Dash",
    icon: LayoutGrid,
    isActive: (p) => p === "/dashboard" || p.startsWith("/dashboard/"),
    requiresAuth: true,
  },
];

export function SiteMobileBottomNav() {
  const pathname = usePathname();
  const { status } = useSession();
  const isAuthenticated = status === "authenticated";

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-50 border-t border-brand/10 backdrop-blur-xl md:hidden"
      style={{ background: "var(--site-header-bg)" }}
      aria-label="Main navigation"
    >
      <div className="mx-auto flex h-14 max-w-[1728px] items-stretch justify-around px-1 pb-[env(safe-area-inset-bottom,0px)]">
        {NAV_ITEMS.map((item) => {
          const active = item.isActive(pathname);
          const locked = item.requiresAuth && !isAuthenticated;
          const href = locked ? "/login?callbackUrl=/dashboard" : item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={`flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 px-0.5 transition ${
                active
                  ? "text-brand"
                  : locked
                    ? "text-[var(--rh-subtle)]"
                    : "text-[var(--rh-muted)] active:text-[var(--rh-foreground)]"
              }`}
            >
              <Icon
                className={`h-5 w-5 shrink-0 ${active ? "text-brand" : ""}`}
                strokeWidth={active ? 2.25 : 1.75}
                aria-hidden
              />
              <span
                className={`truncate font-mono text-[9px] uppercase tracking-[0.08em] leading-none ${active ? "font-semibold" : "font-normal"}`}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
