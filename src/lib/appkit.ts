"use client";

import { reownMetadata, reownNetworks, reownProjectId, wagmiAdapter } from "@/config/reown";
import { robinhoodChain } from "@/lib/robinhood-chain";
import { createAppKit } from "@reown/appkit/react";

if (!reownProjectId && typeof window !== "undefined") {
  console.warn("[AlphaHub] NEXT_PUBLIC_REOWN_PROJECT_ID is missing. Get one at https://dashboard.reown.com");
}

createAppKit({
  adapters: [wagmiAdapter],
  projectId: reownProjectId || "00000000000000000000000000000000",
  networks: reownNetworks,
  defaultNetwork: robinhoodChain,
  metadata: reownMetadata,
  themeMode: "dark",
  themeVariables: {
    "--w3m-accent": "#ccff00",
    "--w3m-color-mix": "#050505",
    "--w3m-color-mix-strength": 40,
  },
  features: {
    analytics: false,
  },
});
