"use client";

import { X } from "lucide-react";
import FeedbackButtons from "@/components/FeedbackButtons";
import ReportComments from "@/components/ReportComments";
import ReportImage from "@/components/ReportImage";
import StatusBadge from "@/components/StatusBadge";
import type { Report } from "@/types/report";

type ReportFeedbackUpdate = Pick<
  Report,
  "status" | "still_count" | "danger_count" | "resolved_count"
>;

interface Props {
  readonly report: Report;
  readonly onClose: () => void;
  readonly onUpdated: (counts: ReportFeedbackUpdate) => void;
}

export default function SelectedReportDetail({ report, onClose, onUpdated }: Props) {
  return (
    <aside
      aria-label="제보 상세"
      className="absolute inset-x-0 bottom-0 z-30 flex max-h-[calc(100dvh-1rem)] flex-col rounded-t-lg bg-white shadow-float md:bottom-5 md:left-auto md:right-5 md:top-5 md:max-h-none md:w-[min(420px,calc(100vw-2.5rem))] md:rounded-lg md:border md:border-line"
    >
      <div className="mx-auto mt-2 h-1 w-10 shrink-0 rounded-full bg-line md:hidden" />
      <div className="shrink-0 px-4 py-3 md:border-b md:border-line">
        <ReportHeader report={report} onClose={onClose} closeLabel="상세 닫기" />
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4 md:py-4">
        <ReportBody report={report} imageClassName="max-h-[44dvh] object-contain" />
        <div className="mt-4 border-t border-line pt-4">
          <ReportComments reportId={report.id} />
        </div>
      </div>
      <div className="shrink-0 border-t border-line p-4">
        <FeedbackButtons report={report} onUpdated={onUpdated} />
      </div>
    </aside>
  );
}

interface HeaderProps {
  readonly report: Report;
  readonly onClose: () => void;
  readonly closeLabel: string;
}

function ReportHeader({ report, onClose, closeLabel }: HeaderProps) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="flex min-w-0 items-center gap-2">
        <span className="truncate text-sm font-semibold text-ink">{report.category}</span>
        <StatusBadge status={report.status} />
      </div>
      <button
        type="button"
        onClick={onClose}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-ink-muted transition hover:bg-surface hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        aria-label={closeLabel}
      >
        <X size={18} />
      </button>
    </div>
  );
}

interface BodyProps {
  readonly report: Report;
  readonly imageClassName: string;
}

function ReportBody({ report, imageClassName }: BodyProps) {
  return (
    <>
      <ReportImage
        src={report.image_url}
        alt={report.category}
        imageClassName={`mt-3 w-full rounded-md bg-surface ${imageClassName}`}
        fallbackClassName="mt-3 min-h-40 w-full rounded-md border border-line"
      />
      <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-ink">{report.description}</p>
      <p className="mt-2 text-xs text-ink-muted">
        {new Date(report.created_at).toLocaleString("ko-KR")}
      </p>
    </>
  );
}
