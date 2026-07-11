import { getRobinhoodRpcUrl, robinhoodChain } from "@/lib/robinhood-chain";
import { createPublicClient, http, type PublicClient } from "viem";

export { getRobinhoodRpcUrl };

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
