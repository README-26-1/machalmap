import type { Coordinates } from "@/types/report";

export type LocationSource = "initial" | "photo" | "current" | "map";
export type StatusTone = "info" | "success" | "warning" | "error";

export interface StatusMessage {
  readonly tone: StatusTone;
  readonly text: string;
}

export interface SelectedReportPhoto {
  readonly file: File;
  readonly previewUrl: string;
}

export interface LocationSelection {
  readonly coordinates: Coordinates | null;
  readonly source: LocationSource | null;
}

