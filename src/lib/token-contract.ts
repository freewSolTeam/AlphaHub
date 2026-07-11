/** AlphaHub token contract address — separate from the checkout smart contract. */
export const TOKEN_CA_PLACEHOLDER = "0x······";

export function getTokenContractAddress(): string | null {
  const raw =
    process.env.NEXT_PUBLIC_TOKEN_CA?.trim() ||
    process.env.TOKEN_CA?.trim() ||
    "";
  if (!/^0x[0-9a-fA-F]{40}$/.test(raw)) return null;
  return raw;
}

export function getTokenContractDisplay(): string {
  return getTokenContractAddress() ?? TOKEN_CA_PLACEHOLDER;
}

export function tokenContractConfigured(): boolean {
  return getTokenContractAddress() != null;
}
