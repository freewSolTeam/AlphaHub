import { RobinhoodChainMark } from "@/components/robinhood-chain-mark";

type Props = {
  className?: string;
  href?: string;
  compact?: boolean;
};

/** Official Robinhood feather + wordmark lockup for marketing surfaces. */
export function RobinhoodBrandLockup({ className = "", href, compact = false }: Props) {
  const inner = (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <RobinhoodChainMark className={compact ? "h-5 w-5 text-[#CCFF00]" : "h-6 w-6 text-[#CCFF00]"} />
      <span
        className={`font-semibold tracking-tight text-[var(--landing-text)] ${
          compact ? "text-sm" : "text-base sm:text-lg"
        }`}
        style={{ fontFamily: "var(--font-inter), system-ui, sans-serif" }}
      >
        Robinhood
      </span>
    </span>
  );

  if (href) {
    return (
      <a href={href} target="_blank" rel="noreferrer" className="transition hover:opacity-90">
        {inner}
      </a>
    );
  }

  return inner;
}
