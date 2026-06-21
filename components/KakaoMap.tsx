"use client";

import { useEffect, useRef } from "react";
import { Report } from "@/types/report";
import { markerColor } from "@/lib/markerColor";

declare global {
  interface Window {
    kakao: any;
  }
}

interface Props {
  reports: Report[];
  center?: { lat: number; lng: number };
  onMarkerClick?: (report: Report) => void;
}

const SDK_ID = "kakao-maps-sdk";

function loadSdk(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.kakao?.maps) return resolve();
    const key = process.env.NEXT_PUBLIC_KAKAO_MAP_KEY;
    if (!key) return reject(new Error("카카오맵 키가 없습니다."));

    const existing = document.getElementById(SDK_ID) as HTMLScriptElement | null;
    const onLoad = () => window.kakao.maps.load(() => resolve());

    if (existing) {
      existing.addEventListener("load", onLoad);
      return;
    }
    const script = document.createElement("script");
    script.id = SDK_ID;
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${key}&autoload=false`;
    script.onload = onLoad;
    script.onerror = () => reject(new Error("카카오맵 로드 실패"));
    document.head.appendChild(script);
  });
}

export default function KakaoMap({ reports, center, onMarkerClick }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);

  // 지도 초기화
  useEffect(() => {
    let mounted = true;
    loadSdk()
      .then(() => {
        if (!mounted || !ref.current) return;
        const { kakao } = window;
        const c = new kakao.maps.LatLng(
          center?.lat ?? 37.5665,
          center?.lng ?? 126.978
        );
        mapRef.current = new kakao.maps.Map(ref.current, { center: c, level: 4 });
      })
      .catch((e) => console.error(e));
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

  return <div ref={ref} className="h-full w-full" />;
}
