"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ImagePlus, X } from "lucide-react";
import Button from "@/components/Button";
import { apiSend, uploadImage } from "@/lib/api";
import { supabase } from "@/lib/supabaseClient";
import { CATEGORIES, Category, Report } from "@/types/report";

interface Props {
  // 등록 성공 후 처리 (지정 안 하면 홈으로 이동). 모달에서는 닫기+새로고침에 사용.
  readonly onSuccess?: () => void;
  // 취소/닫기 (모달에서 로그인 안내 시 닫기 버튼 등)
  readonly onCancel?: () => void;
}

export default function ReportForm({ onSuccess, onCancel }: Props) {
  const router = useRouter();
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>("");
  const [category, setCategory] = useState<Category>(CATEGORIES[0]);
  const [description, setDescription] = useState("");
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [busy, setBusy] = useState(false);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setAuthed(!!data.session));
  }, []);

  function handleFiles(files: FileList | null) {
    const f = files?.[0];
    if (!f) return;
    if (!f.type.startsWith("image/")) {
      alert("이미지 파일만 업로드할 수 있어요.");
      return;
    }
    setFile(f);
    setPreview(URL.createObjectURL(f));
  }

  function openPicker() {
    inputRef.current?.click();
  }

  function clearFile() {
    setFile(null);
    setPreview("");
    if (inputRef.current) inputRef.current.value = "";
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    handleFiles(e.dataTransfer.files);
  }

  function getLocation() {
    navigator.geolocation.getCurrentPosition(
      (pos) => setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () =>
        alert(
          "위치 권한이 거부되었습니다. 지도에서 직접 선택하는 기능은 추후 추가됩니다."
        )
    );
  }

  async function submit() {
    if (!coords) return alert("위치를 먼저 가져와 주세요.");
    setBusy(true);
    try {
      let image_url: string | null = null;
      if (file) image_url = await uploadImage(file);
      await apiSend<Report>("/api/reports", "POST", {
        image_url,
        category,
        description,
        lat: coords.lat,
        lng: coords.lng,
      });
      if (onSuccess) onSuccess();
      else router.push("/");
    } catch (e) {
      alert((e as Error).message);
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
      <label className="mb-2 block text-sm font-medium">사진</label>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={(e) => handleFiles(e.target.files)}
        className="hidden"
      />

      {preview ? (
        <div className="relative mb-4 overflow-hidden rounded-md border border-line">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={preview}
            alt="미리보기"
            className="max-h-56 w-full object-cover"
          />
          <button
            type="button"
            onClick={clearFile}
            aria-label="사진 제거"
            className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-ink/60 text-white transition hover:bg-ink/80"
          >
            <X size={16} />
          </button>
          <button
            type="button"
            onClick={openPicker}
            className="absolute bottom-2 right-2 rounded-md bg-white/90 px-3 py-1.5 text-xs font-semibold text-ink shadow-card transition hover:bg-white"
          >
            다른 사진 선택
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={openPicker}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          className={`mb-4 flex w-full flex-col items-center justify-center gap-2 rounded-md border-2 border-dashed px-4 py-8 text-center transition ${
            dragging
              ? "border-primary bg-primary/5"
              : "border-line bg-surface hover:border-primary/60"
          }`}
        >
          <ImagePlus
            size={28}
            className={dragging ? "text-primary" : "text-ink-muted"}
            aria-hidden="true"
          />
          <span className="text-sm font-medium text-ink">
            사진을 끌어다 놓거나 클릭해서 선택
          </span>
          <span className="text-xs text-ink-muted">JPG · PNG 이미지</span>
        </button>
      )}

      <label className="mb-1 block text-sm font-medium">카테고리</label>
      <select
        value={category}
        onChange={(e) => setCategory(e.target.value as Category)}
        className="mb-4 h-12 w-full rounded-md border border-line px-3"
      >
        {CATEGORIES.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </select>

      <label className="mb-1 block text-sm font-medium">설명</label>
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        rows={3}
        placeholder="어떤 불편/위험인지 간단히 적어주세요."
        className="mb-4 w-full rounded-md border border-line p-3 text-sm"
      />

      <Button variant="secondary" onClick={getLocation} className="mb-2 w-full">
        현재 위치 가져오기
      </Button>
      {coords && (
        <p className="mb-4 text-xs text-ink-muted">
          위도 {coords.lat.toFixed(5)} / 경도 {coords.lng.toFixed(5)}
        </p>
      )}

      <Button onClick={submit} disabled={busy} className="w-full">
        {busy ? "등록 중…" : "제보 등록"}
      </Button>
    </div>
  );
}
