/**
 * Payment config for Robinhood Chain (EVM) checkout.
 *
 * Environment (set in .env, never commit secrets):
 * - PLATFORM_FEE_USDG: seller-paid fee when checkout settles in USDG (default 1.5)
 * - PLATFORM_FEE_ETH: optional seller-paid fee in ETH; if unset, converted from USDG fee
 * - CHECKOUT_ETH_USDG_RATE / NEXT_PUBLIC_CHECKOUT_ETH_USDG_RATE: USDG per 1 ETH for cross-currency checkout (default 3000)
 * - PLATFORM_TREASURY_WALLET: receives platform fees from the checkout contract
 * - ESCROW_CONTRACT_ADDRESS / NEXT_PUBLIC_ESCROW_CONTRACT_ADDRESS: deployed AlphaHub contract
 * - DEPLOYER_PRIVATE_KEY: only for `npm run contracts:deploy` (never expose to client)
 *
 * Without ESCROW_CONTRACT_ADDRESS, payments settle wallet-to-wallet (legacy).
 * With the contract set, buyers pay the contract which splits fee + operator payout atomically.
 */

const DEFAULT_PLATFORM_FEE_USDG = 1.5;

export function getPlatformFee(): number {
  const v = process.env.PLATFORM_FEE_USDG?.trim();
  if (!v) return DEFAULT_PLATFORM_FEE_USDG;
  const n = Number(v);
  if (!Number.isFinite(n) || n < 0) return DEFAULT_PLATFORM_FEE_USDG;
  return n;
}

export function getPlatformTreasuryWallet(): string | null {
  const v = process.env.PLATFORM_TREASURY_WALLET?.trim();
  if (!v || !/^0x[0-9a-fA-F]{40}$/.test(v)) return null;
  return v;
}
