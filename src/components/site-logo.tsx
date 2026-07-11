import Image from "next/image";
import Link from "next/link";

type Props = {
  className?: string;
  size?: "sm" | "md";
  linked?: boolean;
};

export function SiteLogo({ className = "", size = "md", linked = true }: Props) {
  const img = (
    <Image
      src="/alphahub-logo.png"
      alt="AlphaHub"
      width={size === "sm" ? 112 : 140}
      height={size === "sm" ? 26 : 32}
      priority
      className={`w-auto object-contain ${size === "sm" ? "h-6" : "h-7 sm:h-8"} ${className}`}
    />
  );

  if (!linked) return <span className={`inline-flex shrink-0 ${className}`}>{img}</span>;

  return (
    <Link href="/" className={`inline-flex shrink-0 transition opacity-95 hover:opacity-100 ${className}`} aria-label="AlphaHub home">
      {img}
    </Link>
  );
}
