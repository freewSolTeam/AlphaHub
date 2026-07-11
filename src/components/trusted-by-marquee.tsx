"use client";

import Image from "next/image";
import { RobinhoodChainMark } from "@/components/robinhood-chain-mark";

type Brand =
  | { kind: "feather"; name: string }
  | { kind: "logo"; name: string; src: string };

const BRANDS: Brand[] = [
  { kind: "feather", name: "Robinhood" },
  { kind: "feather", name: "Robinhood Chain" },
  { kind: "feather", name: "Robinhood Wallet" },
  { kind: "feather", name: "Robinhood Crypto" },
  { kind: "logo", name: "Arbitrum", src: "/brands/arbitrum.svg" },
  { kind: "logo", name: "Bitstamp", src: "/brands/bitstamp.png" },
  { kind: "logo", name: "USDG", src: "/brands/usdg.png" },
  { kind: "logo", name: "Global Dollar", src: "/brands/global-dollar.png" },
];

function BrandMark({ brand }: { brand: Brand }) {
  if (brand.kind === "feather") {
    return (
      <span className="flex h-7 w-7 shrink-0 items-center justify-center border border-[#CCFF00]/30 bg-[#CCFF00]/10">
        <RobinhoodChainMark className="h-4 w-4 text-[#CCFF00]" />
      </span>
    );
  }

  return (
    <span className="flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-sm bg-white/95 p-0.5">
      <Image src={brand.src} alt="" width={28} height={28} unoptimized className="h-full w-full object-contain" />
    </span>
  );
}

function MarqueeGroup() {
  return (
    <>
      {BRANDS.map((brand) => (
        <div
          key={brand.name}
          className="flex h-12 shrink-0 items-center justify-center gap-2.5 px-8 opacity-60 transition hover:opacity-100"
        >
          <BrandMark brand={brand} />
          <span className="whitespace-nowrap text-sm font-semibold tracking-tight text-[var(--landing-text)]">
            {brand.name}
          </span>
        </div>
      ))}
    </>
  );
}

export function TrustedByMarquee() {
  return (
    <section className="border-t border-[var(--landing-border)] py-12">
      <p className="hyre-label text-center">Ecosystem</p>
      <div className="relative mt-8 overflow-hidden">
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-20 bg-gradient-to-r from-[var(--landing-bg)] to-transparent" aria-hidden />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-20 bg-gradient-to-l from-[var(--landing-bg)] to-transparent" aria-hidden />
        <div className="trusted-marquee-track flex w-max items-center">
          <MarqueeGroup />
          <MarqueeGroup />
          <MarqueeGroup />
        </div>
      </div>
    </section>
  );
}
