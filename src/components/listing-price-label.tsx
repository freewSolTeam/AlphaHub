import { formatListingPrice, shouldShowCurrencyMark } from "@/lib/listing-price";
import { RobinhoodChainMark } from "@/components/robinhood-chain-mark";
import type { Project } from "@prisma/client";

type PriceOpts = { priceAmount: number }[] | null | undefined;

type P = Pick<Project, "id" | "groupType" | "accessType" | "priceAmount" | "priceCurrency">;

type Props = {
  project: P;
  priceOptions?: PriceOpts;
  className?: string;
  textClassName?: string;
  compact?: boolean;
  largeMark?: boolean;
};

/** Renders price with Robinhood Chain mark when priced in native token. */
export function ListingPriceLabel({ project, priceOptions, className, textClassName, compact, largeMark }: Props) {
  const label = formatListingPrice(project, priceOptions);
  const show = shouldShowCurrencyMark(project, label);
  const markClass = largeMark
    ? "h-3 w-3 shrink-0 text-brand sm:h-3.5 sm:w-3.5"
    : compact
      ? "h-1.5 w-1.5 shrink-0 text-brand sm:h-2 sm:w-2"
      : "h-2 w-2 shrink-0 text-brand sm:h-2.5 sm:w-2.5";
  if (!show) {
    return <span className={textClassName}>{label}</span>;
  }
  return (
    <span className={`inline-flex min-w-0 items-center gap-0.5 sm:gap-1 ${className ?? ""}`}>
      <RobinhoodChainMark className={markClass} />
      <span className={textClassName}>{label}</span>
    </span>
  );
}
