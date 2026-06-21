"use client";

import exifr from "exifr";
import { toCoordinates } from "@/lib/coordinates";
import type { Coordinates } from "@/types/report";

const JPEG_TYPE = "image/jpeg";
const HEIC_EXTENSIONS = [".heic", ".heif"] as const;
const HEIC_TYPES = ["image/heic", "image/heif"] as const;

export interface PreparedReportPhoto {
  readonly file: File;
  readonly coordinates: Coordinates | null;
  readonly convertedFromHeic: boolean;
}

export class PhotoPreparationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PhotoPreparationError";
  }
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
    return { file, coordinates, convertedFromHeic: false };
  }

  const convertedFile = await convertHeicToJpeg(file);
  return { file: convertedFile, coordinates, convertedFromHeic: true };
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

async function convertHeicToJpeg(file: File): Promise<File> {
  try {
    const heic2any = (await import("heic2any")).default;
    const result = await heic2any({
      blob: file,
      toType: JPEG_TYPE,
      quality: 0.92,
    });
    const blob = Array.isArray(result) ? result[0] : result;
    if (!blob) {
      throw new PhotoPreparationError("HEIC 사진을 JPEG로 변환하지 못했어요.");
    }
    return new File([blob], replaceExtension(file.name, "jpg"), {
      type: JPEG_TYPE,
      lastModified: file.lastModified,
    });
  } catch (error) {
    if (error instanceof PhotoPreparationError) throw error;
    throw new PhotoPreparationError(
      "HEIC 사진 변환에 실패했어요. JPEG 또는 PNG 사진으로 다시 시도해 주세요."
    );
  }
}

function replaceExtension(filename: string, nextExtension: string): string {
  const dotIndex = filename.lastIndexOf(".");
  if (dotIndex <= 0) return `${filename}.${nextExtension}`;
  return `${filename.slice(0, dotIndex)}.${nextExtension}`;
}
