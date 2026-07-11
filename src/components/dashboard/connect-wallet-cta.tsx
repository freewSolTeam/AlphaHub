"use client";

import { WalletConnectExtras } from "@/components/wallet/wallet-connect-extras";
import { useRobinhoodWallet } from "@/hooks/use-robinhood-wallet";
import { useWalletConnect } from "@/hooks/use-wallet-connect";

export function ConnectWalletCta() {
  const wallet = useRobinhoodWallet();
  const { connectWallet, hint, connecting, onWrongChain, addRobinhoodNetwork } = useWalletConnect();

  if (wallet.isConnected) return null;

  return (
    <div className="flex flex-col items-end">
      <button
        type="button"
        onClick={() => void connectWallet()}
        disabled={connecting}
        className="btn-rh-secondary"
      >
        {connecting ? "Connecting…" : "Connect wallet"}
      </button>
      <WalletConnectExtras
        hint={hint}
        onWrongChain={onWrongChain}
        onAddNetwork={() => void addRobinhoodNetwork()}
        align="right"
      />
    </div>
  );
}
