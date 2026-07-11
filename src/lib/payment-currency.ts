import { formatEther, formatUnits, parseEther, parseUnits } from "viem";

/** Checkout currencies on Robinhood Chain. */
export type PriceCurrency = "USDG" | "ETH";

/** Canonical USDG on Robinhood Chain — https://docs.robinhood.com/chain/contracts/ */
export const USDG_TOKEN_ADDRESS = "0x5fc5360D0400a0Fd4f2af552ADD042D716F1d168" as const;

export const USDG_DECIMALS = 6;
export const ETH_DECIMALS = 18;

export const PRICE_CURRENCIES: readonly PriceCurrency[] = ["USDG", "ETH"] as const;

export function isPriceCurrency(v: string | null | undefined): v is PriceCurrency {
  return v === "USDG" || v === "ETH";
}

export function resolvePriceCurrency(c?: string | null): PriceCurrency {
  return c === "ETH" ? "ETH" : "USDG";
}

export function currencyLabel(c: PriceCurrency): string {
  return c;
}

export function formatAmountWithCurrency(amount: number, currency: PriceCurrency): string {
  const decimals = currency === "ETH" ? 6 : 2;
  const s =
    amount % 1 === 0 ? String(amount) : amount.toFixed(decimals).replace(/\.?0+$/, "");
  return `${s} ${currency}`;
}

/** Convert a human listing price to on-chain units for payment verification. */
export function toPaymentUnits(amount: number, currency: PriceCurrency): bigint {
  return currency === "ETH"
    ? parseEther(String(amount))
    : parseUnits(String(amount), USDG_DECIMALS);
}

export function paymentUnitsSatisfyAmount(received: bigint, expectedAmount: number, currency: PriceCurrency): boolean {
  return received >= toPaymentUnits(expectedAmount, currency);
}

export function formatPaymentUnits(units: bigint, currency: PriceCurrency): string {
  const n =
    currency === "ETH"
      ? Number(formatEther(units))
      : Number(formatUnits(units, USDG_DECIMALS));
  return formatAmountWithCurrency(n, currency);
}
