import { getPlatformFee } from "@/lib/escrow-config";
import {
  formatAmountWithCurrency,
  resolvePriceCurrency,
  toPaymentUnits,
  type PriceCurrency,
} from "@/lib/payment-currency";

export type PlatformFeeOverrides = {
  usdgFee?: number;
  ethFee?: number;
};

/** How many USDG (≈ USD) equal 1 ETH at checkout. Override via env. */
export function getEthUsdRate(): number {
  const v =
    process.env.CHECKOUT_ETH_USDG_RATE?.trim() ||
    process.env.NEXT_PUBLIC_CHECKOUT_ETH_USDG_RATE?.trim() ||
    "3000";
  const n = Number(v);
  if (!Number.isFinite(n) || n <= 0) return 3000;
  return n;
}

export function roundPayAmountUp(amount: number, currency: PriceCurrency): number {
  const factor = currency === "ETH" ? 1e8 : 1e6;
  return Math.ceil(amount * factor) / factor;
}

export function convertBetweenCurrencies(
  amount: number,
  from: PriceCurrency,
  to: PriceCurrency,
): number {
  if (from === to) return amount;
  const rate = getEthUsdRate();
  if (from === "USDG" && to === "ETH") {
    return roundPayAmountUp(amount / rate, "ETH");
  }
  return roundPayAmountUp(amount * rate, "USDG");
}

/** Platform fee in the payment currency (deducted from seller payout). */
export function getPlatformFeeAmount(
  currency: PriceCurrency,
  overrides?: PlatformFeeOverrides,
): number {
  if (currency === "USDG") {
    const fee = overrides?.usdgFee ?? getPlatformFee();
    return roundPayAmountUp(fee, "USDG");
  }
  if (overrides?.ethFee != null && Number.isFinite(overrides.ethFee) && overrides.ethFee >= 0) {
    return roundPayAmountUp(overrides.ethFee, "ETH");
  }
  const override = process.env.PLATFORM_FEE_ETH?.trim();
  if (override) {
    const n = Number(override);
    if (Number.isFinite(n) && n >= 0) return roundPayAmountUp(n, "ETH");
  }
  const usdgBase = overrides?.usdgFee ?? getPlatformFee();
  return convertBetweenCurrencies(usdgBase, "USDG", "ETH");
}

export function platformFeeUnits(
  currency: PriceCurrency,
  overrides?: PlatformFeeOverrides,
): bigint {
  return toPaymentUnits(getPlatformFeeAmount(currency, overrides), currency);
}

export type CheckoutQuote = {
  listingCurrency: PriceCurrency;
  listingAmount: number;
  paymentCurrency: PriceCurrency;
  paymentAmount: number;
  platformFee: number;
  platformFeeCurrency: PriceCurrency;
  sellerReceives: number;
};

export function quoteCheckout(
  listingAmount: number,
  listingCurrency: PriceCurrency,
  paymentCurrency: PriceCurrency,
  feeOverrides?: PlatformFeeOverrides,
): CheckoutQuote {
  const listing = resolvePriceCurrency(listingCurrency);
  const payment = resolvePriceCurrency(paymentCurrency);
  const paymentAmount = convertBetweenCurrencies(listingAmount, listing, payment);
  const platformFee = getPlatformFeeAmount(payment, feeOverrides);
  const sellerReceives = Math.max(0, roundPayAmountUp(paymentAmount - platformFee, payment));

  return {
    listingCurrency: listing,
    listingAmount,
    paymentCurrency: payment,
    paymentAmount,
    platformFee,
    platformFeeCurrency: payment,
    sellerReceives,
  };
}

export function formatCheckoutQuoteSummary(q: CheckoutQuote): string {
  if (q.listingCurrency === q.paymentCurrency) {
    return formatAmountWithCurrency(q.paymentAmount, q.paymentCurrency);
  }
  return `${formatAmountWithCurrency(q.paymentAmount, q.paymentCurrency)} (≈ ${formatAmountWithCurrency(q.listingAmount, q.listingCurrency)} listed)`;
}
