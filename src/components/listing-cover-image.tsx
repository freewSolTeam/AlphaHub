"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { listingGridCoverUrl, listingNftCoverUrl } from "@/lib/listing-cover";

type Props = {
  slug: string;
  communityImage: string | null | undefined;
  alt?: string;
  fill?: boolean;
  width?: number;
  height?: number;
  sizes?: string;
  className?: string;
  /** When true, always use generative NFT cover (explore tiles). */
  preferNft?: boolean;
};

export function ListingCoverImage({
  slug,
  communityImage,
  alt = "",
  fill,
  width,
  height,
  sizes,
  className,
  preferNft = false,
}: Props) {
  const resolved = preferNft ? listingNftCoverUrl(slug) : listingGridCoverUrl(slug, communityImage);
  const [src, setSrc] = useState(resolved);

  useEffect(() => {
    setSrc(preferNft ? listingNftCoverUrl(slug) : listingGridCoverUrl(slug, communityImage));
  }, [slug, communityImage, preferNft]);

  const shared = {
    src,
    alt,
    unoptimized: true as const,
    className,
    onError: () => setSrc(listingNftCoverUrl(slug)),
  };

  if (fill) {
    return <Image {...shared} fill sizes={sizes ?? "(max-width:640px) 50vw, 20vw"} />;
  }

  return <Image {...shared} width={width ?? 40} height={height ?? 40} />;
}
