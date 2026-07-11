import {
  contractConfigToFeeOverrides,
  escrowContractEnabled,
  readCheckoutContractConfig,
} from "@/lib/alphahub-checkout";
import type { PlatformFeeOverrides } from "@/lib/checkout-quote";
import { createRobinhoodPublicClient } from "@/lib/robinhood-public-client";

/** Prefer on-chain fee from AlphaHub contract when deployed. */
export async function resolveCheckoutFeeOverrides(): Promise<PlatformFeeOverrides | undefined> {
  if (!escrowContractEnabled()) return undefined;
  const client = createRobinhoodPublicClient();
  const config = await readCheckoutContractConfig(client);
  return config ? contractConfigToFeeOverrides(config) : undefined;
}
