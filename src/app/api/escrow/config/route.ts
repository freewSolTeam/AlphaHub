import {
  escrowContractEnabled,
  getEscrowContractAddress,
  readCheckoutContractConfig,
} from "@/lib/alphahub-checkout";
import { getEthUsdRate } from "@/lib/checkout-quote";
import { resolveCheckoutFeeOverrides } from "@/lib/checkout-fee-resolve";
import { getPlatformFee } from "@/lib/escrow-config";
import {
  ALPHA_HUB_CONTRACT_NAME,
  createRobinhoodPublicClient,
} from "@/lib/robinhood-public-client";
import { NextResponse } from "next/server";

/** Public checkout config — fee dari smart contract kalau sudah deploy, else dari .env */
export async function GET() {
  const useContract = escrowContractEnabled();
  const contractAddress = getEscrowContractAddress();
  const feeOverrides = await resolveCheckoutFeeOverrides();

  let contractConfig = null;
  if (useContract && contractAddress) {
    const client = createRobinhoodPublicClient();
    contractConfig = await readCheckoutContractConfig(client);
  }

  const feeSource = feeOverrides ? ("contract" as const) : ("env" as const);

  return NextResponse.json({
    useContract,
    contractAddress,
    contractName: useContract ? ALPHA_HUB_CONTRACT_NAME : null,
    feeSource,
    ethUsdRate: getEthUsdRate(),
    platformFee: {
      usdg: feeOverrides?.usdgFee ?? getPlatformFee(),
      eth: feeOverrides?.ethFee ?? null,
    },
    contract: contractConfig
      ? {
          usdgToken: contractConfig.usdgToken,
          treasury: contractConfig.treasury,
          owner: contractConfig.owner,
          usdgFee: contractConfig.usdgFee,
          ethFee: contractConfig.ethFee,
        }
      : null,
  });
}
