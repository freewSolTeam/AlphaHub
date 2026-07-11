import {
  paymentUnitsSatisfyAmount,
  USDG_TOKEN_ADDRESS,
  type PriceCurrency,
} from "@/lib/payment-currency";
import type { PublicClient } from "viem";
import { decodeEventLog, erc20Abi, getAddress } from "viem";

type VerifyInput = {
  txHash: `0x${string}`;
  currency: PriceCurrency;
  expectedTo: `0x${string}`;
  expectedAmount: number;
};

type VerifyResult = { ok: true } | { ok: false; error: string };

export async function verifyRobinhoodPayment(client: PublicClient, input: VerifyInput): Promise<VerifyResult> {
  let tx: Awaited<ReturnType<typeof client.getTransaction>>;
  let receipt: Awaited<ReturnType<typeof client.getTransactionReceipt>>;
  try {
    [tx, receipt] = await Promise.all([
      client.getTransaction({ hash: input.txHash }),
      client.getTransactionReceipt({ hash: input.txHash }),
    ]);
  } catch {
    return {
      ok: false,
      error: "Could not find this transaction on Robinhood Chain yet. Wait a moment and try again.",
    };
  }

  if (receipt.status !== "success") {
    return { ok: false, error: "That transaction failed on-chain." };
  }

  const expectedTo = getAddress(input.expectedTo);

  if (input.currency === "ETH") {
    if (!tx.to || getAddress(tx.to) !== expectedTo) {
      return { ok: false, error: "That transaction was not sent to the operator's payout wallet." };
    }
    if (!paymentUnitsSatisfyAmount(tx.value, input.expectedAmount, "ETH")) {
      return { ok: false, error: "The payment amount is less than the listed price." };
    }
    return { ok: true };
  }

  let usdgReceived = BigInt(0);
  for (const log of receipt.logs) {
    if (getAddress(log.address) !== getAddress(USDG_TOKEN_ADDRESS)) continue;
    try {
      const decoded = decodeEventLog({
        abi: erc20Abi,
        eventName: "Transfer",
        data: log.data,
        topics: log.topics,
      });
      if (getAddress(decoded.args.to) !== expectedTo) continue;
      usdgReceived += decoded.args.value;
    } catch {
      continue;
    }
  }

  if (usdgReceived === BigInt(0)) {
    return {
      ok: false,
      error: "No USDG transfer to the operator's payout wallet was found in that transaction.",
    };
  }
  if (!paymentUnitsSatisfyAmount(usdgReceived, input.expectedAmount, "USDG")) {
    return { ok: false, error: "The USDG amount is less than the listed price." };
  }

  return { ok: true };
}
