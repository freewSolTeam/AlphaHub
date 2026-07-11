"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { ChevronDown, Loader2, Search, SlidersHorizontal, X } from "lucide-react";

type Props = {
  q: string;
  platform: "ALL" | "TELEGRAM" | "DISCORD";
  type: "ALL" | "PUBLIC" | "PRIVATE";
  access: "ALL" | "FREE" | "PAID";
  sort: "newest" | "oldest" | "price_asc" | "price_desc";
  minPrice: string;
  maxPrice: string;
  hasActiveFilters: boolean;
};

type FilterValues = {
  q: string;
  platform: string;
  type: string;
  access: string;
  sort: string;
  minPrice: string;
  maxPrice: string;
};

const ACCESS_OPTIONS = [
  { value: "ALL", label: "All access" },
  { value: "FREE", label: "Open" },
  { value: "PAID", label: "VIP" },
] as const;

const PLATFORM_OPTIONS = [
  { value: "ALL", label: "All platforms" },
  { value: "TELEGRAM", label: "Telegram" },
  { value: "DISCORD", label: "Discord" },
] as const;

const SEARCH_DEBOUNCE_MS = 180;
const PRICE_DEBOUNCE_MS = 400;

function buildQueryString(v: FilterValues): string {
  const params = new URLSearchParams();
  const q = v.q.trim();
  if (q) params.set("q", q);
  if (v.platform !== "ALL") params.set("platform", v.platform);
  if (v.type !== "ALL") params.set("type", v.type);
  if (v.access !== "ALL") params.set("access", v.access);
  if (v.sort !== "newest") params.set("sort", v.sort);
  if (v.minPrice.trim()) params.set("minPrice", v.minPrice.trim());
  if (v.maxPrice.trim()) params.set("maxPrice", v.maxPrice.trim());
  return params.toString();
}

function FilterPill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button type="button" onClick={onClick} className={`explore-pill ${active ? "explore-pill--active" : ""}`}>
      {children}
    </button>
  );
}

