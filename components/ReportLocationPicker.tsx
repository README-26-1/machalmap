"use client";

import { useState } from "react";
import { CheckCircle2, MapPin, Navigation } from "lucide-react";
import Button from "@/components/Button";
import KakaoMap from "@/components/KakaoMap";
import StatusPill from "@/components/StatusPill";
import type {
  LocationSource,
  StatusMessage,
} from "@/components/reportFormTypes";
import type { Coordinates } from "@/types/report";

const DEFAULT_MAP_CENTER: Coordinates = { lat: 37.5665, lng: 126.978 };

interface Props {
  readonly coords: Coordinates | null;
  readonly source: LocationSource | null;
  readonly status: StatusMessage | null;
  readonly onSelect: (point: Coordinates, source: LocationSource) => void;
  readonly onStatusChange: (status: StatusMessage | null) => void;
}

export default function ReportLocationPicker({
  coords,
  source,
  status,
  onSelect,
  onStatusChange,
}: Props) {
  const [mapPickerOpen, setMapPickerOpen] = useState(false);

  function getLocation() {
    if (!navigator.geolocation) {
      onStatusChange({
        tone: "error",
        text: "이 브라우저에서는 현재 위치를 가져올 수 없어요. 지도에서 위치를 선택해 주세요.",
      });
      return;
    }

    onStatusChange({ tone: "info", text: "현재 위치를 확인하는 중이에요." });
    navigator.geolocation.getCurrentPosition(
      (position) => {
        onSelect(
          { lat: position.coords.latitude, lng: position.coords.longitude },
          "current"
        );
        onStatusChange({ tone: "success", text: "현재 위치를 입력했어요." });
      },
      () => {
        onStatusChange({
          tone: "warning",
          text: "위치 권한이 없어요. 지도에서 위치를 선택해 주세요.",
        });
      }
    );
  }

  function selectMapLocation(point: Coordinates) {
    onSelect(point, "map");
    onStatusChange({ tone: "success", text: "지도에서 선택한 위치를 입력했어요." });
  }

  return (
    <section className="mb-4 rounded-md border border-line bg-surface p-3">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-ink">위치</h2>
          <p className="mt-1 text-xs text-ink-muted">
            {coords
              ? `${locationSourceLabel(source)} 위도 ${coords.lat.toFixed(
                  5
                )} / 경도 ${coords.lng.toFixed(5)}`
              : "사진 GPS, 현재 위치, 지도 선택 중 하나로 입력해 주세요."}
          </p>
        </div>
        {coords && <CheckCircle2 size={20} className="shrink-0 text-primary" />}
      </div>

      {status && <StatusPill status={status} className="mb-3" />}

      <div className="grid grid-cols-2 gap-2">
        <Button
          type="button"
          variant="secondary"
          onClick={getLocation}
          className="gap-2 px-2"
        >
          <Navigation size={16} aria-hidden="true" />
          현재 위치
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={() => setMapPickerOpen((open) => !open)}
          className="gap-2 px-2"
        >
          <MapPin size={16} aria-hidden="true" />
          지도 선택
        </Button>
      </div>

      {mapPickerOpen && (
        <div className="mt-3 overflow-hidden rounded-md border border-line bg-white">
          <div className="h-64">
            <KakaoMap
              reports={[]}
              center={coords ?? DEFAULT_MAP_CENTER}
              draftLocation={coords}
              onMapClick={selectMapLocation}
              onMapRightClick={selectMapLocation}
            />
          </div>
          <p className="border-t border-line px-3 py-2 text-xs text-ink-muted">
            지도에서 원하는 위치를 누르면 기본 핀이 표시돼요.
          </p>
        </div>
      )}
    </section>
  );
}

function locationSourceLabel(source: LocationSource | null): string {
  switch (source) {
    case "initial":
      return "지도 전달 위치";
    case "photo":
      return "사진 GPS";
    case "current":
      return "현재 위치";
    case "map":
      return "지도 선택";
    default:
      return "선택한 위치";
  }
}

