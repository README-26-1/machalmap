"use client";

import { useState } from "react";
import { apiSend } from "@/lib/api";
import { FeedbackType, Report } from "@/types/report";

interface Props {
  report: Report;
  onUpdated?: (counts: Pick<Report, "status" | "still_count" | "danger_count" | "resolved_count">) => void;
}

const buttons: { type: FeedbackType; label: string; tone: string }[] = [
  { type: "still", label: "아직 있어요", tone: "border-line text-ink" },
  { type: "danger", label: "위험해요", tone: "border-marker-danger text-marker-danger" },
  { type: "resolved", label: "해결됐어요", tone: "border-marker-env text-marker-env" },
];

export default function FeedbackButtons({ report, onUpdated }: Props) {
  const [counts, setCounts] = useState({
    still_count: report.still_count,
    danger_count: report.danger_count,
    resolved_count: report.resolved_count,
  });
  const [busy, setBusy] = useState<FeedbackType | null>(null);

  async function send(type: FeedbackType) {
    setBusy(type);
    try {
      const data = await apiSend<
        Pick<Report, "status" | "still_count" | "danger_count" | "resolved_count">
      >(`/api/reports/${report.id}/feedback`, "POST", { type });
      setCounts(data);
      onUpdated?.(data);
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setBusy(null);
    }
  }

  const countOf = (t: FeedbackType) =>
    t === "still" ? counts.still_count : t === "danger" ? counts.danger_count : counts.resolved_count;

  return (
    <div className="grid grid-cols-3 gap-2">
      {buttons.map((b) => (
        <button
          key={b.type}
          onClick={() => send(b.type)}
          disabled={busy !== null}
          className={`flex min-h-[44px] flex-col items-center justify-center rounded-md border bg-white px-2 py-2 text-xs font-medium disabled:opacity-50 ${b.tone}`}
        >
          <span>{b.label}</span>
          <span className="mt-0.5 text-[11px] text-ink-muted">{countOf(b.type)}</span>
        </button>
      ))}
    </div>
  );
}
