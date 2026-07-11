type Metric = {
  value: string;
  label: string;
  hint: string;
};

export function LandingMetrics({ metrics }: { metrics: Metric[] }) {
  return (
    <section className="landing-section border-t border-[var(--landing-border)]">
      <div className="landing-wrap">
        <p className="hyre-label">Live platform metrics</p>
        <div className="hyre-metrics-grid mt-10 grid gap-px border border-[var(--landing-border)] bg-[var(--landing-border)] sm:grid-cols-2 lg:grid-cols-4">
          {metrics.map((m) => (
            <div key={m.label} className="hyre-metric-cell bg-[var(--landing-surface)] px-6 py-8 sm:px-8">
              <p className="hyre-metric-value">{m.value}</p>
              <p className="hyre-metric-label">{m.label}</p>
              <p className="hyre-metric-hint">{m.hint}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
