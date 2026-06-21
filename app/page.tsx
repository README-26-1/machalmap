"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import AuthLink from "@/components/AuthLink";
import KakaoMap from "@/components/KakaoMap";
import CategoryFilter from "@/components/CategoryFilter";
import StatusBadge from "@/components/StatusBadge";
import FeedbackButtons from "@/components/FeedbackButtons";
import { apiGet } from "@/lib/api";
import { Category, Report } from "@/types/report";

export default function MapPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [category, setCategory] = useState<Category | null>(null);
  const [selected, setSelected] = useState<Report | null>(null);
  const [center, setCenter] = useState<{ lat: number; lng: number }>();
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

  return (
    <main className="relative h-[calc(100vh-4rem)] w-full">
      {/* 상단 바 */}
      <div className="absolute left-0 right-0 top-0 z-20 bg-white/95 px-4 py-3 shadow-card backdrop-blur">
        <div className="mb-2 flex items-center justify-between">
          <h1 className="text-lg font-bold text-primary">마찰지도</h1>
          <AuthLink />
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
          <KakaoMap reports={filtered} center={center} onMarkerClick={setSelected} />
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
