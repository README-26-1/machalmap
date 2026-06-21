"use client";

import { X } from "lucide-react";
import ReportImage from "@/components/ReportImage";
import StatusBadge from "@/components/StatusBadge";
import type { Report } from "@/types/report";

interface Props {
  readonly reports: Report[];
  readonly onClose: () => void;
  readonly onSelect: (report: Report) => void;
}

// 클러스터(겹친 핀 묶음)를 클릭했을 때, 안에 든 제보들을 리스트로 보여주는 패널.
// 줌으로도 분리되지 않을 만큼 가까운 핀들을 개별 상세처럼 선택할 수 있게 한다.
export default function ClusterListPanel({ reports, onClose, onSelect }: Props) {
  return (
    <>
      {/* 모바일: 하단 시트 */}
      <section
        aria-label="겹친 제보 목록"
        className="absolute inset-x-0 bottom-0 z-30 flex max-h-[70dvh] flex-col rounded-t-lg bg-white p-4 shadow-float md:hidden"
      >
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-line" />
        <Header count={reports.length} onClose={onClose} />
        <ul className="mt-2 min-h-0 flex-1 space-y-2 overflow-y-auto">
          {reports.map((r) => (
            <Item key={r.id} report={r} onSelect={onSelect} />
          ))}
        </ul>
      </section>

      {/* 데스크톱: 우측 패널 */}
      <aside
        aria-label="겹친 제보 목록"
        className="absolute bottom-5 right-5 top-5 z-30 hidden w-[min(420px,calc(100vw-2.5rem))] flex-col rounded-lg border border-line bg-white shadow-float md:flex"
      >
        <div className="shrink-0 border-b border-line px-4 py-3">
          <Header count={reports.length} onClose={onClose} />
        </div>
        <ul className="min-h-0 flex-1 space-y-2 overflow-y-auto px-4 py-3">
          {reports.map((r) => (
            <Item key={r.id} report={r} onSelect={onSelect} />
          ))}
        </ul>
      </aside>
    </>
  );
}

function Header({
  count,
  onClose,
}: {
  readonly count: number;
  readonly onClose: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <h2 className="text-sm font-semibold text-ink">
        이 위치의 제보 {count}건
      </h2>
      <button
        type="button"
        onClick={onClose}
        aria-label="닫기"
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-ink-muted transition hover:bg-surface hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        <X size={18} />
      </button>
    </div>
  );
}

function Item({
  report,
  onSelect,
}: {
  readonly report: Report;
  readonly onSelect: (report: Report) => void;
}) {
  return (
    <li>
      <button
        type="button"
        onClick={() => onSelect(report)}
        className="flex w-full gap-3 rounded-md border border-line p-2 text-left transition hover:bg-surface"
      >
        <ReportImage
          src={report.image_url}
          alt={report.category}
          imageClassName="h-14 w-14 shrink-0 rounded-md object-cover"
          fallbackClassName="h-14 w-14 shrink-0 rounded-md border border-line"
          compact
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="truncate text-sm font-semibold text-ink">
              {report.category}
            </span>
            <StatusBadge status={report.status} />
          </div>
          <p className="mt-0.5 line-clamp-1 text-xs text-ink-muted">
            {report.description || "설명 없음"}
          </p>
          <p className="mt-0.5 text-[11px] text-ink-muted">
            {new Date(report.created_at).toLocaleDateString("ko-KR")}
          </p>
        </div>
      </button>
    </li>
  );
}
