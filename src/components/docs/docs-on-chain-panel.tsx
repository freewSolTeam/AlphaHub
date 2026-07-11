import { DocsField } from "@/components/docs/docs-section";
import { getEscrowContractAddress } from "@/lib/alphahub-checkout";
import { getPlatformFee, getPlatformTreasuryWallet } from "@/lib/escrow-config";
import {
  ALPHA_HUB_CONTRACT_NAME,
  alphaHubContractExplorerUrl,
} from "@/lib/robinhood-public-client";
import { USDG_TOKEN_ADDRESS } from "@/lib/payment-currency";
import { getTokenContractDisplay, tokenContractConfigured } from "@/lib/token-contract";
import { shortWalletAddress } from "@/lib/wallet-display";
import { ArrowUpRight, BadgeCheck } from "lucide-react";

export function DocsOnChainPanel() {
  const contractAddress = getEscrowContractAddress();
  const platformFee = getPlatformFee();
  const treasury = getPlatformTreasuryWallet();
  const tokenCa = getTokenContractDisplay();
  const tokenLive = tokenContractConfigured();

  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="docs-on-chain-card border border-[var(--rh-border)] bg-[var(--rh-black)]/50 p-5">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-brand">Token CA</p>
            {!tokenLive ? (
              <span className="rounded border border-[var(--rh-border)] px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.1em] text-[var(--rh-subtle)]">
                TBA
              </span>
            ) : null}
          </div>
          <p className="mt-2 text-sm leading-relaxed text-[var(--rh-muted)]">
            The AlphaHub token contract address — separate from the checkout smart contract. Used for ecosystem token
            rails when launched.
          </p>
          <code
            className={`mt-4 block max-w-full rounded border px-3 py-2 font-mono text-xs ${
              tokenLive
                ? "border-brand/20 bg-brand/5 text-brand"
                : "border-[var(--rh-border)] text-[var(--rh-subtle)]"
            }`}
          >
            {tokenCa}
          </code>
        </div>

        <div className="docs-on-chain-card border border-brand/20 bg-brand/5 p-5">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-brand">
              {ALPHA_HUB_CONTRACT_NAME} contract
            </p>
            {contractAddress ? (
              <span className="inline-flex items-center gap-1 rounded-full border border-brand/25 bg-brand/10 px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.12em] text-brand">
                <BadgeCheck className="h-3 w-3" aria-hidden />
                Verified
              </span>
            ) : null}
          </div>
          <p className="mt-2 text-sm leading-relaxed text-[var(--rh-muted)]">
            Handles paid checkout. Buyers call <DocsField>payUSDG</DocsField> or <DocsField>payETH</DocsField>; the
            contract deducts the platform fee and forwards the remainder to the operator payout wallet in one transaction.
          </p>
          {contractAddress ? (
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <code
                className="block max-w-full rounded border border-brand/20 bg-[var(--rh-black)]/40 px-3 py-2 font-mono text-xs text-brand"
                title={contractAddress}
              >
                {shortWalletAddress(contractAddress, 8, 6)}
              </code>
              <a
                href={alphaHubContractExplorerUrl(contractAddress)}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-[0.1em] text-[var(--rh-muted)] hover:text-brand"
              >
                Blockscout
                <ArrowUpRight className="h-3 w-3" aria-hidden />
              </a>
            </div>
          ) : (
            <p className="mt-4 text-xs text-amber-200/90">Checkout contract not configured on this deployment.</p>
          )}
        </div>
      </div>

      <div className="docs-money-rail">
        {[
          {
            label: "Buyer checkout",
            detail: "Wallet approves and pays the listed tier price in USDG or ETH through the AlphaHub contract.",
          },
          {
            label: "Platform fee",
            detail: `${platformFee} USDG (or ETH equivalent) per sale — deducted on-chain from the operator share, not added to the buyer price.`,
          },
          {
            label: "Operator payout",
            detail: "Net proceeds land on the operator's saved Robinhood Chain payout wallet after the split.",
          },
          {
            label: "USDG rail",
            detail: `Stablecoin transfers use canonical USDG at ${shortWalletAddress(USDG_TOKEN_ADDRESS, 6, 4)}.`,
          },
          {
            label: "Treasury",
            detail: treasury
              ? `Platform fees route to ${shortWalletAddress(treasury, 6, 4)}.`
              : "Platform fees route to the treasury wallet configured in the contract.",
          },
          {
            label: "Confirmation",
            detail: "AlphaHub matches the PaymentSettled event, then unlocks Telegram or Discord invites.",
          },
        ].map((node, idx) => (
          <div key={node.label} className="docs-money-node">
            <span className="docs-money-index">{idx + 1}</span>
            <div>
              <p className="text-sm font-medium text-[var(--rh-foreground)]">{node.label}</p>
              <p className="mt-0.5 text-xs leading-relaxed text-[var(--rh-muted)]">{node.detail}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
