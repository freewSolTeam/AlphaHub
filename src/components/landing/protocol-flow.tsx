import { RobinhoodChainMark } from "@/components/robinhood-chain-mark";

const STEPS = [
  {
    step: "01",
    title: "List your Degen",
    body: "Create a listing with public or VIP tiers. Attach Telegram, Discord, and USDG pricing in minutes.",
  },
  {
    step: "02",
    title: "Buyers check out on-chain",
    body: "Members discover you in the directory and pay through a Robinhood Chain smart contract — no invoice chasing.",
  },
  {
    step: "03",
    title: "Access unlocks instantly",
    body: "Invite links deliver on confirmation. Settlement hits your wallet. You focus on alpha, not admin.",
  },
];

export function LandingProtocolFlow() {
  return (
    <div className="landing-flow mt-12">
      <div className="grid gap-px border border-[var(--landing-border)] bg-[var(--landing-border)] lg:grid-cols-3">
        {STEPS.map((s, i) => (
          <article key={s.step} className="bg-[var(--landing-surface)] p-6 sm:p-8">
            <div className="flex items-center justify-between gap-3">
              <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--landing-accent)]">
                {s.step}
              </span>
              {i < STEPS.length - 1 ? (
                <RobinhoodChainMark className="hidden h-4 w-4 text-[var(--landing-accent)]/40 lg:block" />
              ) : null}
            </div>
            <h3 className="mt-5 text-lg font-semibold tracking-tight text-[var(--landing-text)]">{s.title}</h3>
            <p className="mt-3 text-sm leading-relaxed text-[var(--landing-muted)]">{s.body}</p>
          </article>
        ))}
      </div>
    </div>
  );
}
