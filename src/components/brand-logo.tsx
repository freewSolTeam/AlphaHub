type Props = {
  className?: string;
  size?: "sm" | "md" | "lg";
};

const sizes = {
  sm: "text-lg",
  md: "text-xl sm:text-2xl",
  lg: "text-2xl sm:text-3xl",
};

/** Wordmark — Goldman font. "Hub" in Robin Neon. */
export function BrandLogo({ className = "", size = "md" }: Props) {
  return (
    <span className={`font-brand font-bold tracking-tight text-white ${sizes[size]} ${className}`}>
      Alpha<span className="text-brand">Hub</span>
    </span>
  );
}
