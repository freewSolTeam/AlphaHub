import { DashboardWalletSettings } from "@/components/dashboard/dashboard-wallet-settings";
import { DashboardXLink } from "@/components/dashboard/dashboard-x-link";
import { shortWalletAddress } from "@/lib/wallet-display";
import Image from "next/image";

type Props = {
  name: string | null;
  image: string | null;
  blueCheckmark: boolean;
  xHandle: string | null;
  hasXAccount: boolean;
  loginWallet: string | null;
  payoutWallet: string | null;
  totalProjects: number;
  paidCount: number;
};

export function DashboardSettingsPanel({
  name,
  image,
  blueCheckmark,
  xHandle,
  hasXAccount,
  loginWallet,
  payoutWallet,
  totalProjects,
  paidCount,
}: Props) {
  const displayName = loginWallet ? shortWalletAddress(loginWallet, 6, 4) : name || "Operator";

  return (
    <section className="scroll-mt-20 card-rh">
      <div className="relative overflow-hidden border-b border-[var(--rh-border)] px-5 py-4 sm:px-6 sm:py-5">
        <div className="page-hero-glow pointer-events-none absolute inset-0 opacity-25" aria-hidden />
        <div className="relative">
          <p className="ui-page-eyebrow">Settings</p>
          <div className="mt-3 flex flex-wrap items-center gap-4">
            {image ? (
              <Image
                src={image}
                width={52}
                height={52}
                className="h-[52px] w-[52px] shrink-0 rounded border border-[var(--rh-border)] object-cover"
                alt=""
              />
            ) : (
              <div className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded border border-[var(--rh-border)] bg-[var(--rh-surface-elevated)] font-brand text-base text-brand">
                {displayName.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="flex flex-wrap items-center gap-2 text-base font-semibold text-[var(--rh-foreground)]">
                <span>{displayName}</span>
                {blueCheckmark ? (
                  <Image src="/verified-badge.png" alt="Verified" width={14} height={14} className="h-3.5 w-3.5 shrink-0" />
                ) : null}
                {xHandle ? (
                  <span className="font-mono text-[11px] font-normal uppercase tracking-[0.1em] text-brand">@{xHandle}</span>
                ) : null}
              </p>
              <p className="mt-1 text-xs text-[var(--rh-muted)]">
                {totalProjects} listing{totalProjects === 1 ? "" : "s"} · {paidCount} paid
                {loginWallet ? (
                  <>
                    {" "}
                    · <span className="font-mono text-[var(--rh-foreground)]">{shortWalletAddress(loginWallet, 8, 6)}</span>
                  </>
                ) : null}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 lg:divide-x lg:divide-[var(--rh-border)]">
        <div className="border-b border-[var(--rh-border)] px-5 py-5 sm:px-6 lg:border-b-0">
          <DashboardXLink xHandle={xHandle} hasXAccount={hasXAccount} verified={blueCheckmark} />
        </div>
        <div className="px-5 py-5 sm:px-6">
          <DashboardWalletSettings loginWallet={loginWallet} payoutWallet={payoutWallet} />
        </div>
      </div>
    </section>
  );
}
