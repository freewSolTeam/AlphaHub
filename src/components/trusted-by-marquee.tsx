"use client";

import { RobinhoodChainMark } from "@/components/robinhood-chain-mark";

type Brand =
  | { kind: "feather"; name: string }
  | { kind: "badge"; name: string; letter: string; color: string }
  | { kind: "coin"; name: string; letter: string; color: string };

const BRANDS: Brand[] = [
  { kind: "feather", name: "Robinhood" },
  { kind: "feather", name: "Robinhood Chain" },
  { kind: "feather", name: "Robinhood Wallet" },
  { kind: "feather", name: "Robinhood Crypto" },
  { kind: "badge", name: "Arbitrum", letter: "A", color: "#28A0F0" },
  { kind: "badge", name: "Bitstamp", letter: "B", color: "#16A34A" },
  { kind: "coin", name: "USDG", letter: "G", color: "#84CC16" },
  { kind: "coin", name: "Global Dollar", letter: "$", color: "#22C55E" },
];

function BrandMark({ brand }: { brand: Brand }) {
  if (brand.kind === "feather") {
    return (
      <span className="flex h-7 w-7 shrink-0 items-center justify-center border border-[#CCFF00]/30 bg-[#CCFF00]/10">
        <RobinhoodChainMark className="h-4 w-4 text-[#CCFF00]" />
      </span>
    );
  }
  if (brand.kind === "badge") {
    return (
      <span
        className="flex h-7 w-7 shrink-0 items-center justify-center border text-[13px] font-bold"
        style={{ color: brand.color, borderColor: `${brand.color}55`, background: `${brand.color}1f` }}
      >
        {brand.letter}
      </span>
    );
  }
  return (
    <span
      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[13px] font-bold text-black"
      style={{ background: brand.color }}
    >
      {brand.letter}
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
