"use client";

import { useEffect, useState } from "react";

export type DocsNavItem = {
  id: string;
  label: string;
  num: string;
};

export type DocsNavGroup = {
  title: string;
  items: DocsNavItem[];
};

function useDocsNavActive(items: DocsNavItem[]) {
  const [active, setActive] = useState(items[0]?.id ?? "");

  useEffect(() => {
    const sections = items
      .map((item) => document.getElementById(item.id))
      .filter((el): el is HTMLElement => el != null);

    if (sections.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);

        const id = visible[0]?.target.id;
        if (id) setActive(id);
      },
      { rootMargin: "-20% 0px -58% 0px", threshold: [0, 0.12, 0.3, 0.55] },
    );

    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, [items]);

  return active;
}

export function DocsNavRail({ groups }: { groups: DocsNavGroup[] }) {
  const items = groups.flatMap((g) => g.items);
  const active = useDocsNavActive(items);

  return (
    <div className="docs-nav-rail-wrap lg:hidden">
      <nav className="docs-nav-rail" aria-label="Documentation sections">
        <div className="docs-nav-rail-track">
          {items.map((item) => (
            <a
              key={item.id}
              href={`#${item.id}`}
              className={active === item.id ? "docs-nav-rail-link docs-nav-link--active" : "docs-nav-rail-link"}
              aria-current={active === item.id ? "location" : undefined}
            >
              <span className="docs-nav-rail-num">{item.num}</span>
              <span>{item.label}</span>
            </a>
          ))}
        </div>
      </nav>
    </div>
  );
}

export function DocsNavSidebar({ groups }: { groups: DocsNavGroup[] }) {
  const items = groups.flatMap((g) => g.items);
  const active = useDocsNavActive(items);

  return (
    <nav className="card-rh p-3 sm:p-4" aria-label="Documentation sections">
      <p className="hyre-label mb-4">Guide</p>
      <div className="space-y-4">
        {groups.map((group) => (
          <div key={group.title}>
            <p className="docs-nav-group-title">{group.title}</p>
            <ul className="mt-1.5 space-y-0.5">
              {group.items.map((item) => (
                <li key={item.id}>
                  <a
                    href={`#${item.id}`}
                    className={active === item.id ? "docs-nav-link docs-nav-link--active" : "docs-nav-link"}
                    aria-current={active === item.id ? "location" : undefined}
                  >
                    <span className="docs-nav-num">{item.num}</span>
                    <span className="min-w-0 truncate">{item.label}</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </nav>
  );
}

/** @deprecated Use DocsNavRail + DocsNavSidebar */
export function DocsNav({ groups }: { groups: DocsNavGroup[] }) {
  return (
    <>
      <DocsNavRail groups={groups} />
      <div className="hidden lg:block">
        <DocsNavSidebar groups={groups} />
      </div>
    </>
  );
}
