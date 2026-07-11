"use client";

import { WalletConnectExtras } from "@/components/wallet/wallet-connect-extras";
import { useRobinhoodWallet } from "@/hooks/use-robinhood-wallet";
import { useWalletConnect } from "@/hooks/use-wallet-connect";
import { shortWalletAddress } from "@/lib/wallet-display";
import { useSession } from "next-auth/react";
import { useCallback, useState } from "react";

type PanelProps = {
  compact?: boolean;
  inProfile?: boolean;
};

function walletsMatch(a: string | null | undefined, b: string | null | undefined) {
  if (!a || !b) return false;
  return a.toLowerCase() === b.toLowerCase();
}

export function WalletLinkPanel({ compact = false, inProfile = false }: PanelProps) {
  const wallet = useRobinhoodWallet();
  const { connectWallet, hint, connecting, onWrongChain, addRobinhoodNetwork } = useWalletConnect();
  const { data: session, update, status } = useSession();
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const onSave = useCallback(async () => {
    if (!wallet.address) return;
    setSaving(true);
    setMessage(null);
    try {
      const r = await fetch("/api/me/wallet", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wallet: wallet.address }),
      });
      const j = (await r.json().catch(() => ({}))) as { error?: string };
      if (!r.ok) throw new Error(j.error || "Failed to save wallet");
      await update();
      setMessage("Wallet address saved.");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Error");
    } finally {
      setSaving(false);
    }
  }, [wallet.address, update]);

  const onClear = useCallback(async () => {
    setSaving(true);
    setMessage(null);
    try {
      const r = await fetch("/api/me/wallet", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wallet: null }),
      });
      if (!r.ok) {
        const j = (await r.json().catch(() => ({}))) as { error?: string };
        throw new Error(j.error || "Failed to remove wallet");
      }
      if (wallet.isConnected) {
        await wallet.disconnect();
      }
      await update();
      setMessage("Wallet removed from profile.");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Error");
    } finally {
      setSaving(false);
    }
  }, [wallet, update]);

  const onDisconnect = useCallback(async () => {
    setMessage(null);
    try {
      await wallet.disconnect();
      setMessage("Wallet disconnected.");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Error");
    }
  }, [wallet]);

  if (status === "unauthenticated" || !session) return null;

  const sameAsSaved = walletsMatch(session.user.wallet, wallet.address);
  const hasSavedWallet = Boolean(session.user.wallet);
  const actionBtn =
    "rounded border border-[var(--rh-border)] px-2.5 py-1.5 font-mono text-[11px] uppercase tracking-[0.08em] transition disabled:opacity-50";
  const actionBtnDanger =
    "rounded border border-red-500/25 px-2.5 py-1.5 font-mono text-[11px] uppercase tracking-[0.08em] text-red-300/90 transition hover:border-red-400/40 hover:text-red-200 disabled:opacity-50";

  return (
    <div className={inProfile ? "mt-2.5 space-y-2 border-t border-[var(--rh-border)] pt-2.5" : compact ? "card-rh p-3" : "card-rh p-6"}>
      <p className="hyre-label">{inProfile ? "Wallet" : "Robinhood Chain wallet"}</p>
      {!inProfile ? (
        <p className="mt-1 text-xs leading-relaxed text-[var(--rh-muted)]">
          Connect Robinhood Wallet or MetaMask on Robinhood Chain (chain ID 4663).
        </p>
      ) : null}

      {session.user.wallet && inProfile && !wallet.isConnected ? (
        <p className="max-w-full rounded border border-[var(--rh-border)] bg-[var(--rh-surface)] px-2 py-1 font-mono text-xs text-[var(--rh-foreground)]" title={session.user.wallet}>
          {shortWalletAddress(session.user.wallet)}
        </p>
      ) : null}

      <div className={inProfile ? "mt-0 flex flex-col gap-1.5 sm:flex-row sm:flex-wrap" : "mt-4 flex flex-wrap items-center gap-2"}>
        {!wallet.isConnected ? (
          <>
            <button type="button" onClick={() => void connectWallet()} disabled={connecting} className="btn-rh-primary">
              {connecting ? "Connecting…" : "Connect wallet"}
            </button>
            {hasSavedWallet ? (
              <button type="button" onClick={() => void onClear()} disabled={saving} className={actionBtnDanger}>
                Remove wallet
              </button>
            ) : null}
          </>
        ) : (
          <>
            <span className="max-w-full rounded border border-[var(--rh-border)] bg-[var(--rh-surface)] px-2 py-1 font-mono text-xs text-[var(--rh-foreground)]" title={wallet.address ?? ""}>
              {wallet.address ? shortWalletAddress(wallet.address) : "—"}
            </span>
            <button type="button" onClick={() => void onSave()} disabled={saving || !wallet.address || sameAsSaved} className="btn-rh-secondary">
              {saving ? "Saving…" : sameAsSaved ? "Saved" : "Save to profile"}
            </button>
            <button type="button" onClick={() => void onDisconnect()} disabled={saving} className={actionBtn}>
              Disconnect
            </button>
            {hasSavedWallet ? (
              <button type="button" onClick={() => void onClear()} disabled={saving} className={actionBtnDanger}>
                Remove wallet
              </button>
            ) : null}
          </>
        )}
      </div>

      {(message || hint) && <p className="text-xs text-[var(--rh-muted)]">{message || hint}</p>}
      {!wallet.isConnected ? (
        <WalletConnectExtras hint={hint} onWrongChain={onWrongChain} onAddNetwork={() => void addRobinhoodNetwork()} align="left" />
      ) : null}
    </div>
  );
}
