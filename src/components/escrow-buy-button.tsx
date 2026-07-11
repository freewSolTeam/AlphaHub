"use client";

import { useRobinhoodWallet } from "@/hooks/use-robinhood-wallet";
import { useWalletConnect } from "@/hooks/use-wallet-connect";
import { getRobinhoodRpcUrl, robinhoodChain, robinhoodChainId } from "@/lib/robinhood-chain";
import { ALPHA_HUB_CONTRACT_NAME } from "@/lib/robinhood-public-client";
import { alphahubCheckoutAbi } from "@/lib/alphahub-checkout";
import { quoteCheckout, type PlatformFeeOverrides } from "@/lib/checkout-quote";
import { formatEscrowAmountLabel, resolvePriceCurrency } from "@/lib/listing-price";
import {
  formatAmountWithCurrency,
  PRICE_CURRENCIES,
  toPaymentUnits,
  USDG_TOKEN_ADDRESS,
  type PriceCurrency,
} from "@/lib/payment-currency";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { createPublicClient, erc20Abi, getAddress, http, isAddress, type Hex } from "viem";
import { useSendTransaction, useWriteContract } from "wagmi";

type PriceTier = { id: string; label: string; priceAmount: number };

type Props = {
  projectId: string;
  amountLabel?: string;
  priceOptions?: PriceTier[];
  priceCurrency?: string | null;
  /** Single-tier listings without `priceOptions`. */
  listingAmount?: number | null;
};

type BuyOk = {
  orderId: string;
  depositAddress: string;
  amount: number;
  amountLabel: string;
  currency: PriceCurrency;
  listingCurrency?: PriceCurrency;
  listingAmount?: number;
  platformFee?: number;
  platformFeeCurrency?: PriceCurrency;
  useContract?: boolean;
  sellerAddress?: string;
  orderRef?: Hex | null;
  contractAddress?: string | null;
};

