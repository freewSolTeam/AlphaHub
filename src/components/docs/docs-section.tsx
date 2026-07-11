import type { ReactNode } from "react";

type Props = {
  id: string;
  num: string;
  title: string;
  subtitle?: string;
  children: ReactNode;
};

export function DocsSection({ id, num, title, subtitle, children }: Props) {
  return (
    <section id={id} className="doc-card docs-section scroll-mt-28 card-rh lg:scroll-mt-24">
      <header className="docs-section-header border-b border-[var(--rh-border)] px-4 py-4 sm:px-6 sm:py-5">
        <div className="docs-section-header-inner flex items-start gap-3 sm:gap-4">
          <span className="docs-section-num" aria-hidden>
            {num}
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="text-base font-semibold tracking-tight text-[var(--rh-foreground)] sm:text-lg">{title}</h2>
            {subtitle ? (
              <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-[var(--rh-muted)]">{subtitle}</p>
            ) : null}
          </div>
        </div>
      </header>
      <div className="docs-prose p-4 sm:p-6">{children}</div>
    </section>
  );
}

export function DocsField({ children }: { children: ReactNode }) {
  return (
    <span className="docs-field-pill font-mono text-[10px] uppercase tracking-[0.06em] text-[var(--rh-foreground)]">
      {children}
    </span>
  );
}

export function DocsCallout({ title, children }: { title: string; children: ReactNode }) {
  return (
    <aside className="docs-callout border border-brand/20 bg-brand/5 p-4">
      <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-brand">{title}</p>
      <div className="mt-2 text-sm leading-relaxed text-[var(--rh-muted)]">{children}</div>
    </aside>
  );
}
