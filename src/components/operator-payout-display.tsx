import { escrowContractEnabled, getEscrowContractAddress } from "@/lib/alphahub-checkout";
import { resolveSellerPayoutWallet } from "@/lib/seller-payout-wallet";
import {
  ALPHA_HUB_CONTRACT_NAME,
  alphaHubContractExplorerUrl,
} from "@/lib/robinhood-public-client";
import { shortWalletAddress } from "@/lib/wallet-display";

const EXPLORER = "https://robinhoodchain.blockscout.com/address";

type UserWallet = {
  wallet?: string | null;
  payoutWallet?: string | null;
};

export function resolveOperatorPayoutAddress(user: UserWallet): string | null {
  return resolveSellerPayoutWallet(user);
}

type DisplayProps = {
  user: UserWallet;
  currency?: string | null;
  compact?: boolean;
  className?: string;
};

/** Shown on listing detail — where buyer payments settle for the operator. */
export function OperatorPayoutDisplay({ user, currency, compact, className = "" }: DisplayProps) {
  const payout = resolveOperatorPayoutAddress(user);
  if (!payout) {
    return (
      <p className={`text-xs text-amber-200/90 ${className}`}>
        Operator payout wallet not configured — checkout may be unavailable.
      </p>
    );
  }

  const viaContract = escrowContractEnabled();
  const contractAddr = getEscrowContractAddress();

  if (compact) {
    return (
      <p className={`font-mono text-[10px] text-[var(--rh-muted)] ${className}`}>
        {viaContract ? `${ALPHA_HUB_CONTRACT_NAME} checkout` : "Payout"} · {shortWalletAddress(payout, 6, 4)}
        {currency ? ` · ${currency}` : ""}
      </p>
    );
  }

  return (
    <div className={`rounded border border-[var(--rh-border)] bg-[var(--rh-surface-elevated)] p-3 ${className}`}>
      <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--rh-subtle)]">
        {viaContract ? `${ALPHA_HUB_CONTRACT_NAME} checkout` : "Operator receives"}
      </p>
      <p className="mt-1.5 text-xs leading-relaxed text-[var(--rh-muted)]">
        {viaContract
          ? `Payments go through the verified ${ALPHA_HUB_CONTRACT_NAME} smart contract. Platform fee is deducted on-chain; the operator receives the rest at their wallet below.`
          : "On-chain sales settle directly to this operator wallet"}
        {currency && !viaContract ? ` in ${currency}.` : "."}
      </p>
      {viaContract && contractAddr ? (
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <code className="rounded border border-brand/20 bg-brand/5 px-2 py-1 font-mono text-[11px] text-brand">
            {shortWalletAddress(contractAddr, 8, 6)}
          </code>
          <a
            href={alphaHubContractExplorerUrl(contractAddr)}
            target="_blank"
            rel="noreferrer"
            className="font-mono text-[10px] uppercase tracking-[0.1em] text-[var(--rh-muted)] underline-offset-2 hover:text-brand hover:underline"
          >
            View verified contract
          </a>
        </div>
      ) : null}
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <span className="text-[10px] uppercase tracking-[0.1em] text-[var(--rh-subtle)]">Operator wallet</span>
        <code className="rounded border border-brand/20 bg-brand/5 px-2 py-1 font-mono text-[11px] text-brand">
          {shortWalletAddress(payout, 8, 6)}
        </code>
        <a
          href={`${EXPLORER}/${payout}`}
          target="_blank"
          rel="noreferrer"
          className="font-mono text-[10px] uppercase tracking-[0.1em] text-[var(--rh-muted)] underline-offset-2 hover:text-brand hover:underline"
        >
          View on explorer
        </a>
      </div>
    </div>
  );
}
