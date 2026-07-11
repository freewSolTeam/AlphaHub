"use client";

import { shortWalletAddress } from "@/lib/wallet-display";
import { isValidWalletAddress } from "@/lib/validate";
import { useCallback, useState } from "react";

type Props = {
  loginWallet: string | null;
  payoutWallet: string | null;
};

export function DashboardWalletSettings({ loginWallet, payoutWallet: initialPayout }: Props) {
  const [payoutInput, setPayoutInput] = useState(initialPayout ?? "");
  const [savedPayout, setSavedPayout] = useState(initialPayout);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const payoutDirty = (payoutInput.trim() || null) !== (savedPayout?.trim() || null);

  const onSavePayout = useCallback(async () => {
    setSaving(true);
    setMessage(null);
    setError(null);

    const trimmed = payoutInput.trim();
    const value = trimmed.length === 0 ? null : trimmed;

    if (value && !isValidWalletAddress(value)) {
      setError("Enter a valid Robinhood Chain address (0x…).");
      setSaving(false);
      return;
    }

    if (value && loginWallet && value.toLowerCase() === loginWallet.toLowerCase()) {
      setError("Payout wallet is the same as your login wallet — leave the field empty instead.");
      setSaving(false);
      return;
    }

    try {
      const r = await fetch("/api/me/wallet", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payoutWallet: value }),
      });
      const j = (await r.json().catch(() => ({}))) as { error?: string; payoutWallet?: string | null };
      if (!r.ok) throw new Error(typeof j.error === "string" ? j.error : "Could not save payout wallet.");

      setSavedPayout(j.payoutWallet ?? null);
      setPayoutInput(j.payoutWallet ?? "");
      setMessage(value ? "Payout wallet saved." : "Payout wallet cleared — proceeds go to your login wallet.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save.");
    } finally {
      setSaving(false);
    }
  }, [payoutInput, loginWallet]);

  const onClearPayout = useCallback(() => {
    setPayoutInput("");
    setError(null);
    setMessage(null);
  }, []);

  const activePayout = savedPayout?.trim() || loginWallet;

  return (
    <div className="space-y-4">
      <div>
        <p className="hyre-label">Login wallet</p>
        <p className="mt-1 text-xs leading-relaxed text-[var(--rh-muted)]">
          Default wallet from sign-in. Used for auth and as the payout address unless you set one below.
        </p>
        <div className="mt-3 flex items-center gap-2 rounded border border-brand/20 bg-brand/5 px-3 py-2.5">
          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-brand" aria-hidden />
          <span className="font-mono text-sm text-[var(--rh-foreground)]" title={loginWallet ?? undefined}>
            {loginWallet ? shortWalletAddress(loginWallet, 8, 6) : "—"}
          </span>
          <span className="ml-auto font-mono text-[10px] uppercase tracking-[0.1em] text-brand">Default</span>
        </div>
      </div>

      <div>
        <p className="hyre-label">Sales payout wallet</p>
        <p className="mt-1 text-xs leading-relaxed text-[var(--rh-muted)]">
          Optional. Send on-chain sales proceeds to a different address. Leave empty to use your login wallet.
        </p>
        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          <input
            type="text"
            value={payoutInput}
            onChange={(e) => {
              setPayoutInput(e.target.value);
              setError(null);
              setMessage(null);
            }}
            placeholder={loginWallet ? `Same as ${shortWalletAddress(loginWallet, 6, 4)}` : "0x…"}
            spellCheck={false}
            autoComplete="off"
            className="ui-form-input min-w-0 flex-1 font-mono text-xs"
          />
          <div className="flex shrink-0 gap-2">
            <button
              type="button"
              onClick={() => void onSavePayout()}
              disabled={saving || !payoutDirty}
              className="btn-rh-primary !px-4 disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save"}
            </button>
            {payoutInput ? (
              <button type="button" onClick={onClearPayout} disabled={saving} className="btn-rh-ghost">
                Clear
              </button>
            ) : null}
          </div>
        </div>
        {activePayout ? (
          <p className="mt-2 text-[11px] text-[var(--rh-muted)]">
            Active payout:{" "}
            <span className="font-mono text-[var(--rh-foreground)]">{shortWalletAddress(activePayout, 8, 6)}</span>
          </p>
        ) : null}
        {error ? <p className="mt-2 text-xs text-rose-300">{error}</p> : null}
        {message ? <p className="mt-2 text-xs text-brand">{message}</p> : null}
      </div>
    </div>
  );
}
