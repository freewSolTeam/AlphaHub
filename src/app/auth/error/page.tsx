import { resolveAuthErrorCopy } from "@/lib/auth-error-copy";
import Link from "next/link";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign-in error - AlphaHub",
};

type P = { searchParams: Promise<{ error?: string }> };

export default async function AuthErrorPage({ searchParams }: P) {
  const { error } = await searchParams;
  const block = resolveAuthErrorCopy(error);

  return (
    <div className="app-container py-16 sm:py-24">
      <div className="card-rh mx-auto max-w-md p-6 sm:p-8">
        <p className="ui-page-eyebrow">Auth</p>
        <h1 className="mt-2 text-lg font-semibold tracking-tight text-[var(--rh-foreground)]">{block.title}</h1>
        <ul className="mt-3 list-disc space-y-2 pl-4 text-xs leading-relaxed text-[var(--rh-muted)] sm:text-sm">
          {block.lines.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
        <p className="mt-5 text-xs sm:text-sm">
          <Link href="/login" className="font-mono text-[11px] uppercase tracking-[0.1em] text-brand underline hover:text-brand/80">
            Back to sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
