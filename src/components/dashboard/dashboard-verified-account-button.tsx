"use client";

import Image from "next/image";
import { BadgeCheck } from "lucide-react";
import { useState } from "react";

type Props = {
  hasWallet: boolean;
  hasXAccount: boolean;
  verified: boolean;
  xHandle: string | null;
};

export function DashboardVerifiedAccountButton({ hasWallet, hasXAccount, verified, xHandle }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isVerified = verified && hasXAccount;

  function onVerify() {
    if (!hasWallet) {
      setError("Connect your wallet before linking X.");
      return;
    }

    setError(null);
    setLoading(true);
    window.location.assign("/api/me/link-x?callbackUrl=/dashboard");
  }

  if (isVerified) {
    return (
      <div className="flex flex-col items-end gap-1">
        <span className="btn-rh-secondary inline-flex w-fit shrink-0 cursor-default items-center gap-2 border-brand/25 bg-brand/10 text-brand">
          <Image src="/verified-badge.png" alt="" width={14} height={14} className="h-3.5 w-3.5 shrink-0" />
          Verified
        </span>
        {xHandle ? (
          <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-[var(--rh-muted)]">@{xHandle}</span>
        ) : null}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={() => void onVerify()}
        disabled={loading || !hasWallet}
        className="btn-rh-secondary inline-flex w-fit shrink-0 items-center gap-2 disabled:opacity-50"
        title={hasWallet ? "Connect with X to unlock the verified badge" : "Connect wallet first"}
      >
        <BadgeCheck className="h-3.5 w-3.5 shrink-0 text-brand" aria-hidden />
        {loading ? "Redirecting…" : "Verified account"}
      </button>
      {error ? <p className="max-w-[14rem] text-right text-[10px] text-rose-300">{error}</p> : null}
      {!hasWallet ? (
        <p className="max-w-[14rem] text-right text-[10px] text-[var(--rh-muted)]">Wallet required first</p>
      ) : null}
    </div>
  );
}
