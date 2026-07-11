import { SiteLogo } from "@/components/site-logo";
import { redirect } from "next/navigation";
import { SignInWallet } from "./sign-in-wallet";
import { Metadata } from "next";
import Link from "next/link";
import { auth } from "@/auth";

export const metadata: Metadata = {
  title: "Log in",
  description: "Sign in to AlphaHub with your Robinhood Chain wallet.",
};

type P = { searchParams: Promise<{ callbackUrl?: string }> };

export default async function LoginPage({ searchParams }: P) {
  const session = await auth();
  if (session?.user) {
    redirect("/dashboard");
  }
  const { callbackUrl } = await searchParams;
  const safeCallback = callbackUrl && callbackUrl.startsWith("/") ? callbackUrl : "/dashboard";

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-5 py-16">
      <div className="w-full max-w-md">
        <div className="text-center">
          <div className="flex justify-center">
            <SiteLogo size="md" />
          </div>
        </div>
        <div className="mt-8 rounded border border-[var(--landing-border)] bg-[var(--landing-surface)] p-7">
          <SignInWallet callbackUrl={safeCallback} />
        </div>
        <p className="mt-6 text-center">
          <Link href="/" className="hyre-footer-link">
            ← Back to home
          </Link>
        </p>
      </div>
    </div>
  );
}
