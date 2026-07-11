/** Shorten a Robinhood Chain / EVM address for inline display. */
export function shortWalletAddress(s: string, head = 6, tail = 4): string {
  const t = s.trim();
  if (t.length <= head + tail + 1) return t;
  return `${t.slice(0, head)}…${t.slice(-tail)}`;
}
