/** Generic / brand marks — not used as listing art in directory grids. */
const GENERIC_COVER_MARKERS = [
  "robinhood-mark",
  "alphahub-logo",
  "/favicon",
  "favicon.png",
];

export function isGenericListingCover(url: string | null | undefined): boolean {
  if (!url?.trim()) return true;
  const lower = url.toLowerCase();
  return GENERIC_COVER_MARKERS.some((m) => lower.includes(m));
}

/** Colorful generative NFT-style cover — unique per listing slug. */
export function listingNftCoverUrl(slug: string): string {
  const seed = encodeURIComponent(slug.trim() || "alphahub");
  return `https://api.dicebear.com/9.x/shapes/png?seed=${seed}&size=512&backgroundColor=0c0c0c,141414&shape1Color=ccff00&shape2Color=2a2a2a&shape3Color=525252`;
}

/** Directory / explore grids: NFT art instead of duplicate brand logos. */
export function listingGridCoverUrl(slug: string, communityImage: string | null | undefined): string {
  if (isGenericListingCover(communityImage)) {
    return listingNftCoverUrl(slug);
  }
  return communityImage!.trim();
}
