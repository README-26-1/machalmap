import type { Coordinates } from "@/types/report";

const MIN_LATITUDE = -90;
const MAX_LATITUDE = 90;
const MIN_LONGITUDE = -180;
const MAX_LONGITUDE = 180;

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

export function toCoordinates(lat: unknown, lng: unknown): Coordinates | null {
  if (!isFiniteNumber(lat) || !isFiniteNumber(lng)) return null;
  if (lat < MIN_LATITUDE || lat > MAX_LATITUDE) return null;
  if (lng < MIN_LONGITUDE || lng > MAX_LONGITUDE) return null;
  return { lat, lng };
}

