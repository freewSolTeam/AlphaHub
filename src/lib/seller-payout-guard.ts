import { resolveSellerPayoutWallet } from "@/lib/seller-payout-wallet";

type SellerUser = {
  wallet?: string | null;
  payoutWallet?: string | null;
};

export function sellerPayoutMissing(user: SellerUser | null | undefined): boolean {
  if (!user) return true;
  return resolveSellerPayoutWallet(user) == null;
}

export const SELLER_PAYOUT_REQUIRED_MSG =
  "Connect and save your Robinhood Chain wallet, or set a sales payout wallet in Dashboard before publishing a paid listing.";
