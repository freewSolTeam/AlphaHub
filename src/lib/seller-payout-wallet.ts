import { isAddress } from "viem";

export function resolveSellerPayoutWallet(user: {
  wallet?: string | null;
  payoutWallet?: string | null;
}): string | null {
  const payout = user.payoutWallet?.trim();
  if (payout && isAddress(payout)) return payout.toLowerCase();
  const login = user.wallet?.trim();
  if (login && isAddress(login)) return login.toLowerCase();
  return null;
}
