"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import StatusBadge from "@/components/StatusBadge";
import FeedbackButtons from "@/components/FeedbackButtons";
import { apiGet } from "@/lib/api";
import { Report } from "@/types/report";

export default function ReportDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [report, setReport] = useState<Report | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    apiGet<Report>(`/api/reports/${id}`)
      .then(setReport)
      .catch((e) => setError((e as Error).message));
  }, [id]);

  if (error) return <main className="p-6 text-ink-muted">{error}</main>;
  if (!report) return <main className="p-6 text-ink-muted">불러오는 중…</main>;

  return (
    <main className="mx-auto max-w-md p-4">
      <div className="flex items-center gap-2">
        <span className="font-semibold">{report.category}</span>
        <StatusBadge status={report.status} />
      </div>
      {report.image_url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={report.image_url}
          alt={report.category}
          className="mt-3 w-full rounded-md object-cover"
        />
      )}
      <p className="mt-3 text-sm">{report.description}</p>
      <p className="mt-1 text-xs text-ink-muted">
        {new Date(report.created_at).toLocaleString("ko-KR")}
      </p>
      <div className="mt-4">
        <FeedbackButtons report={report} onUpdated={(c) => setReport({ ...report, ...c })} />
      </div>
    </main>
  );
}
