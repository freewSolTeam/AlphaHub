"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

type Props = {
  xHandle: string | null;
  hasXAccount: boolean;
  verified: boolean;
};

export function DashboardXLink({ xHandle, hasXAccount, verified }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const autoSyncKeyRef = useRef<string | null>(null);

  useEffect(() => {
    if (!hasXAccount || xHandle) return;

    const key = "x-auto-sync";
    if (autoSyncKeyRef.current === key) return;
    autoSyncKeyRef.current = key;

    void (async () => {
      setSyncing(true);
      setError(null);
      try {
        const r = await fetch("/api/me/x-handle", { method: "POST" });
        const j = (await r.json().catch(() => ({}))) as { error?: string };
        if (!r.ok) throw new Error(typeof j.error === "string" ? j.error : "Could not sync X handle");
        router.refresh();
      } catch (e) {
        autoSyncKeyRef.current = null;
        setError(e instanceof Error ? e.message : "Could not sync X handle");
      } finally {
        setSyncing(false);
      }
    })();
  }, [hasXAccount, xHandle, router]);

  function onConnect() {
    setError(null);
    setLoading(true);
    window.location.assign("/api/me/link-x?callbackUrl=/dashboard?activity=settings");
  }

  if (hasXAccount && xHandle) {
    return (
      <div className="space-y-2">
        <p className="hyre-label">X account</p>
        <div className="flex items-center gap-2 rounded border border-brand/20 bg-brand/5 px-3 py-2">
          <span className="text-sm font-medium text-[var(--rh-foreground)]">@{xHandle}</span>
          {verified ? (
            <Image src="/verified-badge.png" alt="Verified" width={14} height={14} className="h-3.5 w-3.5 shrink-0" />
          ) : null}
        </div>
        <p className="text-[11px] leading-relaxed text-[var(--rh-muted)]">
          Linked — your handle and verified badge show on listings and leaderboard.
        </p>
      </div>
    );
  }

  if (hasXAccount && syncing) {
    return (
      <div className="space-y-2">
        <p className="hyre-label">X account</p>
        <p className="text-xs text-[var(--rh-muted)]">Syncing your X handle…</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div>
        <p className="hyre-label">X account</p>
        <p className="mt-1 text-xs leading-relaxed text-[var(--rh-muted)]">
          Optional. Connect X for the blue verified badge and your handle on cards.
        </p>
      </div>
      <button
        type="button"
        onClick={() => void onConnect()}
        disabled={loading}
        className="btn-rh-secondary w-full sm:w-auto disabled:opacity-50"
      >
        {loading ? "Redirecting…" : "Connect with X"}
      </button>
      {error ? <p className="text-xs text-rose-300">{error}</p> : null}
    </div>
  );
}
