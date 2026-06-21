"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Category, Coordinates, Report, ReportStatus } from "@/types/report";
import { markerColor } from "@/lib/markerColor";

// 카테고리별 Material Icons Round 심볼
const CATEGORY_ICON: Record<Category, string> = {
  "사고/위험": "report",
  "보행 불편": "directions_walk",
  "시설 고장": "build",
  "킥보드/방치물": "two_wheeler",
  "쓰레기/환경": "delete",
  "공사/통행 제한": "construction",
  "기타": "more_horiz",
};

// 일체형 물방울 핀 path (viewBox 0 0 48 56, 하단 끝이 위치 기준점)
const TEARDROP_PATH =
  "M24 56C24 56 44 36.6569 44 24C44 12.9543 35.0457 4 24 4C12.9543 4 4 12.9543 4 24C4 36.6569 24 56 24 56Z";

function markerIcon(category: Category, status: ReportStatus): string {
  if (status === "해결 완료") return "check";
  return CATEGORY_ICON[category] ?? "more_horiz";
}

// CustomOverlay 콘텐츠(DOM) 생성 — Material Icons 폰트가 렌더되도록 실제 DOM 사용
function buildMarkerElement(report: Report, onClick?: (r: Report) => void): HTMLElement {
  const color = markerColor(report.category, report.status);
  const icon = markerIcon(report.category, report.status);
  const faded = report.status === "해결 완료";

  const el = document.createElement("div");
  el.style.cssText = `position:relative;width:34px;height:40px;cursor:pointer;${
    faded ? "opacity:0.6;" : ""
  }filter:drop-shadow(0 3px 4px rgba(0,0,0,0.25));`;
  el.innerHTML = `
    <svg width="34" height="40" viewBox="0 0 48 56" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="${TEARDROP_PATH}" fill="${color}" stroke="white" stroke-width="4"/>
    </svg>
    <span class="material-icons-round" style="position:absolute;top:17px;left:17px;transform:translate(-50%,-50%);color:#fff;font-size:17px;line-height:1;pointer-events:none;">${icon}</span>`;

  if (onClick) el.addEventListener("click", () => onClick(report));
  return el;
}

// 클러스터(겹친 핀 묶음) — 숫자가 든 흰 원
function buildClusterElement(count: number, onClick: () => void): HTMLElement {
  const size = count >= 100 ? 54 : count >= 10 ? 46 : 40;
  const el = document.createElement("div");
  el.style.cssText = `display:flex;align-items:center;justify-content:center;width:${size}px;height:${size}px;border-radius:9999px;background:#ffffff;color:#0f172a;font-weight:700;font-size:13px;border:2px solid #e2e8f0;box-shadow:0 3px 8px rgba(0,0,0,0.22);cursor:pointer;`;
  el.textContent = count > 999 ? "999+" : String(count);
  el.addEventListener("click", onClick);
  return el;
}

interface KakaoLatLng {
  getLat(): number;
  getLng(): number;
}

interface KakaoPoint {
  x: number;
  y: number;
}

interface KakaoProjection {
  pointFromCoords(latlng: KakaoLatLng): KakaoPoint;
}

interface KakaoMapInstance {
  setCenter(latlng: KakaoLatLng): void;
  panTo(latlng: KakaoLatLng): void;
  getLevel(): number;
  setLevel(level: number, options?: { anchor?: KakaoLatLng }): void;
  getProjection(): KakaoProjection;
}

interface KakaoMarker {
  setMap(map: KakaoMapInstance | null): void;
}

interface KakaoCustomOverlay {
  setMap(map: KakaoMapInstance | null): void;
}

// 장소 검색(services 라이브러리)
export interface KakaoPlace {
  place_name: string;
  address_name: string;
  road_address_name: string;
  x: string; // 경도(lng)
  y: string; // 위도(lat)
}

type KakaoPlacesStatus = "OK" | "ZERO_RESULT" | "ERROR";

interface KakaoPlaces {
  keywordSearch(
    query: string,
    callback: (data: KakaoPlace[], status: KakaoPlacesStatus) => void
  ): void;
}

interface KakaoServices {
  Places: new () => KakaoPlaces;
  Status: { OK: KakaoPlacesStatus };
}

