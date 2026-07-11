import { defineChain } from "viem";

export const robinhoodChain = defineChain({
  id: 4663,
  name: "Robinhood Chain",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: {
    default: {
      http: [
        process.env.NEXT_PUBLIC_ROBINHOOD_RPC?.trim() || "https://rpc.mainnet.chain.robinhood.com",
      ],
    },
  },
  blockExplorers: {
    default: {
      name: "Blockscout",
      url: "https://robinhoodchain.blockscout.com",
    },
  },
});

export const robinhoodChainId = robinhoodChain.id;

export function robinhoodChainAddParams() {
  return {
    chainId: `0x${robinhoodChain.id.toString(16)}`,
    chainName: robinhoodChain.name,
    nativeCurrency: robinhoodChain.nativeCurrency,
    rpcUrls: robinhoodChain.rpcUrls.default.http,
    blockExplorerUrls: [robinhoodChain.blockExplorers.default.url],
  } as const;
}
