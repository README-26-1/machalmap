import { ReportStatus } from "@/types/report";

const map: Record<ReportStatus, string> = {
  "확인 필요": "bg-slate-100 text-slate-600",
  "지속 중": "bg-blue-100 text-blue-700",
  위험: "bg-red-100 text-red-700",
  "해결 후보": "bg-yellow-100 text-orange-700",
  "해결 완료": "bg-gray-100 text-gray-500",
};

export default function StatusBadge({ status }: { status: ReportStatus }) {
  return <span className={`badge-status ${map[status]}`}>{status}</span>;
}
