"use client";

import { useState } from "react";
import { ImageOff } from "lucide-react";

interface Props {
  readonly src: string | null;
  readonly alt: string;
  readonly imageClassName: string;
  readonly fallbackClassName: string;
  readonly compact?: boolean;
}

export default function ReportImage({
  src,
  alt,
  imageClassName,
  fallbackClassName,
  compact = false,
}: Props) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const showFallback = !src || failedSrc === src;

  if (showFallback) {
    return (
      <div
        role="img"
        aria-label={`${alt} 사진 없음`}
        className={`flex flex-col items-center justify-center bg-surface text-center text-ink-muted ${fallbackClassName}`}
      >
        <ImageOff size={compact ? 18 : 28} strokeWidth={1.7} aria-hidden="true" />
        {compact ? (
          <span className="sr-only">등록된 사진이 없어요</span>
        ) : (
          <span className="mt-2 text-xs">등록된 사진이 없어요</span>
        )}
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      onError={() => setFailedSrc(src)}
      className={imageClassName}
    />
  );
}

