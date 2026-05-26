"use client";

import Image from "next/image";
import { useState } from "react";
import { getProductImageUrl } from "@/lib/catalog/product-image-url";
import { cn } from "@/lib/utils";

const FALLBACK_SRC = "/products/product-fallback.svg";

interface ProductImageProps {
  asin: string;
  src?: string;
  alt: string;
  className?: string;
  sizes: string;
}

export function ProductImage({
  asin,
  src,
  alt,
  className,
  sizes,
}: ProductImageProps) {
  const [hasError, setHasError] = useState(false);
  const resolvedSrc = hasError
    ? FALLBACK_SRC
    : getProductImageUrl(asin, src);

  return (
    <Image
      src={resolvedSrc}
      alt={alt}
      fill
      className={cn("object-contain p-1", className)}
      sizes={sizes}
      onError={() => setHasError(true)}
    />
  );
}
