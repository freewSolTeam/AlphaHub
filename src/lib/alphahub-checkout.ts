import {
  decodeEventLog,
  encodePacked,
  formatEther,
  formatUnits,
  getAddress,
  keccak256,
  parseAbi,
  type Address,
  type Hex,
  type PublicClient,
} from "viem";
import {
  platformFeeUnits as checkoutPlatformFeeUnits,
  type PlatformFeeOverrides,
} from "@/lib/checkout-quote";
import type { PriceCurrency } from "@/lib/payment-currency";

export const alphahubCheckoutAbi = parseAbi([
  "function payETH(bytes32 orderRef, address seller) payable",
  "function payUSDG(bytes32 orderRef, address seller, uint256 grossAmount)",
  "function paid(bytes32 orderRef) view returns (bool)",
  "function treasury() view returns (address)",
  "function usdgToken() view returns (address)",
  "function usdgFee() view returns (uint256)",
  "function ethFeeWei() view returns (uint256)",
  "function owner() view returns (address)",
  "event PaymentSettled(bytes32 indexed orderRef, address indexed buyer, address indexed seller, uint8 paymentType, uint256 grossAmount, uint256 platformFee, uint256 sellerAmount)",
]);

export function getEscrowContractAddress(): Address | null {
  const raw =
    process.env.ESCROW_CONTRACT_ADDRESS?.trim() ||
    process.env.NEXT_PUBLIC_ESCROW_CONTRACT_ADDRESS?.trim() ||
    "";
  if (!/^0x[0-9a-fA-F]{40}$/.test(raw)) return null;
  return getAddress(raw);
}

export function escrowContractEnabled(): boolean {
  return getEscrowContractAddress() != null;
}

/** Deterministic on-chain order id from the Prisma `EscrowOrder.id`. */
export function orderRefFromId(orderId: string): Hex {
  return keccak256(encodePacked(["string"], [orderId]));
}

export function platformFeeUnits(currency: PriceCurrency): bigint {
  return checkoutPlatformFeeUnits(currency);
}

// re-export for contract verify helpers
export { getPlatformFeeAmount, type PlatformFeeOverrides } from "@/lib/checkout-quote";

export type CheckoutContractConfig = {
  contractAddress: Address;
  usdgToken: Address;
  treasury: Address;
  owner: Address;
  usdgFee: number;
  ethFee: number;
  usdgFeeUnits: bigint;
  ethFeeWei: bigint;
};

/** Read platform fee + treasury from the deployed AlphaHub contract. */
export async function readCheckoutContractConfig(
  client: PublicClient,
): Promise<CheckoutContractConfig | null> {
  const contractAddress = getEscrowContractAddress();
  if (!contractAddress) return null;

  try {
    const [usdgToken, treasury, owner, usdgFeeUnits, ethFeeWei] = await Promise.all([
      client.readContract({
        address: contractAddress,
        abi: alphahubCheckoutAbi,
        functionName: "usdgToken",
      }),
      client.readContract({
        address: contractAddress,
        abi: alphahubCheckoutAbi,
        functionName: "treasury",
      }),
      client.readContract({
        address: contractAddress,
        abi: alphahubCheckoutAbi,
        functionName: "owner",
      }),
      client.readContract({
        address: contractAddress,
        abi: alphahubCheckoutAbi,
        functionName: "usdgFee",
      }),
      client.readContract({
        address: contractAddress,
        abi: alphahubCheckoutAbi,
        functionName: "ethFeeWei",
      }),
    ]);

    return {
      contractAddress,
      usdgToken: getAddress(usdgToken),
      treasury: getAddress(treasury),
      owner: getAddress(owner),
      usdgFee: Number(formatUnits(usdgFeeUnits, 6)),
      ethFee: Number(formatEther(ethFeeWei)),
      usdgFeeUnits,
      ethFeeWei,
    };
  } catch {
    return null;
  }
}

export function contractConfigToFeeOverrides(config: CheckoutContractConfig): PlatformFeeOverrides {
  return { usdgFee: config.usdgFee, ethFee: config.ethFee };
}

export type ContractPaymentProof = {
  orderRef: Hex;
  buyer: Address;
  seller: Address;
  paymentType: number;
  grossAmount: bigint;
};

export async function readContractPaymentFromReceipt(
  client: PublicClient,
  input: {
    txHash: Hex;
    contract: Address;
    expectedOrderRef: Hex;
    expectedSeller: Address;
    expectedGross: bigint;
    expectedCurrency: PriceCurrency;
  },
): Promise<{ ok: true; proof: ContractPaymentProof } | { ok: false; error: string }> {
  let receipt: Awaited<ReturnType<typeof client.getTransactionReceipt>>;
  try {
    receipt = await client.getTransactionReceipt({ hash: input.txHash });
  } catch {
    return { ok: false, error: "Could not find this transaction on Robinhood Chain yet." };
  }

  if (receipt.status !== "success") {
    return { ok: false, error: "That transaction failed on-chain." };
  }

  const expectedType = input.expectedCurrency === "ETH" ? 0 : 1;

  for (const log of receipt.logs) {
    if (getAddress(log.address) !== getAddress(input.contract)) continue;
    try {
      const decoded = decodeEventLog({
        abi: alphahubCheckoutAbi,
        eventName: "PaymentSettled",
        topics: log.topics,
        data: log.data,
      });

      const { orderRef, buyer, seller, paymentType, grossAmount } = decoded.args;

      if (orderRef.toLowerCase() !== input.expectedOrderRef.toLowerCase()) continue;
      if (getAddress(seller).toLowerCase() !== input.expectedSeller.toLowerCase()) continue;
      if (paymentType !== expectedType) {
        return { ok: false, error: "Payment currency does not match this order." };
      }
      if (grossAmount < input.expectedGross) {
        return { ok: false, error: "The on-chain payment is less than the listed price." };
      }

      return {
        ok: true,
        proof: {
          orderRef,
          buyer: getAddress(buyer),
          seller: getAddress(seller),
          paymentType,
          grossAmount,
        },
      };
    } catch {
      continue;
    }
  }

  return {
    ok: false,
    error: "No AlphaHub checkout settlement was found in that transaction.",
  };
}
