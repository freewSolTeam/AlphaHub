"use client";

import { SessionProvider } from "next-auth/react";
import type { ReactNode } from "react";
import { RobinhoodWalletProvider } from "@/components/wallet/robinhood-wallet-provider";

export function AppProviders({
  children,
  cookies,
}: {
  children: ReactNode;
  cookies: string | null;
}) {
  return (
    <SessionProvider>
      <RobinhoodWalletProvider cookies={cookies}>{children}</RobinhoodWalletProvider>
    </SessionProvider>
  );
}
