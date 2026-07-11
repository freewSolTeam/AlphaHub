const QUOTES = [
  {
    quote:
      "AlphaHub replaced our messy invite links and payment DMs with a clean directory and on-chain checkout. Members trust it more.",
    name: "Alpha Syndicate",
    role: "VIP Degen operator",
  },
  {
    quote:
      "Listing once and getting paid in USDG on Robinhood Chain is the workflow we needed — discovery and access in the same place.",
    name: "Degen Club",
    role: "Private alpha host",
  },
  {
    quote:
      "Public tiers for reach, VIP tiers for revenue. The multi-tier setup finally matches how real Degens actually run.",
    name: "Signal Desk",
    role: "Telegram operator",
  },
];

export function LandingSocialProof() {
  return (
    <section className="landing-section border-t border-[var(--landing-border)]">
      <div className="landing-wrap">
        <p className="hyre-label">From operators</p>
        <h2 className="hyre-section-title mt-3 max-w-2xl">Built for Degens who sell access — not just post links.</h2>
        <div className="mt-10 grid gap-px border border-[var(--landing-border)] bg-[var(--landing-border)] lg:grid-cols-3">
          {QUOTES.map((q) => (
            <figure key={q.name + q.role} className="hyre-quote-cell bg-[var(--landing-surface)] p-6 sm:p-8">
              <blockquote className="text-sm leading-relaxed text-[var(--landing-muted)]">&ldquo;{q.quote}&rdquo;</blockquote>
              <figcaption className="mt-6 border-t border-[var(--landing-border)] pt-4">
                <p className="text-sm font-medium text-[var(--landing-text)]">{q.name}</p>
                <p className="mt-0.5 text-xs text-[var(--landing-muted)]">{q.role}</p>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
