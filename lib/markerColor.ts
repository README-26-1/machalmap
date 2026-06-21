import { Category, ReportStatus } from "@/types/report";

// 마커 색상 규칙 (기획서 12번 / 디자인 시스템 2.2)
export function markerColor(category: Category, status: ReportStatus): string {
  if (status === "해결 완료") return "#9CA3AF"; // 회색
  if (status === "위험" || category === "사고/위험") return "#EF4444"; // 빨강
  if (category === "보행 불편" || category === "공사/통행 제한") return "#F97316"; // 주황
  if (category === "시설 고장") return "#3B82F6"; // 파랑
  if (category === "쓰레기/환경") return "#22C55E"; // 초록
  return "#8B5CF6"; // 기타 보라
}
