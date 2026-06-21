"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/Button";
import ReportLocationPicker from "@/components/ReportLocationPicker";
import ReportPhotoField from "@/components/ReportPhotoField";
import { apiSend, uploadImage } from "@/lib/api";
import { supabase } from "@/lib/supabaseClient";
import { CATEGORIES, isCategory, type Category, type Coordinates, type Report } from "@/types/report";
import type { PreparedReportPhoto } from "@/lib/photoGps";
import type {
  LocationSource,
  SelectedReportPhoto,
  StatusMessage,
} from "@/components/reportFormTypes";

interface Props {
  readonly onSuccess?: () => void;
  readonly onCancel?: () => void;
  readonly initialCoords?: Coordinates | null;
}

export default function ReportForm({ onSuccess, onCancel, initialCoords }: Props) {
  const router = useRouter();
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [photo, setPhoto] = useState<SelectedReportPhoto | null>(null);
  const [photoStatus, setPhotoStatus] = useState<StatusMessage | null>(null);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [category, setCategory] = useState<Category>(CATEGORIES[0]);
  const [description, setDescription] = useState("");
  const [coords, setCoords] = useState<Coordinates | null>(initialCoords ?? null);
  const [locationSource, setLocationSource] = useState<LocationSource | null>(
    initialCoords ? "initial" : null
  );
  const [locationStatus, setLocationStatus] = useState<StatusMessage | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setAuthed(!!data.session));
  }, []);

  useEffect(() => {
    if (!initialCoords) return;
    setCoords(initialCoords);
    setLocationSource("initial");
  }, [initialCoords]);

  useEffect(() => {
    return () => {
      if (photo) URL.revokeObjectURL(photo.previewUrl);
    };
  }, [photo]);

  function handlePreparedPhoto(preparedPhoto: PreparedReportPhoto) {
    if (preparedPhoto.coordinates) {
      setCoords(preparedPhoto.coordinates);
      setLocationSource("photo");
      setLocationStatus({
        tone: "success",
        text: "사진에 저장된 GPS 위치를 자동으로 입력했어요.",
      });
      return;
    }
    setLocationStatus({
      tone: "warning",
      text: "사진에 위치 정보가 없어요. 현재 위치를 가져오거나 지도에서 위치를 선택해 주세요.",
    });
  }

  function clearPhoto() {
    setPhoto(null);
    setPhotoStatus(null);
    if (locationSource !== "photo") return;
    setCoords(initialCoords ?? null);
    setLocationSource(initialCoords ? "initial" : null);
    setLocationStatus(
      initialCoords ? { tone: "success", text: "지도에서 전달된 위치를 다시 사용해요." } : null
    );
  }

  function selectLocation(point: Coordinates, source: LocationSource) {
    setCoords(point);
    setLocationSource(source);
  }

  function changeCategory(value: string) {
    if (isCategory(value)) setCategory(value);
  }

  async function submit() {
    if (!coords) {
      setLocationStatus({
        tone: "warning",
        text: "위치를 먼저 입력해 주세요. 현재 위치 또는 지도 선택을 사용할 수 있어요.",
      });
      return;
    }

    setBusy(true);
    try {
      const image_url = photo ? await uploadImage(photo.file) : null;
      await apiSend<Report>("/api/reports", "POST", {
        image_url,
        category,
        description,
        lat: coords.lat,
        lng: coords.lng,
      });
      if (onSuccess) onSuccess();
      else router.push("/");
    } catch (error) {
      alert(error instanceof Error ? error.message : "제보 등록에 실패했어요.");
    } finally {
      setBusy(false);
    }
  }

  if (authed === false) {
    return (
      <div className="text-center">
        <p className="mb-4 text-ink-muted">제보하려면 로그인이 필요합니다.</p>
        <Button onClick={() => router.push("/login")} className="w-full">
          로그인하러 가기
        </Button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="mt-3 w-full text-center text-sm text-ink-muted"
          >
            닫기
          </button>
        )}
      </div>
    );
  }

  return (
    <div>
      <ReportPhotoField
        photo={photo}
        status={photoStatus}
        busy={photoBusy}
        onBusyChange={setPhotoBusy}
        onPhotoChange={setPhoto}
        onStatusChange={setPhotoStatus}
        onPrepared={handlePreparedPhoto}
        onClear={clearPhoto}
      />

      <label className="mb-1 block text-sm font-medium">카테고리</label>
      <select
        value={category}
        onChange={(event) => changeCategory(event.target.value)}
        className="mb-4 h-12 w-full rounded-md border border-line px-3"
      >
        {CATEGORIES.map((item) => (
          <option key={item} value={item}>
            {item}
          </option>
        ))}
      </select>

      <label className="mb-1 block text-sm font-medium">설명</label>
      <textarea
        value={description}
        onChange={(event) => setDescription(event.target.value)}
        rows={3}
        placeholder="어떤 불편/위험인지 간단히 적어주세요."
        className="mb-4 w-full rounded-md border border-line p-3 text-sm"
      />

      <ReportLocationPicker
        coords={coords}
        source={locationSource}
        status={locationStatus}
        onSelect={selectLocation}
        onStatusChange={setLocationStatus}
      />

      <Button onClick={submit} disabled={busy || photoBusy} className="w-full">
        {busy ? "등록 중…" : "제보 등록"}
      </Button>
    </div>
  );
}
