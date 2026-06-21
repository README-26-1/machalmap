import { Category, ReportStatus } from "@/types/report";

// 카테고리별 고유 색 — 7개 카테고리가 모두 구분되도록 별도 색 지정.
// (이전엔 status="위험"이 카테고리 색을 빨강으로 덮어써서 시설고장 등이 사고/위험과
//  같아지는 문제가 있었음. 색은 카테고리 기준으로만 정한다. 상태는 배지로 표시.)
const CATEGORY_COLOR: Record<Category, string> = {
  "사고/위험": "#EF4444", // 빨강
  "보행 불편": "#F97316", // 주황
  "공사/통행 제한": "#EAB308", // 앰버(노랑)
  "시설 고장": "#3B82F6", // 파랑
  "쓰레기/환경": "#22C55E", // 초록
  "킥보드/방치물": "#EC4899", // 핑크
  "기타": "#8B5CF6", // 보라
};

export function markerColor(category: Category, status: ReportStatus): string {
  if (status === "해결 완료") return "#9CA3AF"; // 회색
  return CATEGORY_COLOR[category] ?? "#8B5CF6";
}
