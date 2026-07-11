"use client";

import { useMemo, useState, type ReactNode } from "react";

export type ListingTabId = "description" | "rules" | "access" | "reviews";

export type ListingTabSpec = {
  id: ListingTabId;
  label: string;
  content: ReactNode;
};

type Props = {
  tabs: ListingTabSpec[];
  defaultId?: ListingTabId;
};

export function ListingDetailTabs({ tabs, defaultId }: Props) {
  const initial = useMemo(() => {
    if (tabs.length === 0) return null;
    if (defaultId && tabs.some((t) => t.id === defaultId)) return defaultId;
    return tabs[0]!.id;
  }, [tabs, defaultId]);

  const [active, setActive] = useState<ListingTabId | null>(initial);

  if (tabs.length === 0) return null;

  const current = tabs.find((t) => t.id === active) ?? tabs[0]!;

  if (tabs.length === 1) {
    return (
      <section className="card-rh" aria-label="Listing details">
        <div className="border-b border-[var(--rh-border)] px-4 py-3 sm:px-5">
          <p className="ui-form-label">{current.label}</p>
        </div>
        <div className="px-4 py-4 text-sm leading-relaxed text-[var(--rh-muted)] sm:px-5 sm:py-5">
          {current.content}
        </div>
      </section>
    );
  }

  return (
    <section className="card-rh" aria-label="Listing details">
      <div className="border-b border-[var(--rh-border)] px-3 py-2 sm:px-4">
        <div
          role="tablist"
          aria-label="Section"
          className="lb-scroll flex gap-1 overflow-x-auto pb-0.5"
        >
          {tabs.map((t) => {
            const isSel = t.id === active;
            return (
              <button
                key={t.id}
                type="button"
                role="tab"
                id={`tab-${t.id}`}
                aria-selected={isSel}
                aria-controls={`panel-${t.id}`}
                tabIndex={isSel ? 0 : -1}
                onClick={() => setActive(t.id)}
                className={`dash-pill shrink-0 ${isSel ? "dash-pill--active" : "dash-pill--idle"}`}
              >
                {t.label}
              </button>
            );
          })}
        </div>
      </div>
      <div
        role="tabpanel"
        id={`panel-${current.id}`}
        aria-labelledby={`tab-${current.id}`}
        className="px-4 py-3.5 text-sm leading-relaxed text-[var(--rh-muted)] sm:px-5 sm:py-4"
      >
        {current.content}
      </div>
    </section>
  );
}
