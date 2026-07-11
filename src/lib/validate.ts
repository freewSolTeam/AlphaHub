import { isAddress } from "viem";

/** Robinhood Chain / EVM wallet address (0x…). */
export function isValidWalletAddress(s: string) {
  return isAddress(s);
}
