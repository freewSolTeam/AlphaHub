import type { Project } from "@prisma/client";
import {
  formatAmountWithCurrency,
  resolvePriceCurrency,
  type PriceCurrency,
} from "@/lib/payment-currency";

export type StoredPriceCurrency = PriceCurrency;
export type DisplayCurrency = PriceCurrency;

export { resolvePriceCurrency, type PriceCurrency } from "@/lib/payment-currency";

export function displayCurrency(): DisplayCurrency {
  return "USDG";
}

/**
 * Short price label for tables and cards. Public calls: hide price (—).
 * With multiple `priceOptions`, shows "from X" using the minimum tier.
 */
export function formatListingPrice(
  p: {
    groupType: string;
    accessType: string;
    priceAmount: number | null;
    priceCurrency: string | null;
  },
  priceOptions?: { priceAmount: number }[] | null,
): string {
  const currency = resolvePriceCurrency(p.priceCurrency);
  if (p.groupType === "PUBLIC") return "—";
  if (p.accessType !== "PAID") return "Free";
  const tiers = priceOptions?.filter((o) => o.priceAmount > 0) ?? [];
  if (tiers.length > 1) {
    const min = Math.min(...tiers.map((o) => o.priceAmount));
    return `from ${formatAmountWithCurrency(min, currency)}`;
  }
  if (tiers.length === 1) {
    return formatAmountWithCurrency(tiers[0].priceAmount, currency);
  }
  return formatAmountWithCurrency(p.priceAmount ?? 0, currency);
}

/** Private + paid + price &gt; 0 → on-chain checkout allowed. */
export function escrowEligible(
  p: Pick<Project, "groupType" | "accessType" | "priceAmount" | "priceCurrency">,
  priceOptions?: { priceAmount: number }[] | null,
): boolean {
  if (p.groupType !== "PRIVATE" || p.accessType !== "PAID") return false;
  const tiers = priceOptions?.filter((o) => o.priceAmount > 0) ?? [];
  if (tiers.length > 0) {
    return Math.min(...tiers.map((o) => o.priceAmount)) > 0;
  }
  if (!p.priceAmount || p.priceAmount <= 0) return false;
  return true;
}

/** When true, show the Robinhood Chain mark beside a formatted price label. */
export function shouldShowCurrencyMark(
  p: {
    groupType: string;
    accessType: string;
    priceCurrency: string | null;
  },
  label: string,
): boolean {
  if (label === "—" || label === "Free") return false;
  return p.accessType === "PAID" && p.groupType !== "PUBLIC";
}

export function formatEscrowAmountLabel(
  amount: number,
  currency?: StoredPriceCurrency | DisplayCurrency | string | null,
): string {
  return formatAmountWithCurrency(amount, resolvePriceCurrency(currency));
}
