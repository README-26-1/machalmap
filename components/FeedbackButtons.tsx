"use client";

import { useState } from "react";
import { apiSend } from "@/lib/api";
import { FeedbackType, Report } from "@/types/report";

interface Props {
  report: Report;
  onUpdated?: (
    counts: Pick<
      Report,
      "status" | "still_count" | "danger_count" | "resolved_count"
    >
  ) => void;
}

// 기본(미선택) tone과 선택됨(active, 채워진) tone을 함께 정의
const buttons: {
  type: FeedbackType;
  label: string;
  idle: string;
  active: string;
}[] = [
  {
    type: "still",
    label: "아직 있어요",
    idle: "border-line text-ink hover:bg-surface",
    active: "border-primary bg-primary text-white",
  },
  {
    type: "danger",
    label: "위험해요",
    idle: "border-marker-danger text-marker-danger hover:bg-marker-danger/10",
    active: "border-marker-danger bg-marker-danger text-white",
  },
  {
    type: "resolved",
    label: "해결됐어요",
    idle: "border-marker-env text-marker-env hover:bg-marker-env/10",
    active: "border-marker-env bg-marker-env text-white",
  },
];

export default function FeedbackButtons({ report, onUpdated }: Props) {
  const [counts, setCounts] = useState({
    still_count: report.still_count,
    danger_count: report.danger_count,
    resolved_count: report.resolved_count,
  });
  const [busy, setBusy] = useState<FeedbackType | null>(null);
  const [pressed, setPressed] = useState<Set<FeedbackType>>(new Set());

  async function send(type: FeedbackType) {
    setBusy(type);
    try {
      // 토글: 이미 누른 유형이면 취소, 아니면 등록. 서버가 active로 응답.
      const data = await apiSend<
        Pick<Report, "status" | "still_count" | "danger_count" | "resolved_count"> & {
          type: FeedbackType;
          active: boolean;
        }
      >(`/api/reports/${report.id}/feedback`, "POST", { type });
      setCounts(data);
      setPressed((prev) => {
        const next = new Set(prev);
        if (data.active) next.add(type);
        else next.delete(type);
        return next;
      });
      onUpdated?.(data);
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setBusy(null);
    }
  }

  const countOf = (t: FeedbackType) =>
    t === "still"
      ? counts.still_count
      : t === "danger"
      ? counts.danger_count
      : counts.resolved_count;

  return (
    <div className="grid grid-cols-3 gap-2">
      {buttons.map((b) => {
        const isOn = pressed.has(b.type);
        return (
          <button
            key={b.type}
            onClick={() => send(b.type)}
            disabled={busy !== null}
            aria-pressed={isOn}
            className={`flex min-h-[44px] flex-col items-center justify-center rounded-md border px-2 py-2 text-xs font-medium transition-colors disabled:opacity-50 ${
              isOn ? b.active : `bg-white ${b.idle}`
            }`}
          >
            <span>{b.label}</span>
            <span
              className={`mt-0.5 text-[11px] ${
                isOn ? "text-white/80" : "text-ink-muted"
              }`}
            >
              {countOf(b.type)}
            </span>
          </button>
        );
      })}
    </div>
  );
}