interface KakaoMouseEvent {
  latLng: KakaoLatLng;
}

interface KakaoMapsApi {
  load(callback: () => void): void;
  LatLng: new (lat: number, lng: number) => KakaoLatLng;
  Map: new (
    container: HTMLElement,
    options: { readonly center: KakaoLatLng; readonly level: number }
  ) => KakaoMapInstance;
  Marker: new (options: {
    readonly position: KakaoLatLng;
    readonly image?: KakaoMarkerImage;
  }) => KakaoMarker;
  MarkerImage: new (src: string, size: KakaoSize) => KakaoMarkerImage;
  Size: new (width: number, height: number) => KakaoSize;
  CustomOverlay: new (options: {
    readonly position: KakaoLatLng;
    readonly content: HTMLElement | string;
    readonly yAnchor?: number;
    readonly xAnchor?: number;
    readonly clickable?: boolean;
  }) => KakaoCustomOverlay;
  services?: KakaoServices;
  event: {
    addListener(
      target: KakaoMapInstance | KakaoMarker,
      type: "click" | "rightclick",
      handler: (event: KakaoMouseEvent) => void
    ): void;
    addListener(
      target: KakaoMapInstance,
      type: "idle",
      handler: () => void
    ): void;
  };
}

interface KakaoApi {
  maps: KakaoMapsApi;
}

type KakaoMarkerImage = object;

type KakaoSize = object;

declare global {
  interface Window {
    kakao?: KakaoApi;
  }
}

interface Props {
  reports: Report[];
  center?: Coordinates;
  draftLocation?: Coordinates | null;
  onMarkerClick?: (report: Report) => void;
  onClusterClick?: (reports: Report[]) => void; // 클러스터 클릭 시 묶인 제보들
  onMapClick?: (point: Coordinates) => void;
  onMapRightClick?: (point: Coordinates) => void;
  focus?: Coordinates | null; // 변경 시 해당 좌표로 지도를 이동
}

const SDK_ID = "kakao-maps-sdk";

