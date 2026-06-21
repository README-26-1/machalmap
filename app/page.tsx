"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, X } from "lucide-react";
import KakaoMap from "@/components/KakaoMap";
import CategoryFilter from "@/components/CategoryFilter";
import ReportForm from "@/components/ReportForm";
import SelectedReportDetail from "@/components/SelectedReportDetail";
import ClusterListPanel from "@/components/ClusterListPanel";
import { apiGet } from "@/lib/api";
import { Category, Coordinates, Report } from "@/types/report";

export default function MapPage() {
  const router = useRouter();
  const [reports, setReports] = useState<Report[]>([]);
  const [category, setCategory] = useState<Category | null>(null);
  const [selected, setSelected] = useState<Report | null>(null);
  const [clusterReports, setClusterReports] = useState<Report[] | null>(null);
  const [center, setCenter] = useState<Coordinates>();
  const [draftLocation, setDraftLocation] = useState<Coordinates | null>(null);
  const [loading, setLoading] = useState(true);
  const [locationReady, setLocationReady] = useState(false);
  const [reportOpen, setReportOpen] = useState(false); // 데스크톱 제보 모달

  const loadReports = useCallback(() => {
    return apiGet<Report[]>("/api/reports")
      .then(setReports)
      .catch(() => setReports([]));
  }, []);

  useEffect(() => {
    loadReports().finally(() => setLoading(false));

    navigator.geolocation?.getCurrentPosition(
      (pos) => {
        setCenter({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocationReady(true);
      },
      () => {
        setLocationReady(true);
      },
      { enableHighAccuracy: true, maximumAge: 30_000, timeout: 10_000 }
    );

    if (!navigator.geolocation) {
      setLocationReady(true);
    }
  }, [loadReports]);

  // 해결 완료된 제보는 지도에서 숨김(데이터는 유지). 카테고리 필터도 함께 적용.
  const filtered = useMemo(
    () =>
      reports.filter(
        (r) => r.status !== "해결 완료" && (!category || r.category === category)
      ),
    [reports, category]
  );

  function openReportForm(point: Coordinates) {
    const params = new URLSearchParams({
      lat: point.lat.toFixed(6),
      lng: point.lng.toFixed(6),
    });
    router.push(`/report/new?${params.toString()}`);
  }

  return (
    <main className="relative h-[100dvh] w-full md:h-[calc(100dvh-3.5rem)]">
      {/* 상단 바 (모바일 전용: 로고+로그인 / 데스크톱은 NavBar가 담당) */}
      <div className="absolute left-0 right-0 top-0 z-20 flex items-center justify-between bg-white/95 px-4 py-3 shadow-card backdrop-blur md:hidden">
        <h1 className="text-lg font-bold text-primary">불편핑</h1>
        <Link
          href="/login"
          className="rounded-full border border-line px-3 py-1.5 text-xs font-semibold text-ink-muted transition-colors hover:text-ink"
        >
          로그인
        </Link>
      </div>

      {/* 지도 */}
      <div className="h-full w-full">
        {loading || !locationReady ? (
          <div className="flex h-full items-center justify-center text-ink-muted">
            지도를 불러오는 중…
          </div>
        ) : (
          <KakaoMap
            reports={filtered}
            center={center}
            draftLocation={draftLocation}
            onMarkerClick={(report) => {
              setDraftLocation(null);
              setClusterReports(null);
              setSelected(report);
            }}
            onClusterClick={(group) => {
              setDraftLocation(null);
              setSelected(null);
              setClusterReports(group);
            }}
            onMapRightClick={(point) => {
              setSelected(null);
              setClusterReports(null);
              setDraftLocation(point);
            }}
          />
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
            className="relative max-h-[calc(100dvh-2rem)] w-full max-w-md overflow-y-auto rounded-lg bg-white p-5 shadow-float"
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

      {draftLocation && (
        <div className="absolute inset-x-4 bottom-24 z-30 mx-auto max-w-sm rounded-lg border border-line bg-white p-4 shadow-float">
          <p className="text-sm font-semibold text-ink">이 위치에 등록하시겠습니까?</p>
          <p className="mt-1 text-xs text-ink-muted">
            위도 {draftLocation.lat.toFixed(5)} / 경도 {draftLocation.lng.toFixed(5)}
          </p>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <button
              type="button"
              className="h-11 rounded-md bg-surface text-sm font-semibold text-ink-muted"
              onClick={() => setDraftLocation(null)}
            >
              취소
            </button>
            <button
              type="button"
              className="h-11 rounded-md bg-primary text-sm font-semibold text-white"
              onClick={() => openReportForm(draftLocation)}
            >
              등록하기
            </button>
          </div>
        </div>
      )}

      {selected && (
        <SelectedReportDetail
          key={selected.id}
          report={selected}
          onClose={() => setSelected(null)}
          onUpdated={(counts) => {
            // 지도 마커 배열에도 즉시 반영
            setReports((prev) =>
              prev.map((r) => (r.id === selected.id ? { ...r, ...counts } : r))
            );
            // 해결 완료되면 핀이 사라지므로 상세 시트도 닫음
            if (counts.status === "해결 완료") setSelected(null);
            else setSelected({ ...selected, ...counts });
          }}
        />
      )}

      {clusterReports && !selected && (
        <ClusterListPanel
          reports={clusterReports}
          onClose={() => setClusterReports(null)}
          onSelect={(report) => {
            setClusterReports(null);
            setSelected(report);
          }}
        />
      )}
    </main>
  );
}
