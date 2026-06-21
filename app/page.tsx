"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Plus, X } from "lucide-react";
import KakaoMap from "@/components/KakaoMap";
import CategoryFilter from "@/components/CategoryFilter";
import StatusBadge from "@/components/StatusBadge";
import FeedbackButtons from "@/components/FeedbackButtons";
import ReportForm from "@/components/ReportForm";
import { apiGet } from "@/lib/api";
import { Category, Report } from "@/types/report";

export default function MapPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [category, setCategory] = useState<Category | null>(null);
  const [selected, setSelected] = useState<Report | null>(null);
  const [center, setCenter] = useState<{ lat: number; lng: number }>();
  const [loading, setLoading] = useState(true);
  const [reportOpen, setReportOpen] = useState(false); // 데스크톱 제보 모달

  const loadReports = useCallback(() => {
    return apiGet<Report[]>("/api/reports")
      .then(setReports)
      .catch(() => setReports([]));
  }, []);

  useEffect(() => {
    loadReports().finally(() => setLoading(false));

    navigator.geolocation?.getCurrentPosition(
      (pos) => setCenter({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => {}
    );
  }, [loadReports]);

  const filtered = useMemo(
    () => (category ? reports.filter((r) => r.category === category) : reports),
    [reports, category]
  );

  return (
    <main className="relative h-[100dvh] w-full md:h-[calc(100dvh-3.5rem)]">
      {/* 상단 바 (모바일 전용: 로고+로그인 / 데스크톱은 NavBar가 담당) */}
      <div className="absolute left-0 right-0 top-0 z-20 flex items-center justify-between bg-white/95 px-4 py-3 shadow-card backdrop-blur md:hidden">
        <h1 className="text-lg font-bold text-primary">마찰지도</h1>
        <Link
          href="/login"
          className="rounded-full border border-line px-3 py-1.5 text-xs font-semibold text-ink-muted transition-colors hover:text-ink"
        >
          로그인
        </Link>
      </div>

      {/* 지도 */}
      <div className="h-full w-full">
        {loading ? (
          <div className="flex h-full items-center justify-center text-ink-muted">
            지도를 불러오는 중…
          </div>
        ) : (
          <KakaoMap reports={filtered} center={center} onMarkerClick={setSelected} />
        )}
      </div>

      {/* 우측 하단 플로팅 버튼: 카테고리 필터(왼쪽) + 제보하기(오른쪽) */}
      <div className="absolute bottom-6 right-5 z-20 flex flex-row items-center gap-3">
        <CategoryFilter value={category} onChange={setCategory} />
        {/* 모바일: 페이지 이동 */}
        <Link
          href="/report/new"
          className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-white shadow-float transition active:scale-[0.98] md:hidden"
          aria-label="제보하기"
        >
          <Plus size={26} />
        </Link>
        {/* 데스크톱: 모달 팝업 */}
        <button
          type="button"
          onClick={() => setReportOpen(true)}
          className="hidden h-14 w-14 items-center justify-center rounded-full bg-primary text-white shadow-float transition active:scale-[0.98] md:flex"
          aria-label="제보하기"
        >
          <Plus size={26} />
        </button>
      </div>

      {/* 데스크톱 제보 모달 (딤 + 블러 배경) */}
      {reportOpen && (
        <div className="fixed inset-0 z-50 hidden items-center justify-center p-4 md:flex">
          <button
            type="button"
            aria-label="닫기"
            onClick={() => setReportOpen(false)}
            className="absolute inset-0 h-full w-full bg-ink/40 backdrop-blur-sm"
          />
          <section
            role="dialog"
            aria-modal="true"
            aria-label="제보하기"
            className="relative w-full max-w-md rounded-lg bg-white p-5 shadow-float"
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold">제보하기</h2>
              <button
                type="button"
                onClick={() => setReportOpen(false)}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-surface text-ink-muted transition hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                aria-label="닫기"
              >
                <X size={18} />
              </button>
            </div>
            <ReportForm
              onSuccess={() => {
                setReportOpen(false);
                loadReports();
              }}
              onCancel={() => setReportOpen(false)}
            />
          </section>
        </div>
      )}

      {/* 상세 바텀시트 */}
      {selected && (
        <div className="absolute inset-x-0 bottom-0 z-30 rounded-t-lg bg-white p-4 shadow-float">
          <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-line" />
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold">{selected.category}</span>
              <StatusBadge status={selected.status} />
            </div>
            <button onClick={() => setSelected(null)} className="text-ink-muted">
              닫기
            </button>
          </div>
          {selected.image_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={selected.image_url}
              alt={selected.category}
              className="mt-3 max-h-48 w-full rounded-md object-cover"
            />
          )}
          <p className="mt-2 text-sm text-ink">{selected.description}</p>
          <p className="mt-1 text-xs text-ink-muted">
            {new Date(selected.created_at).toLocaleString("ko-KR")}
          </p>
          <div className="mt-3">
            <FeedbackButtons
              report={selected}
              onUpdated={(c) => setSelected({ ...selected, ...c })}
            />
          </div>
        </div>
      )}
    </main>
  );
}
