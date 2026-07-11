"use client";

import { usePathname } from "next/navigation";
import { SiteFooter } from "./site-footer";
import { SiteHeader } from "./site-header";
import { SiteMobileBottomNav } from "./site-mobile-bottom-nav";
import { LandingHeader } from "./landing-header";
import { LandingFooter } from "./landing-footer";

const MARKETING_PATHS = ["/", "/login"];

function isMarketingPath(pathname: string) {
  return MARKETING_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

export function SiteChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const marketing = isMarketingPath(pathname);

  if (marketing) {
    return (
      <div className="site-page-bg flex min-h-screen flex-col pb-[calc(3.5rem+env(safe-area-inset-bottom,0px))] md:pb-0">
        <LandingHeader />
        <main className="flex-1">{children}</main>
        <LandingFooter />
        <SiteMobileBottomNav />
      </div>
    );
  }

  return (
    <div className="app-theme site-page-bg flex min-h-screen flex-col pb-[calc(3.5rem+env(safe-area-inset-bottom,0px))] md:pb-0">
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <SiteFooter />
      <SiteMobileBottomNav />
    </div>
  );
}
