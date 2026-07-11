import { getEscrowContractAddress } from "@/lib/alphahub-checkout";
import { getPlatformFee } from "@/lib/escrow-config";
import {
  ALPHA_HUB_CONTRACT_NAME,
  alphaHubContractExplorerUrl,
} from "@/lib/robinhood-public-client";
import { shortWalletAddress } from "@/lib/wallet-display";
import { ArrowUpRight, BadgeCheck, Shield } from "lucide-react";
import Link from "next/link";

const FLOW = [
  { step: "01", title: "Buyer pays", body: "USDG or ETH via wallet — listed tier price, no hidden markup." },
  { step: "02", title: "Contract splits", body: "AlphaHub routes platform fee to treasury and the rest to the operator." },
  { step: "03", title: "Event verified", body: "AlphaHub reads PaymentSettled on-chain, then unlocks Telegram / Discord access." },
] as const;

export function LandingOnChainSection() {
  const contractAddress = getEscrowContractAddress();
  const platformFee = getPlatformFee();

  if (!contractAddress) return null;

  const explorerUrl = alphaHubContractExplorerUrl(contractAddress);

  return (
    <section className="landing-section border-t border-[var(--landing-border)]">
      <div className="landing-wrap">
        <div className="grid gap-10 lg:grid-cols-[1.05fr_1fr] lg:items-start lg:gap-14">
          <div>
            <p className="hyre-label">On-chain checkout</p>
            <h2 className="hyre-section-title mt-3 max-w-xl">
              Verified <span className="landing-text-gradient">{ALPHA_HUB_CONTRACT_NAME}</span> smart contract.
            </h2>
            <p className="mt-4 max-w-xl text-sm leading-relaxed text-[var(--landing-muted)]">
              Every paid checkout runs through a single audited contract on Robinhood Chain. Buyers call{" "}
              <span className="font-mono text-[11px] text-[var(--landing-text)]">payUSDG</span> or{" "}
              <span className="font-mono text-[11px] text-[var(--landing-text)]">payETH</span>; fees and operator
              payouts settle atomically — no manual forwarding.
            </p>

            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              {FLOW.map((item) => (
                <div
                  key={item.step}
                  className="border border-[var(--landing-border)] bg-[var(--landing-surface)] p-4"
                >
                  <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-brand">{item.step}</p>
                  <p className="mt-2 text-sm font-medium text-[var(--landing-text)]">{item.title}</p>
                  <p className="mt-1.5 text-xs leading-relaxed text-[var(--landing-muted)]">{item.body}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="landing-on-chain-card relative overflow-hidden border border-brand/15 bg-[var(--landing-surface)] p-6 sm:p-7">
            <div className="landing-on-chain-card-glow pointer-events-none absolute inset-0" aria-hidden />
            <div className="relative">
              <div className="flex flex-wrap items-center gap-2">
                <Shield className="h-4 w-4 text-brand" aria-hidden />
                <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-brand">
                  Smart contract
                </p>
                <span className="inline-flex items-center gap-1 rounded-full border border-brand/25 bg-brand/10 px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.12em] text-brand">
                  <BadgeCheck className="h-3 w-3" aria-hidden />
                  Verified
                </span>
              </div>

              <p className="mt-4 text-2xl font-semibold tracking-tight text-[var(--landing-text)]">
                {ALPHA_HUB_CONTRACT_NAME}
              </p>
              <p className="mt-2 text-sm leading-relaxed text-[var(--landing-muted)]">
                Checkout contract on Robinhood Chain. Seller-paid platform fee: {platformFee} USDG (or ETH equivalent).
              </p>

              <div className="mt-6 space-y-2">
                <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--landing-muted)]">
                  Contract address
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  <code
                    className="rounded border border-brand/20 bg-brand/5 px-3 py-2 font-mono text-xs text-brand"
                    title={contractAddress}
                  >
                    {shortWalletAddress(contractAddress, 8, 6)}
                  </code>
                  <a
                    href={explorerUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.1em] text-[var(--landing-muted)] transition hover:text-brand"
                  >
                    Blockscout
                    <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
                  </a>
                </div>
              </div>

              <div className="mt-6 flex flex-wrap gap-2 border-t border-[var(--landing-border)] pt-5">
                <Link href="/docs#on-chain" className="hyre-cta-ghost text-[10px]">
                  Read docs
                </Link>
                <a href={explorerUrl} target="_blank" rel="noreferrer" className="hyre-cta-main text-[10px]">
                  View contract
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
