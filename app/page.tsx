"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import KakaoMap from "@/components/KakaoMap";
import CategoryFilter from "@/components/CategoryFilter";
import StatusBadge from "@/components/StatusBadge";
import FeedbackButtons from "@/components/FeedbackButtons";
import { apiGet } from "@/lib/api";
import { Category, Coordinates, Report } from "@/types/report";

export default function MapPage() {
  const router = useRouter();
  const [reports, setReports] = useState<Report[]>([]);
  const [category, setCategory] = useState<Category | null>(null);
  const [selected, setSelected] = useState<Report | null>(null);
  const [center, setCenter] = useState<Coordinates>();
  const [draftLocation, setDraftLocation] = useState<Coordinates | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiGet<Report[]>("/api/reports")
      .then(setReports)
      .catch(() => setReports([]))
      .finally(() => setLoading(false));

    navigator.geolocation?.getCurrentPosition(
      (pos) => setCenter({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => {}
    );
  }, []);

  const filtered = useMemo(
    () => (category ? reports.filter((r) => r.category === category) : reports),
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
    <main className="relative h-[100dvh] w-full">
      {/* 상단 바 */}
      <div className="absolute left-0 right-0 top-0 z-20 bg-white/95 px-4 py-3 shadow-card backdrop-blur">
        <div className="mb-2 flex items-center justify-between">
          <h1 className="text-lg font-bold text-primary">마찰지도</h1>
          <Link href="/login" className="text-sm text-ink-muted">
            로그인
          </Link>
        </div>
        <CategoryFilter value={category} onChange={setCategory} />
      </div>

      {/* 지도 */}
      <div className="h-full w-full">
        {loading ? (
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
              setSelected(report);
            }}
            onMapRightClick={(point) => {
              setSelected(null);
              setDraftLocation(point);
            }}
          />
        )}
      </div>

      {/* 제보하기 FAB */}
      <Link
        href="/report/new"
        className="absolute bottom-6 right-5 z-20 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-white shadow-float"
        aria-label="제보하기"
      >
        <Plus size={26} />
      </Link>

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
