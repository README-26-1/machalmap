"use client";

import exifr from "exifr";
import { toCoordinates } from "@/lib/coordinates";
import type { Coordinates } from "@/types/report";

const JPEG_TYPE = "image/jpeg";
const HEIC_EXTENSIONS = [".heic", ".heif"] as const;
const HEIC_TYPES = ["image/heic", "image/heif"] as const;

export type PhotoConversion = "none" | "converted";

export interface PreparedReportPhoto {
  readonly file: File;
  readonly coordinates: Coordinates | null;
  readonly conversion: PhotoConversion;
}

export function isSupportedImageFile(file: File): boolean {
  return file.type.startsWith("image/") || isHeicFile(file);
}

export function isHeicFile(file: File): boolean {
  const lowerName = file.name.toLowerCase();
  return (
    HEIC_TYPES.some((type) => file.type === type) ||
    HEIC_EXTENSIONS.some((extension) => lowerName.endsWith(extension))
  );
}

export async function prepareReportPhoto(file: File): Promise<PreparedReportPhoto> {
  const coordinates = await extractPhotoCoordinates(file);
  if (!isHeicFile(file)) {
    return { file, coordinates, conversion: "none" };
  }

  const convertedFile = await convertHeicToJpeg(file);
  if (!convertedFile) {
    throw new Error(
      "HEIC 사진을 JPEG로 변환하지 못했어요. 사진 앱에서 JPG로 저장한 뒤 다시 선택해 주세요."
    );
  }
  return { file: convertedFile, coordinates, conversion: "converted" };
}

async function extractPhotoCoordinates(file: File): Promise<Coordinates | null> {
  try {
    const gps = await exifr.gps(file);
    return toCoordinates(gps?.latitude, gps?.longitude);
  } catch (error) {
    if (error instanceof Error) return null;
    return null;
  }
}

async function convertHeicToJpeg(file: File): Promise<File | null> {
  try {
    const { heicTo } = await import("heic-to");
    const blob = await heicTo({
      blob: file,
      type: JPEG_TYPE,
      quality: 0.92,
    });
    return new File([blob], replaceExtension(file.name, "jpg"), {
      type: JPEG_TYPE,
      lastModified: file.lastModified,
    });
  } catch (error) {
    console.error("[HEIC conversion] JPEG 변환 실패:", error);
    return null;
  }
}

function replaceExtension(filename: string, nextExtension: string): string {
  const dotIndex = filename.lastIndexOf(".");
  if (dotIndex <= 0) return `${filename}.${nextExtension}`;
  return `${filename.slice(0, dotIndex)}.${nextExtension}`;
}
