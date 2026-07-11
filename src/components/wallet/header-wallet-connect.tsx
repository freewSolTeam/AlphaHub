"use client";

import { WalletConnectExtras } from "@/components/wallet/wallet-connect-extras";
import { useRobinhoodWallet } from "@/hooks/use-robinhood-wallet";
import { useWalletConnect } from "@/hooks/use-wallet-connect";
import { useCallback, useState } from "react";
import { formatEther } from "viem";

type HeaderWalletConnectProps = {
  isAuthenticated: boolean;
  userId: string | null;
  savedWallet: string | null;
};

function HeaderWalletBalance({
  savedWallet,
  userId,
}: {
  savedWallet: string | null;
  userId: string | null;
}) {
  const wallet = useRobinhoodWallet();
  const [profileWallet, setProfileWallet] = useState<string | null>(savedWallet);

  const syncWallet = useCallback(async (addr: string) => {
    const r = await fetch("/api/me/wallet", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ wallet: addr }),
    });
    if (!r.ok) return false;
    setProfileWallet(addr.toLowerCase());
    return true;
  }, []);

  const balance =
    wallet.balanceWei != null ? formatEther(wallet.balanceWei) : null;

  return (
    <div className="flex min-w-0 max-w-full items-center gap-2 sm:gap-2.5">
      <span
        className="shrink-0 tabular-nums text-[11px] font-medium text-[var(--rh-foreground)] sm:text-sm"
        title="Native balance on Robinhood Chain"
      >
        {balance == null ? "…" : Number(balance).toFixed(balance && Number(balance) < 1 ? 4 : 3)}
        <span className="text-[var(--rh-muted)]"> ETH</span>
      </span>
      {wallet.address && userId && !profileWallet ? (
        <button
          type="button"
          onClick={() => void syncWallet(wallet.address!)}
          className="hidden shrink-0 text-xs text-amber-200/80 underline decoration-white/20 sm:inline sm:text-sm"
        >
          Save to profile
        </button>
      ) : null}
    </div>
  );
}

function HeaderWalletConnectActions({
  isAuthenticated,
  userId,
  savedWallet,
}: HeaderWalletConnectProps) {
  const wallet = useRobinhoodWallet();
  const { connectWallet, hint, connecting, onWrongChain, addRobinhoodNetwork } = useWalletConnect();
  const [savingProfileWallet, setSavingProfileWallet] = useState(false);
  const [profileWallet, setProfileWallet] = useState<string | null>(savedWallet);

  const syncWallet = useCallback(async (addr: string) => {
    const r = await fetch("/api/me/wallet", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ wallet: addr }),
    });
    if (!r.ok) return false;
    setProfileWallet(addr.toLowerCase());
    return true;
  }, []);

  const onConnect = useCallback(async () => {
    await connectWallet();
    if (isAuthenticated && userId && wallet.address && !profileWallet) {
      setSavingProfileWallet(true);
      try {
        await syncWallet(wallet.address);
      } finally {
        setSavingProfileWallet(false);
      }
    }
  }, [connectWallet, isAuthenticated, userId, wallet.address, profileWallet, syncWallet]);

  return (
    <div className="flex shrink-0 flex-col items-end gap-0.5">
      <button
        type="button"
        onClick={() => void onConnect()}
        disabled={connecting || savingProfileWallet}
        className="rounded border border-brand/25 bg-brand/10 px-3 py-1.5 text-[11px] font-medium uppercase tracking-[0.08em] text-brand transition hover:border-brand/45 hover:bg-brand/15 disabled:opacity-50 sm:px-3.5 sm:text-xs"
      >
        {connecting ? "Connecting…" : "Connect wallet"}
      </button>
      <WalletConnectExtras
        hint={hint}
        onWrongChain={onWrongChain}
        onAddNetwork={() => void addRobinhoodNetwork()}
        align="right"
      />
    </div>
  );
}

export function HeaderWalletConnect({ isAuthenticated, userId, savedWallet }: HeaderWalletConnectProps) {
  const wallet = useRobinhoodWallet();

  if (!isAuthenticated) return null;

  if ((wallet.isConnected && wallet.address) || savedWallet) {
    return <HeaderWalletBalance savedWallet={savedWallet} userId={userId} />;
  }

  return (
    <HeaderWalletConnectActions
      isAuthenticated={isAuthenticated}
      userId={userId}
      savedWallet={savedWallet}
    />
  );
}
