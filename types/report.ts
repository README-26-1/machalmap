export const CATEGORIES = [
  "사고/위험",
  "보행 불편",
  "시설 고장",
  "킥보드/방치물",
  "쓰레기/환경",
  "공사/통행 제한",
  "기타",
] as const;

export type Category = (typeof CATEGORIES)[number];

export const STATUSES = [
  "확인 필요",
  "지속 중",
  "위험",
  "해결 후보",
  "해결 완료",
] as const;

export type ReportStatus = (typeof STATUSES)[number];

export type FeedbackType = "still" | "danger" | "resolved";

export interface Report {
  id: string;
  user_id: string | null;
  image_url: string | null;
  category: Category;
  description: string;
  lat: number;
  lng: number;
  status: ReportStatus;
  still_count: number;
  danger_count: number;
  resolved_count: number;
  created_at: string;
}

export interface NewReportInput {
  image_url: string | null;
  category: Category;
  description: string;
  lat: number;
  lng: number;
}
