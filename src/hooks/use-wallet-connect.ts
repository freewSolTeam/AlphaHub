"use client";

import "@/lib/appkit";
import { useAppKit } from "@reown/appkit/react";
import { robinhoodChainId } from "@/lib/robinhood-chain";
import { useRobinhoodWallet } from "@/hooks/use-robinhood-wallet";
import { useCallback, useState } from "react";

export function useWalletConnect() {
  const wallet = useRobinhoodWallet();
  const { open } = useAppKit();
  const [hint, setHint] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const connectWallet = useCallback(async () => {
    setHint(null);
    setBusy(true);
    try {
      open();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to open wallet modal.";
      setHint(msg || "Could not open Reown wallet modal.");
    } finally {
      setBusy(false);
    }
  }, [open]);

  const addRobinhoodNetwork = useCallback(async () => {
    setHint(null);
    setBusy(true);
    try {
      await wallet.ensureRobinhoodChain();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Could not switch to Robinhood Chain.";
      setHint(msg);
    } finally {
      setBusy(false);
    }
  }, [wallet]);

  return {
    connectWallet,
    addRobinhoodNetwork,
    hint,
    connecting: wallet.isConnecting || busy,
    connected: wallet.isConnected,
    onWrongChain: wallet.onWrongChain,
    chainId: wallet.chainId,
    robinhoodChainId,
  };
}
