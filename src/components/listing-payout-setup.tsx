"use client";

import { shortWalletAddress } from "@/lib/wallet-display";
import { isValidWalletAddress } from "@/lib/validate";
import Link from "next/link";
import { useCallback, useState } from "react";

type Props = {
  loginWallet: string | null;
  payoutWallet: string | null;
  required?: boolean;
  onSaved?: (payout: string | null) => void;
};

export function ListingPayoutSetup({ loginWallet, payoutWallet: initialPayout, required, onSaved }: Props) {
  const [payoutInput, setPayoutInput] = useState(initialPayout ?? "");
  const [savedPayout, setSavedPayout] = useState(initialPayout);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const activePayout = savedPayout?.trim() || loginWallet?.trim() || null;
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
      setError("Same as login wallet — leave empty to use your default.");
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
      onSaved?.(j.payoutWallet ?? null);
      setMessage(value ? "Payout wallet saved." : "Using login wallet for sales.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save.");
    } finally {
      setSaving(false);
    }
  }, [payoutInput, loginWallet]);

  return (
    <div className="rounded border border-brand/20 bg-brand/5 p-4">
      <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-brand">
        Payout wallet
      </p>
      <p className="mt-1.5 text-xs leading-relaxed text-[var(--rh-muted)]">
        Marketplace rule: every paid listing needs a Robinhood Chain address that receives buyer payments.
        Leave the field empty to use your login wallet.
      </p>

      {loginWallet ? (
        <p className="mt-3 text-[11px] text-[var(--rh-muted)]">
          Login wallet ·{" "}
          <span className="font-mono text-[var(--rh-foreground)]">{shortWalletAddress(loginWallet, 8, 6)}</span>
        </p>
      ) : (
        <p className="mt-3 text-xs text-rose-300">
          No login wallet saved.{" "}
          <Link href="/dashboard" className="text-brand underline-offset-2 hover:underline">
            Connect on dashboard
          </Link>{" "}
          first.
        </p>
      )}

      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        <input
          type="text"
          value={payoutInput}
          onChange={(e) => {
            setPayoutInput(e.target.value);
            setError(null);
            setMessage(null);
          }}
          placeholder={loginWallet ? `Default ${shortWalletAddress(loginWallet, 6, 4)}` : "0x…"}
          spellCheck={false}
          autoComplete="off"
          className="ui-form-input min-w-0 flex-1 font-mono text-xs"
        />
        <button
          type="button"
          onClick={() => void onSavePayout()}
          disabled={saving || !payoutDirty}
          className="btn-rh-secondary shrink-0 disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save payout"}
        </button>
      </div>

      {activePayout ? (
        <p className="mt-3 text-xs text-[var(--rh-foreground)]">
          Buyers pay →{" "}
          <span className="font-mono text-brand">{shortWalletAddress(activePayout, 10, 8)}</span>
        </p>
      ) : required ? (
        <p className="mt-3 text-xs text-amber-200/90">Set a payout wallet before publishing a paid listing.</p>
      ) : null}

      {error ? <p className="mt-2 text-xs text-rose-300">{error}</p> : null}
      {message ? <p className="mt-2 text-xs text-brand">{message}</p> : null}
    </div>
  );
}
