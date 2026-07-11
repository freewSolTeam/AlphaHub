"use client";

import { DecimalPriceInput } from "@/components/decimal-price-input";
import { PRICE_CURRENCIES } from "@/lib/payment-currency";
import type { ProjectForm } from "@/lib/project-schema";

const rowClass = "ui-form-input";

type Row = NonNullable<ProjectForm["priceOptions"]>[number];

function defaultRow(sortOrder: number): Row {
  return {
    label: "",
    priceAmount: 0.1,
    sortOrder,
    telegramUrl: undefined,
    discordUrl: undefined,
    accessDurationDays: undefined,
    discordRoleId: undefined,
  };
}

type Props = {
  value: Row[];
  onChange: (next: Row[]) => void;
  priceCurrency: ProjectForm["priceCurrency"];
  onCurrencyChange: (c: ProjectForm["priceCurrency"]) => void;
  showCurrency: boolean;
  /** e.g. sm:col-span-2 */
  className?: string;
};

export function PriceOptionsField({
  value,
  onChange,
  priceCurrency,
  onCurrencyChange,
  showCurrency,
  className = "",
}: Props) {
  function update(i: number, patch: Partial<Row>) {
    onChange(
      value.map((r, j) => (j === i ? { ...r, ...patch, priceAmount: patch.priceAmount ?? r.priceAmount } : r)),
    );
  }

  function addRow() {
    onChange([...value, defaultRow(value.length)]);
  }

  function removeRow(i: number) {
    onChange(value.filter((_, j) => j !== i));
  }

  return (
    <div className={className}>
      <p className="ui-form-hint">
        Per tier: optional Telegram/Discord links (overrides the listing default for buyers who pick this tier).
        <span className="text-[var(--rh-subtle)]">
          {" "}
          Set access duration in days for expiry + future Telegram kick / Discord role automation via your own bots
          (Role ID = server role the buyer should get).
        </span>
      </p>
      {showCurrency && (
        <div className="mt-2 max-w-xs">
          <span className="ui-form-label">Currency (all tiers)</span>
          <select
            value={priceCurrency}
            onChange={(e) => onCurrencyChange(e.target.value as ProjectForm["priceCurrency"])}
            className={`${rowClass} mt-0.5`}
          >
            {PRICE_CURRENCIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      )}
      <div className="mt-2 space-y-3">
        {value.length === 0 ? (
          <p className="ui-form-hint">No tiers yet — use the button below or fill the single price above.</p>
        ) : (
          value.map((row, i) => (
            <div
              key={row.id ?? `new-${i}`}
              className="space-y-3 rounded border border-[var(--rh-border)] bg-[var(--rh-surface-elevated)] p-3"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:gap-2">
                <div className="min-w-0 flex-1">
                  <label className="ui-form-label mb-2">Label</label>
                  <input
                    className={rowClass}
                    value={row.label}
                    onChange={(e) => update(i, { label: e.target.value })}
                    placeholder="e.g. 1 week, 1 month"
                  />
                </div>
                <div className="w-full sm:w-28">
                  <label className="ui-form-label mb-2">Price</label>
                  <DecimalPriceInput
                    className={rowClass}
                    value={row.priceAmount}
                    onValueChange={(n) => update(i, { priceAmount: n ?? 0 })}
                    placeholder="0.002"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => removeRow(i)}
                  className="btn-rh-ghost shrink-0 self-end !px-2 !py-1 text-xs"
                >
                  Remove
                </button>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="ui-form-label mb-2">Telegram (tier, optional)</label>
                  <input
                    className={rowClass}
                    value={row.telegramUrl ?? ""}
                    onChange={(e) => update(i, { telegramUrl: e.target.value || undefined })}
                    placeholder="https://t.me/+…"
                  />
                </div>
                <div>
                  <label className="ui-form-label mb-2">Discord invite (optional)</label>
                  <input
                    className={rowClass}
                    value={row.discordUrl ?? ""}
                    onChange={(e) => update(i, { discordUrl: e.target.value || undefined })}
                    placeholder="https://discord.gg/…"
                  />
                </div>
                <div>
                  <label className="ui-form-label mb-2">Access days (optional)</label>
                  <input
                    type="number"
                    min={0}
                    max={3650}
                    className={rowClass}
                    value={row.accessDurationDays === undefined || row.accessDurationDays === 0 ? "" : row.accessDurationDays}
                    onChange={(e) => {
                      const v = e.target.value;
                      if (v === "") return update(i, { accessDurationDays: undefined });
                      const n = parseInt(v, 10);
                      if (!Number.isNaN(n) && n >= 0) update(i, { accessDurationDays: n > 0 ? n : undefined });
                    }}
                    placeholder="e.g. 7, 30 — leave empty = no auto-expiry"
                  />
                </div>
                <div>
                  <label className="ui-form-label mb-2">Discord role ID (optional)</label>
                  <input
                    className={rowClass}
                    value={row.discordRoleId ?? ""}
                    onChange={(e) => update(i, { discordRoleId: e.target.value.trim() || undefined })}
                    placeholder="Server role for your bot to grant"
                  />
                </div>
              </div>
            </div>
          ))
        )}
        <button
          type="button"
          onClick={addRow}
          className="w-full rounded border border-dashed border-[var(--rh-border)] px-3 py-2 text-xs text-[var(--rh-muted)] transition hover:border-brand/30 hover:text-brand"
        >
          + Add access tier
        </button>
      </div>
    </div>
  );
}
