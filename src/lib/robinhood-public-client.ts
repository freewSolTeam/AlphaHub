import { robinhoodChain } from "@/lib/robinhood-chain";
import { createPublicClient, http, type PublicClient } from "viem";

export function getRobinhoodRpcUrl(): string {
  return (
    process.env.ROBINHOOD_RPC_URL?.trim() ||
    process.env.NEXT_PUBLIC_ROBINHOOD_RPC?.trim() ||
    "https://rpc.mainnet.chain.robinhood.com"
  );
}

export function createRobinhoodPublicClient(): PublicClient {
  return createPublicClient({
    chain: robinhoodChain,
    transport: http(getRobinhoodRpcUrl()),
  });
}

export const ALPHA_HUB_CONTRACT_NAME = "AlphaHub";

export function alphaHubContractExplorerUrl(address: string): string {
  return `https://robinhoodchain.blockscout.com/address/${address}`;
}
