"use client";

import type { StaticImport } from "next/dist/shared/lib/get-img-props";
import Image, { type ImageProps } from "next/image";
import { useCallback, useEffect, useState } from "react";

const DEFAULT_FALLBACK =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100%25' height='100%25' viewBox='0 0 100 100'%3E%3Crect width='100%25' height='100%25' fill='%232d3748'/%3E%3Ctext x='50%25' y='50%25' font-family='sans-serif' font-size='14' fill='%23718096' text-anchor='middle' dy='.3em'%3ENo Image%3C/text%3E%3C/svg%3E";

type FillMode = {
  fill: true;
  width?: never;
  height?: never;
};

type SizedMode = {
  fill?: false;
  width: number;
  height: number;
};

type FallbackImageProps = Omit<
  ImageProps,
  "src" | "alt" | "fill" | "width" | "height"
> &
  (FillMode | SizedMode) & {
    src: string | StaticImport | null | undefined;
    fallbackSrc?: string;
    alt: string;
  };

export default function FallbackImage({
  src,
  fallbackSrc = DEFAULT_FALLBACK,
  alt,
  ...rest
}: FallbackImageProps) {
  const resolvedSrc = src ?? fallbackSrc;
  const [imgSrc, setImgSrc] = useState<string | StaticImport>(resolvedSrc);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    // Reset error state when src changes
    setHasError(false);
    setImgSrc(src ?? fallbackSrc);
  }, [src, fallbackSrc]);

  const handleError = useCallback(() => {
    if (!hasError) {
      setHasError(true);
      setImgSrc(fallbackSrc);
    }
  }, [hasError, fallbackSrc]);

  // data: URIs must bypass Next.js image optimizer
  const isDataUri = typeof imgSrc === "string" && imgSrc.startsWith("data:");

  return (
    <Image
      {...rest}
      src={imgSrc}
      alt={alt}
      onError={handleError}
      unoptimized={isDataUri || (rest as ImageProps).unoptimized}
    />
  );
}
