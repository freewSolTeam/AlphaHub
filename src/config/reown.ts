import { WagmiAdapter } from "@reown/appkit-adapter-wagmi";
import type { AppKitNetwork } from "@reown/appkit/networks";
import { cookieStorage, createStorage } from "wagmi";
import { robinhoodChain } from "@/lib/robinhood-chain";

export const reownProjectId = process.env.NEXT_PUBLIC_REOWN_PROJECT_ID?.trim() ?? "";

export const reownNetworks = [robinhoodChain] as [AppKitNetwork, ...AppKitNetwork[]];

export const reownMetadata = {
  name: "AlphaHub",
  description: "Degen calls marketplace on Robinhood Chain",
  url:
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    process.env.AUTH_URL?.trim() ||
    (process.env.NODE_ENV === "development" ? "http://localhost:3000" : "https://alphahub.space"),
  icons: ["/favicon.png"],
};

export const wagmiAdapter = new WagmiAdapter({
  storage: createStorage({ storage: cookieStorage }),
  ssr: true,
  projectId: reownProjectId || "00000000000000000000000000000000",
  networks: reownNetworks,
});

export const wagmiConfig = wagmiAdapter.wagmiConfig;
