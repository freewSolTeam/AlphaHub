"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";

type Props = {
  xHandle: string | null;
  hasXAccount: boolean;
  verified: boolean;
};

export function ConnectXPanel({ xHandle, hasXAccount, verified }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function onConnect() {
    setError(null);
    setLoading(true);
    window.location.assign("/api/me/link-x?callbackUrl=/dashboard");
  }

  if (hasXAccount && xHandle) {
    return (
      <div className="mt-2.5 space-y-2 border-t border-[var(--rh-border)] pt-2.5">
        <p className="hyre-label">X account</p>
        <div className="flex items-center gap-2 rounded border border-brand/20 bg-brand/5 px-2.5 py-2">
          <span className="text-sm font-medium text-[var(--rh-foreground)]">@{xHandle}</span>
          {verified ? (
            <Image src="/verified-badge.png" alt="Verified" width={14} height={14} className="h-3.5 w-3.5 shrink-0" />
          ) : null}
        </div>
        <p className="text-[11px] leading-relaxed text-[var(--rh-muted)]">
          Your X profile is linked. Listings and leaderboard show your handle with the verified badge.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-2.5 space-y-2 border-t border-[var(--rh-border)] pt-2.5">
      <p className="hyre-label">X account</p>
      <p className="text-xs leading-relaxed text-[var(--rh-muted)]">
        Connect X to unlock the blue verified badge and display your handle on listings and leaderboard.
      </p>
      <button
        type="button"
        onClick={() => void onConnect()}
        disabled={loading}
        className="btn-rh-secondary w-full disabled:opacity-50"
      >
        {loading ? "Redirecting…" : "Connect with X"}
      </button>
      {error ? <p className="text-xs text-rose-300">{error}</p> : null}
      <button
        type="button"
        onClick={() => router.refresh()}
        className="text-[11px] text-[var(--rh-muted)] underline hover:text-brand"
      >
        Already connected? Refresh profile
      </button>
    </div>
  );
}
