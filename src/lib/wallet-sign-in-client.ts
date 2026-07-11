import { getSession, signIn } from "next-auth/react";

export type WalletSignInClient = {
  address: string | null;
  ensureRobinhoodChain: () => Promise<void>;
  signMessage: (message: string) => Promise<string>;
};

export async function signInWithWallet(
  wallet: WalletSignInClient,
  options?: { callbackUrl?: string },
): Promise<void> {
  if (!wallet.address) {
    throw new Error("Wallet not connected");
  }

  await wallet.ensureRobinhoodChain();
  const addr = wallet.address;

  const challengeRes = await fetch(`/api/auth/wallet/challenge?wallet=${encodeURIComponent(addr)}`);
  const challenge = (await challengeRes.json().catch(() => ({}))) as {
    message?: string;
    nonce?: string;
    error?: string;
  };

  if (!challengeRes.ok || !challenge.message || !challenge.nonce) {
    throw new Error(challenge.error || "Could not start wallet sign-in.");
  }

  const signature = await wallet.signMessage(challenge.message);

  const result = await signIn("wallet", {
    wallet: addr,
    message: challenge.message,
    nonce: challenge.nonce,
    signature,
    redirect: false,
  });

  if (result?.error) {
    throw new Error(
      result.error === "CredentialsSignin" ? "Wallet sign-in was rejected. Try again." : result.error,
    );
  }
  if (!result?.ok) {
    throw new Error("Wallet sign-in failed. Please try again.");
  }

  await getSession();

  if (options?.callbackUrl) {
    window.location.href = options.callbackUrl;
  }
}
