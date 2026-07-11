import { defineChain } from "viem";

const ROBINHOOD_RPC_DEFAULT = "https://rpc.mainnet.chain.robinhood.com";

export function getRobinhoodRpcUrl(): string {
  return (
    process.env.ROBINHOOD_RPC_URL?.trim() ||
    process.env.NEXT_PUBLIC_ROBINHOOD_RPC?.trim() ||
    ROBINHOOD_RPC_DEFAULT
  );
}

export const robinhoodChain = defineChain({
  id: 4663,
  name: "Robinhood Chain",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: {
    default: {
      http: [getRobinhoodRpcUrl()],
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

export const robinhoodCaipNetworkId = `eip155:${robinhoodChainId}` as const;

export function robinhoodChainAddParams() {
  return {
    chainId: `0x${robinhoodChain.id.toString(16)}`,
    chainName: robinhoodChain.name,
    nativeCurrency: robinhoodChain.nativeCurrency,
    rpcUrls: robinhoodChain.rpcUrls.default.http,
    blockExplorerUrls: [robinhoodChain.blockExplorers.default.url],
  } as const;
}
