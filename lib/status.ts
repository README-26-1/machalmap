import { FeedbackType, ReportStatus } from "@/types/report";

// 상태 전이 규칙 (01_API_백엔드_기획 4.3, 기획서 7.5)
// 우선순위: 해결 완료 > 위험 > 지속 중 > 해결 후보 > 확인 필요
const PRIORITY: Record<ReportStatus, number> = {
  "해결 완료": 5,
  위험: 4,
  "지속 중": 3,
  "해결 후보": 2,
  "확인 필요": 1,
};

interface Counts {
  still_count: number;
  danger_count: number;
  resolved_count: number;
}

/** 피드백 적용 후의 count와 다음 상태를 계산한다. */
export function applyFeedback(
  current: ReportStatus,
  counts: Counts,
  type: FeedbackType
): { counts: Counts; status: ReportStatus } {
  const next = { ...counts };
  let candidate: ReportStatus = current;

  if (type === "still") {
    next.still_count += 1;
    candidate = "지속 중";
  } else if (type === "danger") {
    next.danger_count += 1;
    candidate = "위험";
  } else if (type === "resolved") {
    next.resolved_count += 1;
    candidate = next.resolved_count >= 3 ? "해결 완료" : "해결 후보";
  }

  // 해결 완료는 최종 상태로 유지, 그 외에는 우선순위가 높은 쪽으로.
  const status =
    PRIORITY[candidate] >= PRIORITY[current] ? candidate : current;

  return { counts: next, status };
}

/**
 * 카운트만으로 상태를 도출한다(증감 모두 대응 — 취소 포함).
 * 우선순위: 해결 완료 > 위험 > 지속 중 > 해결 후보 > 확인 필요
 */
export function deriveStatus(counts: Counts): ReportStatus {
  if (counts.resolved_count >= 3) return "해결 완료";
  if (counts.danger_count > 0) return "위험";
  if (counts.still_count > 0) return "지속 중";
  if (counts.resolved_count >= 1) return "해결 후보";
  return "확인 필요";
}

/** status별 색 토큰 키 */
export function statusColor(status: ReportStatus): string {
  switch (status) {
    case "위험":
      return "var(--marker-danger)";
    case "해결 완료":
      return "var(--marker-resolved)";
    default:
      return "var(--color-primary)";
  }
}
