"use client";

import { WalletConnectExtras } from "@/components/wallet/wallet-connect-extras";
import { useRobinhoodWallet } from "@/hooks/use-robinhood-wallet";
import { useWalletConnect } from "@/hooks/use-wallet-connect";
import { signInWithWallet } from "@/lib/wallet-sign-in-client";
import { useCallback, useEffect, useRef, useState } from "react";

export function SignInWallet({ callbackUrl }: { callbackUrl: string }) {
  const wallet = useRobinhoodWallet();
  const { connectWallet, hint, connecting, onWrongChain, addRobinhoodNetwork } = useWalletConnect();
  const [err, setErr] = useState<string | null>(null);
  const [signingIn, setSigningIn] = useState(false);
  const autoSignKeyRef = useRef<string | null>(null);

  const runSignIn = useCallback(async () => {
    if (!wallet.address) return;
    setErr(null);
    setSigningIn(true);
    try {
      await signInWithWallet(wallet, { callbackUrl });
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not sign in with wallet.");
    } finally {
      setSigningIn(false);
    }
  }, [wallet, callbackUrl]);

  useEffect(() => {
    if (!wallet.isConnected) {
      autoSignKeyRef.current = null;
    }
  }, [wallet.isConnected]);

  useEffect(() => {
    if (!wallet.isConnected || !wallet.address || onWrongChain || signingIn) return;

    const key = wallet.address.toLowerCase();
    if (autoSignKeyRef.current === key) return;
    autoSignKeyRef.current = key;

    void runSignIn();
  }, [wallet.isConnected, wallet.address, onWrongChain, signingIn, runSignIn]);

  const busy = connecting || signingIn || wallet.isSigning;
  const showConnected = wallet.isConnected && wallet.address;

  return (
    <div className="space-y-4">
      {!showConnected ? (
        <>
          <button
            type="button"
            disabled={busy}
            onClick={() => void connectWallet()}
            className="hyre-cta-main w-full disabled:opacity-50"
          >
            {busy ? "Opening wallet…" : "Connect wallet"}
          </button>
          <WalletConnectExtras
            hint={hint}
            onWrongChain={onWrongChain}
            onAddNetwork={() => void addRobinhoodNetwork()}
            align="left"
          />
        </>
      ) : (
        <>
          <p className="rounded border border-[var(--landing-border)] bg-[var(--landing-bg)] px-3 py-2 text-center font-mono text-xs text-[var(--landing-muted)]">
            {wallet.address ? `${wallet.address.slice(0, 8)}…${wallet.address.slice(-6)}` : "—"}
          </p>
          {onWrongChain ? (
            <button type="button" onClick={() => void addRobinhoodNetwork()} className="hyre-cta-ghost w-full">
              Switch to Robinhood Chain
            </button>
          ) : (
            <button type="button" disabled className="hyre-cta-main w-full opacity-80">
              {busy ? "Confirm sign message in wallet…" : "Signing in…"}
            </button>
          )}
          {err ? (
            <button type="button" disabled={busy} onClick={() => void runSignIn()} className="hyre-cta-main w-full">
              Try sign-in again
            </button>
          ) : null}
          <button
            type="button"
            disabled={busy}
            onClick={() => {
              autoSignKeyRef.current = null;
              void wallet.disconnect();
            }}
            className="hyre-cta-ghost w-full disabled:opacity-50"
          >
            Use a different wallet
          </button>
        </>
      )}
      {err ? <p className="text-center text-sm text-rose-300">{err}</p> : null}
      <p className="text-center text-[11px] leading-relaxed text-[var(--landing-muted)]">
        After connect, your wallet will ask you to sign a message — no gas fee. Link X later in Dashboard for the
        verified badge.
      </p>
    </div>
  );
}
