"use client";

import Image from "next/image";
import { useState } from "react";

const ALPHAHUB_AVATAR = "/favicon.png";

function isRemoteUrl(url: string) {
  return url.startsWith("http://") || url.startsWith("https://");
}

type Props = {
  src: string | null | undefined;
  alt: string;
  width: number;
  height: number;
  className?: string;
};

export function CreatorAvatar({ src, alt, width, height, className }: Props) {
  const [imgSrc, setImgSrc] = useState(src?.trim() || ALPHAHUB_AVATAR);
  const useFallback = imgSrc === ALPHAHUB_AVATAR;

  return (
    <Image
      src={imgSrc}
      alt={alt}
      width={width}
      height={height}
      unoptimized={useFallback || isRemoteUrl(imgSrc)}
      className={className}
      onError={() => setImgSrc(ALPHAHUB_AVATAR)}
    />
  );
}
