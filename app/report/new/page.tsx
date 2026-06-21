"use client";

import { useEffect, useState } from "react";
import ReportForm from "@/components/ReportForm";
import { toCoordinates } from "@/lib/coordinates";
import { Coordinates } from "@/types/report";

function parseCoordinate(value: string | null): number | null {
  if (!value) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export default function NewReportPage() {
  const [initialCoords, setInitialCoords] = useState<Coordinates | null>(null);

  // 지도 우클릭으로 넘어온 ?lat=&lng= 좌표를 폼에 미리 채운다.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const lat = parseCoordinate(params.get("lat"));
    const lng = parseCoordinate(params.get("lng"));
    const coordinates = toCoordinates(lat, lng);
    if (!coordinates) return;
    setInitialCoords(coordinates);
  }, []);

  return (
    <main className="mx-auto max-w-md p-4">
      <h1 className="mb-4 text-lg font-bold">제보하기</h1>
      <ReportForm initialCoords={initialCoords} />
    </main>
  );
}