export function ExploreFilters({
  q,
  platform,
  type,
  access,
  sort,
  minPrice,
  maxPrice,
  hasActiveFilters,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [query, setQuery] = useState(q);
  const [platformValue, setPlatformValue] = useState(platform);
  const [typeValue, setTypeValue] = useState(type);
  const [accessValue, setAccessValue] = useState(access);
  const [sortValue, setSortValue] = useState(sort);
  const [minValue, setMinValue] = useState(minPrice);
  const [maxValue, setMaxValue] = useState(maxPrice);
  const [showAdvanced, setShowAdvanced] = useState(
    type !== "ALL" || sort !== "newest" || Boolean(minPrice) || Boolean(maxPrice),
  );

  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const priceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const currentValues = useCallback(
    (): FilterValues => ({
      q: query,
      platform: platformValue,
      type: typeValue,
      access: accessValue,
      sort: sortValue,
      minPrice: minValue,
      maxPrice: maxValue,
    }),
    [query, platformValue, typeValue, accessValue, sortValue, minValue, maxValue],
  );

  const valuesRef = useRef<FilterValues>({
    q: "",
    platform: "ALL",
    type: "ALL",
    access: "ALL",
    sort: "newest",
    minPrice: "",
    maxPrice: "",
  });

  useEffect(() => {
    valuesRef.current = {
      q: query,
      platform: platformValue,
      type: typeValue,
      access: accessValue,
      sort: sortValue,
      minPrice: minValue,
      maxPrice: maxValue,
    };
  }, [query, platformValue, typeValue, accessValue, sortValue, minValue, maxValue]);

  const applyIfChanged = useCallback(
    (next: FilterValues) => {
      const qs = buildQueryString(next);
      const current = searchParams.toString();
      if (qs === current) return;
      startTransition(() => {
        router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
      });
    },
    [pathname, router, searchParams, startTransition],
  );

  const applyNow = useCallback(
    (patch?: Partial<FilterValues>) => {
      if (searchTimer.current) clearTimeout(searchTimer.current);
      if (priceTimer.current) clearTimeout(priceTimer.current);
      applyIfChanged({ ...currentValues(), ...patch });
    },
    [applyIfChanged, currentValues],
  );

  // Sync local draft when URL changes (browser back/forward) without remounting the search field.
  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect -- URL is source of truth on navigation */
    setQuery(q);
    setPlatformValue(platform);
    setTypeValue(type);
    setAccessValue(access);
    setSortValue(sort);
    setMinValue(minPrice);
    setMaxValue(maxPrice);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [q, platform, type, access, sort, minPrice, maxPrice]);

  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      applyIfChanged(valuesRef.current);
    }, SEARCH_DEBOUNCE_MS);
    return () => {
      if (searchTimer.current) clearTimeout(searchTimer.current);
    };
  }, [query, applyIfChanged]);

  useEffect(() => {
    if (priceTimer.current) clearTimeout(priceTimer.current);
    priceTimer.current = setTimeout(() => {
      applyIfChanged(valuesRef.current);
    }, PRICE_DEBOUNCE_MS);
    return () => {
      if (priceTimer.current) clearTimeout(priceTimer.current);
    };
  }, [minValue, maxValue, applyIfChanged]);

  const applyInstant = (changes: Partial<FilterValues>) => {
    if (changes.platform != null) setPlatformValue(changes.platform as Props["platform"]);
    if (changes.type != null) setTypeValue(changes.type as Props["type"]);
    if (changes.access != null) setAccessValue(changes.access as Props["access"]);
    if (changes.sort != null) setSortValue(changes.sort as Props["sort"]);
    applyNow(changes);
  };

  return (
    <div className="explore-filter-bar explore-filter-bar--compact card-rh">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:gap-4">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--rh-muted)]" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                applyNow();
              }
            }}
            type="search"
            placeholder="Search title, operator, category…"
            className="ui-filter-input h-9 w-full py-2 pl-9 pr-9 text-sm"
            aria-busy={isPending}
          />
          {isPending ? (
            <Loader2 className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 animate-spin text-brand" />
          ) : null}
        </div>

        {hasActiveFilters ? (
          <Link href="/explore" className="btn-rh-ghost shrink-0 !gap-1.5 !px-2 !py-1.5 text-xs">
            <X className="h-3 w-3" />
            Clear
          </Link>
        ) : null}

        <button
          type="button"
          onClick={() => setShowAdvanced((v) => !v)}
          className={`explore-pill inline-flex shrink-0 items-center gap-1.5 ${showAdvanced ? "explore-pill--active" : ""}`}
        >
          <SlidersHorizontal className="h-3 w-3" />
          Filters
          <ChevronDown className={`h-3 w-3 transition ${showAdvanced ? "rotate-180" : ""}`} />
        </button>

        <div className="lb-scroll flex gap-1.5 overflow-x-auto pb-0.5 lg:shrink-0">
          {ACCESS_OPTIONS.map((opt) => (
            <FilterPill
              key={opt.value}
              active={accessValue === opt.value}
              onClick={() => applyInstant({ access: opt.value })}
            >
              {opt.label}
            </FilterPill>
          ))}
          {PLATFORM_OPTIONS.map((opt) => (
            <FilterPill
              key={opt.value}
              active={platformValue === opt.value}
              onClick={() => applyInstant({ platform: opt.value })}
            >
              {opt.label}
            </FilterPill>
          ))}
        </div>
      </div>

      {showAdvanced ? (
        <div className="mt-3 grid grid-cols-2 gap-2 border-t border-[var(--rh-border)] pt-3 sm:grid-cols-4 lg:grid-cols-4">
          <div>
            <label className="ui-form-label mb-1">Type</label>
            <select
              value={typeValue}
              onChange={(e) => applyInstant({ type: e.target.value })}
              className="ui-filter-select h-8 w-full px-2 text-xs"
            >
              <option value="ALL">All</option>
              <option value="PUBLIC">Public</option>
              <option value="PRIVATE">Private</option>
            </select>
          </div>
          <div>
            <label className="ui-form-label mb-1">Sort</label>
            <select
              value={sortValue}
              onChange={(e) => applyInstant({ sort: e.target.value })}
              className="ui-filter-select h-8 w-full px-2 text-xs"
            >
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
              <option value="price_asc">Price ↑</option>
              <option value="price_desc">Price ↓</option>
            </select>
          </div>
          <div>
            <label className="ui-form-label mb-1">Min price</label>
            <input
              type="number"
              min={0}
              step="0.01"
              value={minValue}
              onChange={(e) => setMinValue(e.target.value)}
              placeholder="0"
              className="ui-filter-input h-8 w-full px-2 text-xs"
            />
          </div>
          <div>
            <label className="ui-form-label mb-1">Max price</label>
            <input
              type="number"
              min={0}
              step="0.01"
              value={maxValue}
              onChange={(e) => setMaxValue(e.target.value)}
              placeholder="∞"
              className="ui-filter-input h-8 w-full px-2 text-xs"
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}
