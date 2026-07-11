"use client";

type Props = {
  hint: string | null;
  onWrongChain?: boolean;
  onAddNetwork?: () => void;
  align?: "left" | "right";
};

export function WalletConnectExtras({ hint, onWrongChain, onAddNetwork, align = "right" }: Props) {
  if (!hint && !onWrongChain) return null;

  return (
    <div className={`mt-1 max-w-[260px] sm:max-w-xs ${align === "left" ? "text-left" : "text-right"}`}>
      {hint ? <p className="text-[11px] leading-snug text-amber-200/85 sm:text-xs">{hint}</p> : null}
      {onWrongChain && onAddNetwork ? (
        <button
          type="button"
          onClick={() => onAddNetwork()}
          className="mt-1 text-[11px] font-medium text-brand underline decoration-brand/30 underline-offset-2 hover:text-brand/80 sm:text-xs"
        >
          Switch to Robinhood Chain
        </button>
      ) : null}
      {!onWrongChain ? (
        <p className="mt-1 text-[10px] leading-snug text-[var(--rh-muted)]">
          Connect via Reown — Robinhood Wallet, MetaMask, WalletConnect, and more on chain 4663.
        </p>
      ) : null}
    </div>
  );
}
