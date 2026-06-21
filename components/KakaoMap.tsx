"use client";

import { useEffect, useRef } from "react";
import { Coordinates, Report } from "@/types/report";
import { markerColor } from "@/lib/markerColor";

interface KakaoLatLng {
  getLat(): number;
  getLng(): number;
}

interface KakaoMapInstance {
  setCenter(latlng: KakaoLatLng): void;
  panTo(latlng: KakaoLatLng): void;
}

interface KakaoMarker {
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
  services?: KakaoServices;
  event: {
    addListener(
      target: KakaoMapInstance | KakaoMarker,
      type: "click" | "rightclick",
      handler: (event: KakaoMouseEvent) => void
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
  onMapClick?: (point: Coordinates) => void;
  onMapRightClick?: (point: Coordinates) => void;
  onMapClick?: (point: Coordinates) => void;
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
  onMapClick,
  onMapRightClick,
  onMapClick,
  focus,
}: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const mapRef = useRef<KakaoMapInstance | null>(null);
  const markersRef = useRef<KakaoMarker[]>([]);
  const draftMarkerRef = useRef<KakaoMarker | null>(null);
  const clickRef = useRef<Props["onMapClick"]>(undefined);
  const rightClickRef = useRef<Props["onMapRightClick"]>(undefined);
  const clickRef = useRef<Props["onMapClick"]>(undefined);

  clickRef.current = onMapClick;
  rightClickRef.current = onMapRightClick;
  clickRef.current = onMapClick;

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
        kakao.maps.event.addListener(map, "click", (event) => {
          clickRef.current?.({
            lat: event.latLng.getLat(),
            lng: event.latLng.getLng(),
          });
        });
      })
      .catch((e: unknown) => {
        if (e instanceof Error) console.error(e);
      });
    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 마커 갱신
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !window.kakao) return;
    const { kakao } = window;

    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];

    reports.forEach((r) => {
      const pos = new kakao.maps.LatLng(r.lat, r.lng);
      const color = markerColor(r.category, r.status);
      const svg = encodeURIComponent(
        `<svg xmlns='http://www.w3.org/2000/svg' width='28' height='36'><path d='M14 0C6 0 0 6 0 14c0 9 14 22 14 22s14-13 14-22C28 6 22 0 14 0z' fill='${color}'/><circle cx='14' cy='14' r='5' fill='white'/></svg>`
      );
      const image = new kakao.maps.MarkerImage(
        `data:image/svg+xml,${svg}`,
        new kakao.maps.Size(28, 36)
      );
      const marker = new kakao.maps.Marker({ position: pos, image });
      marker.setMap(map);
      kakao.maps.event.addListener(marker, "click", () => onMarkerClick?.(r));
      markersRef.current.push(marker);
    });
  }, [reports, onMarkerClick]);

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
  }, [draftLocation]);

  // 검색 등으로 focus가 바뀌면 지도를 그 위치로 이동
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !window.kakao?.maps || !focus) return;
    map.panTo(new window.kakao.maps.LatLng(focus.lat, focus.lng));
  }, [focus]);

  return <div ref={ref} className="h-full w-full" />;
}
