"use client";

import { useEffect, useState } from "react";
import { ImageOff, Loader2 } from "lucide-react";

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
  const [convertedSrc, setConvertedSrc] = useState<string | null>(null);
  const [converting, setConverting] = useState(false);
  const heic = isHeicSource(src);
  const displaySrc = heic ? convertedSrc : src;
  const showFallback = !src || failedSrc === src;

  useEffect(() => {
    let active = true;
    let objectUrl: string | null = null;

    setFailedSrc(null);
    setConvertedSrc(null);
    setConverting(heic);

    if (!src || !heic) return;

    void (async () => {
      try {
        const response = await fetch(src);
        if (!response.ok) throw new Error("HEIC 사진을 불러오지 못했습니다.");

        const { heicTo } = await import("heic-to");
        const blob = await heicTo({
          blob: await response.blob(),
          type: "image/jpeg",
          quality: 0.92,
        });

        objectUrl = URL.createObjectURL(blob);
        if (active) setConvertedSrc(objectUrl);
      } catch (error) {
        console.error("[ReportImage] HEIC 미리보기 변환 실패:", error);
        if (active) setFailedSrc(src);
      } finally {
        if (active) setConverting(false);
      }
    })();

    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [heic, src]);

  if (converting) {
    return (
      <div
        role="status"
        className={`flex flex-col items-center justify-center bg-surface text-center text-ink-muted ${fallbackClassName}`}
      >
        <Loader2
          size={compact ? 18 : 28}
          className="animate-spin"
          strokeWidth={1.7}
          aria-hidden="true"
        />
        {!compact && <span className="mt-2 text-xs">HEIC 사진을 불러오는 중…</span>}
      </div>
    );
  }

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

  if (!displaySrc) return null;

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={displaySrc}
      alt={alt}
      onError={() => setFailedSrc(src)}
      className={imageClassName}
    />
  );
}

function isHeicSource(src: string | null): boolean {
  if (!src) return false;
  const pathname = src.split(/[?#]/, 1)[0].toLowerCase();
  return pathname.endsWith(".heic") || pathname.endsWith(".heif");
}