function loadSdk(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.kakao?.maps) return resolve();
    const key = process.env.NEXT_PUBLIC_KAKAO_MAP_KEY;
    if (!key) return reject(new Error("카카오맵 키가 없습니다."));

    const existing = document.getElementById(SDK_ID) as HTMLScriptElement | null;
    const onLoad = () => {
      if (!window.kakao?.maps) {
        reject(new Error("카카오맵 로드 실패"));
        return;
      }
      window.kakao.maps.load(() => resolve());
    };

    if (existing) {
      existing.addEventListener("load", onLoad);
      return;
    }
    const script = document.createElement("script");
    script.id = SDK_ID;
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${key}&autoload=false&libraries=services`;
    script.onload = onLoad;
    script.onerror = () => reject(new Error("카카오맵 로드 실패"));
    document.head.appendChild(script);
  });
}

export default function KakaoMap({
  reports,
  center,
  draftLocation,
  onMarkerClick,
  onClusterClick,
  onMapClick,
  onMapRightClick,
  focus,
}: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const mapRef = useRef<KakaoMapInstance | null>(null);
  const markersRef = useRef<KakaoCustomOverlay[]>([]);
  const draftMarkerRef = useRef<KakaoMarker | null>(null);
  const clickRef = useRef<Props["onMapClick"]>(undefined);
  const rightClickRef = useRef<Props["onMapRightClick"]>(undefined);
  const renderRef = useRef<() => void>(() => {});
  const [ready, setReady] = useState(false); // 지도 초기화 완료 여부

  useEffect(() => {
    clickRef.current = onMapClick;
    rightClickRef.current = onMapRightClick;
  }, [onMapClick, onMapRightClick]);

  // 지도 초기화
  useEffect(() => {
    let mounted = true;
    loadSdk()
      .then(() => {
        if (!mounted || !ref.current) return;
        const { kakao } = window;
        if (!kakao) return;
        const c = new kakao.maps.LatLng(
          center?.lat ?? 37.5665,
          center?.lng ?? 126.978
        );
        const map = new kakao.maps.Map(ref.current, { center: c, level: 4 });
        mapRef.current = map;
        kakao.maps.event.addListener(map, "click", (event) => {
          clickRef.current?.({
            lat: event.latLng.getLat(),
            lng: event.latLng.getLng(),
          });
        });
        kakao.maps.event.addListener(map, "rightclick", (event) => {
          rightClickRef.current?.({
            lat: event.latLng.getLat(),
            lng: event.latLng.getLng(),
          });
        });
        // 팬/줌 후 클러스터 재계산
        kakao.maps.event.addListener(map, "idle", () => renderRef.current());
        setReady(true); // 지도 준비 완료 → 마커/포커스 effect 재실행 유도
      })
      .catch((e: unknown) => {
        if (e instanceof Error) console.error(e);
      });
    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 화면 픽셀 거리 기준으로 가까운 핀을 묶어, 단건은 물방울 핀 / 여러 건은 숫자 원(클러스터)으로 표시
  const renderMarkers = useCallback(() => {
    const map = mapRef.current;
    const kakao = window.kakao;
    if (!map || !kakao) return;

    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];

    const proj = map.getProjection();
    const pts = reports.map((r) => ({
      r,
      pt: proj.pointFromCoords(new kakao.maps.LatLng(r.lat, r.lng)),
    }));

    const THRESHOLD = 48; // px — 이 안에 들어오면 같은 묶음
    const used = new Array(pts.length).fill(false);

    for (let i = 0; i < pts.length; i++) {
      if (used[i]) continue;
      const group = [pts[i]];
      used[i] = true;
      for (let j = i + 1; j < pts.length; j++) {
        if (used[j]) continue;
        const dx = pts[i].pt.x - pts[j].pt.x;
        const dy = pts[i].pt.y - pts[j].pt.y;
        if (dx * dx + dy * dy <= THRESHOLD * THRESHOLD) {
          group.push(pts[j]);
          used[j] = true;
        }
      }

      if (group.length === 1) {
        const r = group[0].r;
        const overlay = new kakao.maps.CustomOverlay({
          position: new kakao.maps.LatLng(r.lat, r.lng),
          content: buildMarkerElement(r, onMarkerClick),
          yAnchor: 1, // 물방울 하단 끝이 좌표에 닿도록
          xAnchor: 0.5,
          clickable: true,
        });
        overlay.setMap(map);
        markersRef.current.push(overlay);
      } else {
        const lat = group.reduce((s, g) => s + g.r.lat, 0) / group.length;
        const lng = group.reduce((s, g) => s + g.r.lng, 0) / group.length;
        const center = new kakao.maps.LatLng(lat, lng);
        const overlay = new kakao.maps.CustomOverlay({
          position: center,
          content: buildClusterElement(group.length, () => {
            // 클러스터 안의 제보 목록을 패널로 띄움(줌으로 분리 안 되는 경우 대비).
            // 핸들러가 없으면 기존처럼 줌인.
            if (onClusterClick) onClusterClick(group.map((g) => g.r));
            else map.setLevel(Math.max(1, map.getLevel() - 2), { anchor: center });
          }),
          yAnchor: 0.5,
          xAnchor: 0.5,
          clickable: true,
        });
        overlay.setMap(map);
        markersRef.current.push(overlay);
      }
    }
  }, [reports, onMarkerClick, onClusterClick]);

  useEffect(() => {
    renderRef.current = renderMarkers;
  }, [renderMarkers]);

  useEffect(() => {
    renderMarkers();
  }, [renderMarkers, ready]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !window.kakao?.maps) return;
    const { kakao } = window;

    draftMarkerRef.current?.setMap(null);
    draftMarkerRef.current = null;

    if (!draftLocation) return;

    const marker = new kakao.maps.Marker({
      position: new kakao.maps.LatLng(draftLocation.lat, draftLocation.lng),
    });
    marker.setMap(map);
    draftMarkerRef.current = marker;
  }, [draftLocation, ready]);

  // 검색 등으로 focus가 바뀌면 지도를 그 위치로 이동
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !window.kakao?.maps || !focus) return;
    map.panTo(new window.kakao.maps.LatLng(focus.lat, focus.lng));
  }, [focus, ready]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !window.kakao?.maps || !center) return;
    map.panTo(new window.kakao.maps.LatLng(center.lat, center.lng));
  }, [center, ready]);

  return <div ref={ref} className="h-full w-full" />;
}