export function EscrowBuyButton({
  projectId,
  amountLabel,
  priceOptions = [],
  priceCurrency = null,
  listingAmount = null,
}: Props) {
  const router = useRouter();
  const wallet = useRobinhoodWallet();
  const { connectWallet } = useWalletConnect();
  const { sendTransactionAsync } = useSendTransaction();
  const { writeContractAsync } = useWriteContract();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [step, setStep] = useState<"start" | "pay" | "done">("start");
  const [order, setOrder] = useState<BuyOk | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [sendingWallet, setSendingWallet] = useState(false);
  const [settlementTx, setSettlementTx] = useState<string | null>(null);
  const [buyerTx, setBuyerTx] = useState<string | null>(null);
  const [grantedAfterPay, setGrantedAfterPay] = useState<{
    telegram: string | null;
    discord: string | null;
  } | null>(null);
  const [selectedTierId, setSelectedTierId] = useState(() => priceOptions[0]?.id ?? "");
  const listingCur = resolvePriceCurrency(priceCurrency);
  const [paymentCurrency, setPaymentCurrency] = useState<PriceCurrency>(listingCur);
  const [feeOverrides, setFeeOverrides] = useState<PlatformFeeOverrides | undefined>(undefined);
  const [feeSource, setFeeSource] = useState<"contract" | "env" | null>(null);
  const hasTiers = priceOptions.length > 0;

  useEffect(() => {
    let cancelled = false;
    void fetch("/api/escrow/config")
      .then((r) => r.json())
      .then((data: { platformFee?: { usdg?: number; eth?: number | null }; feeSource?: string }) => {
        if (cancelled || !data.platformFee) return;
        setFeeOverrides({
          usdgFee: data.platformFee.usdg,
          ethFee: data.platformFee.eth ?? undefined,
        });
        setFeeSource(data.feeSource === "contract" ? "contract" : "env");
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const selectedTier = hasTiers ? priceOptions.find((o) => o.id === selectedTierId) : null;
  const tierListingAmount =
    selectedTier?.priceAmount ??
    (typeof listingAmount === "number" && listingAmount > 0 ? listingAmount : null);

  const checkoutPreview = useMemo(() => {
    if (tierListingAmount == null || tierListingAmount <= 0) return null;
    return quoteCheckout(tierListingAmount, listingCur, paymentCurrency, feeOverrides);
  }, [tierListingAmount, listingCur, paymentCurrency, feeOverrides]);

  const ctaLabel =
    !wallet.isConnected
      ? "Connect wallet"
      : hasTiers && selectedTier
        ? `Join · ${selectedTier.label} — ${formatEscrowAmountLabel(selectedTier.priceAmount, listingCur)}`
        : amountLabel
          ? `Join · ${amountLabel}`
          : "Join";

  async function onStartClick() {
    if (!wallet.isConnected) {
      setMessage(null);
      await connectWallet();
      return;
    }
    await buy();
  }

  async function buy() {
    setLoading(true);
    setMessage(null);
    try {
      if (hasTiers && !selectedTierId) {
        throw new Error("Choose a tier.");
      }
      const res = await fetch("/api/escrow/buy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          priceOptionId: hasTiers ? selectedTierId : null,
          paymentCurrency,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as BuyOk & { error?: string };
      if (!res.ok) {
        const msg = data.error || "Couldn't start. Try again.";
        if (res.status === 403 && /connect your wallet|wallet first/i.test(msg)) {
          throw new Error("Connect and save your Robinhood Chain wallet on your profile first.");
        }
        throw new Error(msg);
      }
      if (typeof data.amount !== "number" || !Number.isFinite(data.amount) || data.amount <= 0) {
        throw new Error("Invalid amount from server.");
      }
      setOrder({
        orderId: data.orderId,
        depositAddress: data.depositAddress,
        amount: data.amount,
        amountLabel: data.amountLabel,
        currency: resolvePriceCurrency(data.currency),
        listingCurrency: data.listingCurrency ? resolvePriceCurrency(data.listingCurrency) : listingCur,
        listingAmount: data.listingAmount,
        platformFee: data.platformFee,
        platformFeeCurrency: data.platformFeeCurrency
          ? resolvePriceCurrency(data.platformFeeCurrency)
          : undefined,
        useContract: Boolean(data.useContract),
        sellerAddress: data.sellerAddress,
        orderRef: data.orderRef ?? null,
        contractAddress: data.contractAddress ?? null,
      });
      setStep("pay");
      setMessage(null);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Error");
    } finally {
      setLoading(false);
    }
  }

  async function confirmWithSignature(s: string) {
    if (!order) return;
    const sig = s.trim();
    if (sig.length < 10) {
      setMessage("Paste a valid Robinhood Chain transaction hash.");
      return;
    }
    setConfirming(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/escrow/orders/${order.orderId}/confirm`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ signature: sig }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        details?: string;
        settlementTx?: string;
        buyerTx?: string;
        grantedTelegramUrl?: string | null;
        grantedDiscordUrl?: string | null;
      };
      if (!res.ok) {
        const combined = [data.error, data.details].filter(Boolean).join(" — ");
        throw new Error(combined || "Confirmation failed");
      }
      setBuyerTx(data.buyerTx ?? sig);
      setSettlementTx(data.settlementTx ?? null);
      setGrantedAfterPay({
        telegram: data.grantedTelegramUrl?.trim() || null,
        discord: data.grantedDiscordUrl?.trim() || null,
      });
      setStep("done");
      setMessage(
        data.grantedTelegramUrl?.trim() || data.grantedDiscordUrl?.trim()
          ? "You’re in — open your invites below."
          : "You’re in — the page will show invites if the host set them on the listing.",
      );
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Error");
    } finally {
      setConfirming(false);
    }
  }

  async function payWithWallet() {
    if (!order) return;
    if (!wallet.isConnected || !wallet.address) {
      setMessage("Connect your Robinhood Chain wallet first.");
      return;
    }
    if (!isAddress(order.depositAddress)) {
      setMessage("Invalid payout address from server.");
      return;
    }

    setSendingWallet(true);
    setMessage(null);
    try {
      await wallet.ensureRobinhoodChain();
      const gross = toPaymentUnits(order.amount, order.currency);

      let hash: Hex;

      if (
        order.useContract &&
        order.orderRef &&
        order.sellerAddress &&
        order.contractAddress &&
        isAddress(order.contractAddress) &&
        isAddress(order.sellerAddress)
      ) {
        const contract = getAddress(order.contractAddress);
        const seller = getAddress(order.sellerAddress);

        if (order.currency === "ETH") {
          hash = await writeContractAsync({
            chainId: robinhoodChainId,
            address: contract,
            abi: alphahubCheckoutAbi,
            functionName: "payETH",
            args: [order.orderRef, seller],
            value: gross,
          });
        } else {
          const reader = createPublicClient({
            chain: robinhoodChain,
            transport: http(getRobinhoodRpcUrl()),
          });
          const allowance = await reader.readContract({
            address: USDG_TOKEN_ADDRESS,
            abi: erc20Abi,
            functionName: "allowance",
            args: [wallet.address as `0x${string}`, contract],
          });
          if (allowance < gross) {
            await writeContractAsync({
              chainId: robinhoodChainId,
              address: USDG_TOKEN_ADDRESS,
              abi: erc20Abi,
              functionName: "approve",
              args: [contract, gross],
            });
          }
          hash = await writeContractAsync({
            chainId: robinhoodChainId,
            address: contract,
            abi: alphahubCheckoutAbi,
            functionName: "payUSDG",
            args: [order.orderRef, seller, gross],
          });
        }
      } else if (order.currency === "ETH") {
        hash = await sendTransactionAsync({
          chainId: robinhoodChainId,
          to: order.depositAddress as `0x${string}`,
          value: gross,
        });
      } else {
        hash = await writeContractAsync({
          chainId: robinhoodChainId,
          address: USDG_TOKEN_ADDRESS,
          abi: erc20Abi,
          functionName: "transfer",
          args: [order.depositAddress as `0x${string}`, gross],
        });
      }
      setSendingWallet(false);
      await confirmWithSignature(hash);
    } catch (e) {
      setSendingWallet(false);
      const msg = e instanceof Error ? e.message : "Transaction failed or was cancelled.";
      if (/reject|cancel|denied/i.test(msg)) {
        setMessage("Transaction cancelled.");
      } else {
        setMessage(msg);
      }
    }
  }

  const explorerBase = "https://robinhoodchain.blockscout.com/tx/";

  if (step === "done") {
    const t = grantedAfterPay?.telegram;
    const d = grantedAfterPay?.discord;
    return (
      <div className="space-y-2">
        <p className="text-sm leading-relaxed text-brand/80">{message || "You’re in."}</p>
        {(t || d) && (
          <div className="flex flex-col gap-1.5 sm:flex-row sm:flex-wrap sm:gap-2">
            {t ? (
              <a href={t} target="_blank" rel="noopener noreferrer" className="btn-rh-secondary w-full sm:w-auto">
                Open Telegram
              </a>
            ) : null}
            {d ? (
              <a href={d} target="_blank" rel="noopener noreferrer" className="btn-rh-secondary w-full sm:w-auto">
                Open Discord
              </a>
            ) : null}
          </div>
        )}
        <div className="flex flex-col gap-1">
          {buyerTx ? (
            <a href={`${explorerBase}${buyerTx}`} target="_blank" rel="noreferrer" className="text-sm text-brand/90 underline">
              View payment on Robinhood Chain
            </a>
          ) : null}
          {settlementTx ? (
            <a href={`${explorerBase}${settlementTx}`} target="_blank" rel="noreferrer" className="text-sm text-brand/90 underline">
              View settlement tx
            </a>
          ) : null}
        </div>
      </div>
    );
  }

  if (step === "pay" && order) {
    const crossCurrency =
      order.listingCurrency &&
      order.listingAmount != null &&
      order.listingCurrency !== order.currency;
    return (
      <div className="space-y-2.5 text-left">
        {order.useContract ? (
          <p className="text-xs leading-relaxed text-[var(--rh-muted)]">
            Checkout via verified <span className="text-brand">{ALPHA_HUB_CONTRACT_NAME}</span> smart contract.
            {order.sellerAddress ? ` Operator receives payout minus platform fee.` : null}
          </p>
        ) : null}
        {crossCurrency ? (
          <p className="text-xs leading-relaxed text-[var(--rh-muted)]">
            Listed at {formatAmountWithCurrency(order.listingAmount!, order.listingCurrency!)} — you pay{" "}
            {order.amountLabel}.
          </p>
        ) : null}
        <button
          type="button"
          onClick={() => void payWithWallet()}
          disabled={sendingWallet || confirming}
          className="btn-rh-primary w-full disabled:opacity-60"
        >
          {sendingWallet || confirming
            ? sendingWallet
              ? "Confirm in wallet…"
              : "Finishing up…"
            : order.useContract
              ? `Pay ${order.amountLabel} via ${ALPHA_HUB_CONTRACT_NAME}`
              : `Pay ${order.amountLabel} on Robinhood Chain`}
        </button>
        {message && <p className="text-sm text-amber-200/90">{message}</p>}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {hasTiers && (
        <div className="space-y-1">
          <label className="ui-form-label">Tier</label>
          <select
            value={selectedTierId}
            onChange={(e) => setSelectedTierId(e.target.value)}
            className="ui-filter-select h-10 w-full px-3"
          >
            {priceOptions.map((o) => (
              <option key={o.id} value={o.id}>
                {o.label} — {formatEscrowAmountLabel(o.priceAmount, listingCur)}
              </option>
            ))}
          </select>
        </div>
      )}
      <div className="space-y-1">
        <label className="ui-form-label">Pay with</label>
        <div className="grid grid-cols-2 gap-2">
          {PRICE_CURRENCIES.map((c) => {
            const active = paymentCurrency === c;
            return (
              <button
                key={c}
                type="button"
                onClick={() => setPaymentCurrency(c)}
                className={`h-10 rounded-md border px-3 text-sm font-medium transition-colors ${
                  active
                    ? "border-brand/60 bg-brand/15 text-brand"
                    : "border-[var(--rh-border)] bg-transparent text-[var(--rh-muted)] hover:border-brand/30 hover:text-brand/90"
                }`}
              >
                {c}
              </button>
            );
          })}
        </div>
        {checkoutPreview && checkoutPreview.listingCurrency !== checkoutPreview.paymentCurrency ? (
          <p className="text-xs leading-relaxed text-[var(--rh-muted)]">
            ≈ {formatAmountWithCurrency(checkoutPreview.paymentAmount, checkoutPreview.paymentCurrency)} at checkout
            (listed {formatAmountWithCurrency(checkoutPreview.listingAmount, checkoutPreview.listingCurrency)}).
          </p>
        ) : checkoutPreview ? (
          <p className="text-xs text-[var(--rh-muted)]">
            You pay {formatAmountWithCurrency(checkoutPreview.paymentAmount, checkoutPreview.paymentCurrency)}.
            {feeSource === "contract" ? " Platform fee from smart contract." : null}
          </p>
        ) : null}
      </div>
      <button
        type="button"
        onClick={() => void onStartClick()}
        disabled={loading || wallet.isConnecting}
        className="btn-rh-primary w-full disabled:opacity-60"
      >
        {loading ? "Preparing…" : wallet.isConnecting ? "Connecting…" : ctaLabel}
      </button>
      {message && <p className="text-sm text-zinc-500">{message}</p>}
    </div>
  );
}
