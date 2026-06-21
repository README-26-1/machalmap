"use client";

import { useEffect, useRef } from "react";
import { FavoritePlace, PlaceRecommendation } from "@/types/place";

declare global {
  interface Window {
    kakao: any;
  }
}

type PlacePin =
  | (FavoritePlace & { pinType: "favorite" })
  | (PlaceRecommendation & { pinType: "recommendation" });

interface Props {
  places: PlacePin[];
  center?: { lat: number; lng: number };
  onMarkerClick?: (place: PlacePin) => void;
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

export default function PlaceMap({ places, center, onMarkerClick }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);

  useEffect(() => {
    let mounted = true;
    loadSdk()
      .then(() => {
        if (!mounted || !ref.current) return;
        const { kakao } = window;
        const c = new kakao.maps.LatLng(center?.lat ?? 37.5665, center?.lng ?? 126.978);
        mapRef.current = new kakao.maps.Map(ref.current, { center: c, level: 5 });
      })
      .catch((e) => console.error(e));
    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !window.kakao) return;
    const { kakao } = window;

    markersRef.current.forEach((marker) => marker.setMap(null));
    markersRef.current = [];

    places.forEach((place) => {
      const color = place.pinType === "favorite" ? "#0F9F8F" : "#F59E0B";
      const pos = new kakao.maps.LatLng(place.lat, place.lng);
      const svg = encodeURIComponent(
        `<svg xmlns='http://www.w3.org/2000/svg' width='30' height='38'><path d='M15 0C6.7 0 0 6.5 0 14.5 0 24 15 38 15 38s15-14 15-23.5C30 6.5 23.3 0 15 0z' fill='${color}'/><circle cx='15' cy='14.5' r='6' fill='white'/></svg>`
      );
      const image = new kakao.maps.MarkerImage(
        `data:image/svg+xml,${svg}`,
        new kakao.maps.Size(30, 38)
      );
      const marker = new kakao.maps.Marker({ position: pos, image });
      marker.setMap(map);
      kakao.maps.event.addListener(marker, "click", () => onMarkerClick?.(place));
      markersRef.current.push(marker);
    });
  }, [places, onMarkerClick]);

  return <div ref={ref} className="h-full w-full" />;
}
