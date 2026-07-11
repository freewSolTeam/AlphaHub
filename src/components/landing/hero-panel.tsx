import { RobinhoodChainMark } from "@/components/robinhood-chain-mark";
import { ArrowUpRight, CheckCircle2, Lock, Zap } from "lucide-react";

export function LandingHeroPanel() {
  return (
    <div className="landing-hero-panel relative mx-auto w-full max-w-lg lg:max-w-none">
      <div className="landing-hero-panel-glow pointer-events-none absolute -inset-8 rounded-full" aria-hidden />

      <div className="landing-hero-panel-card relative overflow-hidden rounded-2xl border border-white/10 bg-rh-surface/60 p-1 backdrop-blur-xl">
        <div className="flex items-center justify-between border-b border-white/8 px-4 py-3">
          <div className="flex items-center gap-2">
            <RobinhoodChainMark className="h-4 w-4 text-brand" />
            <span className="font-brand text-xs font-bold tracking-wide text-white">AlphaHub Protocol</span>
          </div>
          <span className="landing-live-dot inline-flex items-center gap-1.5 rounded-full border border-brand/20 bg-brand/8 px-2.5 py-1 text-[10px] font-medium text-brand">
            <span className="h-1.5 w-1.5 rounded-full bg-brand" />
            Live
          </span>
        </div>

        <div className="space-y-3 p-4">
          <div className="rounded-xl border border-white/8 bg-rh-black/50 p-4">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-stone-500">Contract tx</p>
              <span className="text-[10px] text-brand">Confirmed</span>
            </div>
            <p className="font-brand mt-2 text-2xl font-bold tabular-nums text-white">
              2.50 <span className="text-sm text-stone-500">RH</span>
            </p>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/6">
              <div className="landing-progress-bar h-full w-full rounded-full" />
            </div>
            <div className="mt-3 flex items-center gap-2 text-[11px] text-stone-500">
              <CheckCircle2 className="h-3.5 w-3.5 text-brand" />
              Access unlocked · Telegram invite sent
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-white/8 bg-rh-black/40 p-3">
              <div className="flex items-center gap-2">
                <Lock className="h-3.5 w-3.5 text-stone-500" />
                <span className="text-[10px] uppercase tracking-wider text-stone-500">Public tier</span>
              </div>
              <p className="font-brand mt-2 text-sm font-bold text-white">Free access</p>
            </div>
            <div className="rounded-xl border border-brand/20 bg-brand/5 p-3">
              <div className="flex items-center gap-2">
                <Zap className="h-3.5 w-3.5 text-brand" />
                <span className="text-[10px] uppercase tracking-wider text-brand">VIP tier</span>
              </div>
              <p className="font-brand mt-2 text-sm font-bold text-brand">Contract gated</p>
            </div>
          </div>

          <div className="rounded-xl border border-white/8 bg-rh-black/30 p-3">
            <div className="flex items-center justify-between text-[10px] text-stone-500">
              <span>Operator payout</span>
              <span className="text-stone-400">Block #48291</span>
            </div>
            <div className="mt-2 flex items-center justify-between">
              <span className="font-mono text-xs text-stone-300">0x7f3a…c91e</span>
              <ArrowUpRight className="h-3.5 w-3.5 text-brand" />
            </div>
          </div>
        </div>
      </div>

      <div className="landing-hero-float landing-hero-float--a pointer-events-none absolute -left-4 top-1/4 hidden rounded-xl border border-white/10 bg-rh-elevated/80 px-3 py-2 backdrop-blur-md sm:block">
        <p className="text-[10px] uppercase tracking-widest text-stone-500">Settlement</p>
        <p className="font-brand text-sm font-bold text-brand">&lt; 3s</p>
      </div>
      <div className="landing-hero-float landing-hero-float--b pointer-events-none absolute -right-2 bottom-8 hidden rounded-xl border border-white/10 bg-rh-elevated/80 px-3 py-2 backdrop-blur-md sm:block">
        <p className="text-[10px] uppercase tracking-widest text-stone-500">On-chain</p>
        <p className="font-brand text-sm font-bold text-white">Verified</p>
      </div>
    </div>
  );
}
