"use client";

import { useEffect, useState } from "react";
import { Search, X } from "lucide-react";
import Button from "@/components/Button";
import KakaoMap, { KakaoPlace } from "@/components/KakaoMap";
import { Coordinates } from "@/types/report";

interface Props {
  readonly open: boolean;
  readonly initial?: Coordinates | null;
  readonly onClose: () => void;
  readonly onSelect: (coords: Coordinates) => void;
}

interface PlaceResult {
  name: string;
  address: string;
  lat: number;
  lng: number;
}

export default function LocationPicker({ open, initial, onClose, onSelect }: Props) {
  const [picked, setPicked] = useState<Coordinates | null>(initial ?? null);
  const [focus, setFocus] = useState<Coordinates | null>(initial ?? null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PlaceResult[]>([]);
  const [searching, setSearching] = useState(false);

  // 열릴 때 초기화
  useEffect(() => {
    if (open) {
      setPicked(initial ?? null);
      setFocus(initial ?? null);
      setQuery("");
      setResults([]);
    }
  }, [open, initial]);

  function search() {
    const kakao = window.kakao;
    if (!kakao?.maps?.services) {
      alert("지도 검색을 준비 중이에요. 잠시 후 다시 시도해 주세요.");
      return;
    }
    if (!query.trim()) return;
    setSearching(true);
    const places = new kakao.maps.services.Places();
    places.keywordSearch(query.trim(), (data: KakaoPlace[], status) => {
      setSearching(false);
      if (status !== kakao.maps!.services!.Status.OK) {
        setResults([]);
        return;
      }
      setResults(
        data.slice(0, 6).map((p) => ({
          name: p.place_name,
          address: p.road_address_name || p.address_name,
          lat: Number(p.y),
          lng: Number(p.x),
        }))
      );
    });
  }

  function chooseResult(r: PlaceResult) {
    const c = { lat: r.lat, lng: r.lng };
    setPicked(c);
    setFocus(c);
    setResults([]);
    setQuery(r.name);
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center md:items-center">
      <button
        type="button"
        aria-label="닫기"
        onClick={onClose}
        className="absolute inset-0 bg-ink/40"
      />
      <section
        role="dialog"
        aria-modal="true"
        aria-label="지도에서 위치 선택"
        className="relative flex h-[85vh] w-full max-w-lg flex-col rounded-t-lg bg-white p-4 shadow-float md:h-[80vh] md:rounded-lg"
      >
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-semibold text-ink">지도에서 위치 선택</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="닫기"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-surface text-ink-muted transition hover:text-ink"
          >
            <X size={18} />
          </button>
        </div>

        {/* 검색 */}
        <div className="relative">
          <div className="flex gap-2">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  search();
                }
              }}
              placeholder="장소·주소 검색 (예: 강남역, 서울시청)"
              className="h-11 flex-1 rounded-md border border-line px-3 text-sm"
            />
            <Button onClick={search} disabled={searching} className="px-4">
              <Search size={18} />
            </Button>
          </div>
          {results.length > 0 && (
            <ul className="absolute z-10 mt-1 max-h-60 w-full overflow-y-auto rounded-md border border-line bg-white shadow-float">
              {results.map((r, i) => (
                <li key={`${r.lat}-${r.lng}-${i}`}>
                  <button
                    type="button"
                    onClick={() => chooseResult(r)}
                    className="block w-full border-b border-line px-3 py-2 text-left last:border-b-0 hover:bg-surface"
                  >
                    <p className="text-sm font-medium text-ink">{r.name}</p>
                    <p className="text-xs text-ink-muted">{r.address}</p>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <p className="mb-2 mt-3 text-xs text-ink-muted">
          지도를 눌러 위치를 선택하거나, 위에서 장소를 검색하세요.
        </p>

        {/* 지도 (크게) */}
        <div className="min-h-0 flex-1 overflow-hidden rounded-md border border-line">
          <KakaoMap
            reports={[]}
            center={initial ?? undefined}
            focus={focus}
            draftLocation={picked}
            onMapClick={setPicked}
          />
        </div>

        {picked && (
          <p className="mt-2 text-xs text-ink-muted">
            선택됨 — 위도 {picked.lat.toFixed(5)} / 경도 {picked.lng.toFixed(5)}
          </p>
        )}

        <div className="mt-3 grid grid-cols-2 gap-2">
          <Button variant="secondary" onClick={onClose}>
            취소
          </Button>
          <Button
            onClick={() => {
              if (picked) onSelect(picked);
            }}
            disabled={!picked}
          >
            이 위치로 선택
          </Button>
        </div>
      </section>
    </div>
  );
}
