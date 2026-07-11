"use client";

import { robinhoodChain, robinhoodChainId } from "@/lib/robinhood-chain";
import { useAccount, useBalance, useDisconnect, useSignMessage, useSwitchChain } from "wagmi";

export function useRobinhoodWallet() {
  const { address, isConnected, chainId, connector, isConnecting } = useAccount();
  const { disconnectAsync } = useDisconnect();
  const { signMessageAsync, isPending: isSigning } = useSignMessage();
  const { switchChainAsync } = useSwitchChain();
  const { data: balance } = useBalance({
    address,
    chainId: robinhoodChainId,
    query: { enabled: Boolean(address && isConnected) },
  });

  const onWrongChain = isConnected && chainId !== robinhoodChainId;

  return {
    address: address ?? null,
    isConnected,
    chainId,
    connectorName: connector?.name ?? null,
    balanceWei: balance?.value ?? null,
    balanceSymbol: balance?.symbol ?? "ETH",
    isConnecting,
    isSigning,
    onWrongChain,
    robinhoodChain,
    async disconnect() {
      await disconnectAsync();
    },
    async signMessage(message: string) {
      if (!address) throw new Error("Wallet not connected");
      return signMessageAsync({ message });
    },
    async ensureRobinhoodChain() {
      if (chainId !== robinhoodChainId) {
        await switchChainAsync({ chainId: robinhoodChainId });
      }
    },
  };
}
