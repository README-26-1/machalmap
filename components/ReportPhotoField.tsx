"use client";

import { useEffect, useRef, useState, type DragEvent } from "react";
import { ImagePlus, Loader2, X } from "lucide-react";
import StatusPill from "@/components/StatusPill";
import {
  isSupportedImageFile,
  prepareReportPhoto,
  type PreparedReportPhoto,
} from "@/lib/photoGps";
import type {
  SelectedReportPhoto,
  StatusMessage,
} from "@/components/reportFormTypes";

interface Props {
  readonly photo: SelectedReportPhoto | null;
  readonly status: StatusMessage | null;
  readonly busy: boolean;
  readonly onBusyChange: (busy: boolean) => void;
  readonly onPhotoChange: (photo: SelectedReportPhoto | null) => void;
  readonly onStatusChange: (status: StatusMessage | null) => void;
  readonly onPrepared: (photo: PreparedReportPhoto) => void;
  readonly onClear: () => void;
}

export default function ReportPhotoField({
  photo,
  status,
  busy,
  onBusyChange,
  onPhotoChange,
  onStatusChange,
  onPrepared,
  onClear,
}: Props) {
  const [dragging, setDragging] = useState(false);
  const [previewBroken, setPreviewBroken] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setPreviewBroken(false);
  }, [photo?.previewUrl]);

  async function handleFiles(files: FileList | null): Promise<void> {
    const selectedFile = files?.[0];
    if (!selectedFile) return;
    if (!isSupportedImageFile(selectedFile)) {
      alert("이미지 파일만 업로드할 수 있어요.");
      return;
    }

    onBusyChange(true);
    onStatusChange({ tone: "info", text: "사진 위치 정보를 확인하는 중이에요." });
    try {
      const preparedPhoto = await prepareReportPhoto(selectedFile);
      onPhotoChange({
        file: preparedPhoto.file,
        previewUrl: URL.createObjectURL(preparedPhoto.file),
      });
      onStatusChange(buildPhotoStatus(preparedPhoto));
      onPrepared(preparedPhoto);
    } catch (error) {
      onPhotoChange(null);
      onStatusChange({
        tone: "error",
        text:
          error instanceof Error
            ? error.message
            : "사진을 처리하지 못했어요. 다른 사진으로 다시 시도해 주세요.",
      });
      if (inputRef.current) inputRef.current.value = "";
    } finally {
      onBusyChange(false);
    }
  }

  function openPicker() {
    inputRef.current?.click();
  }

  function clearPhoto() {
    onClear();
    if (inputRef.current) inputRef.current.value = "";
  }

  function onDrop(event: DragEvent<HTMLButtonElement>) {
    event.preventDefault();
    setDragging(false);
    void handleFiles(event.dataTransfer.files);
  }

  return (
    <>
      <label className="mb-2 block text-sm font-medium">사진</label>
      <input
        ref={inputRef}
        type="file"
        accept="image/*,.heic,.heif,image/heic,image/heif"
        onChange={(event) => void handleFiles(event.target.files)}
        className="hidden"
      />

      {photo ? (
        <div className="relative mb-4 overflow-hidden rounded-md border border-line">
          {previewBroken ? (
            <div className="flex min-h-40 w-full flex-col items-center justify-center gap-2 bg-surface px-4 py-8 text-center">
              <ImagePlus size={28} className="text-ink-muted" aria-hidden="true" />
              <p className="text-sm font-semibold text-ink">사진이 선택됐어요.</p>
              <p className="max-w-full break-all text-xs text-ink-muted">
                {photo.file.name}
              </p>
            </div>
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={photo.previewUrl}
              alt="미리보기"
              onError={() => setPreviewBroken(true)}
              className="max-h-56 w-full object-cover"
            />
          )}
          <button
            type="button"
            onClick={clearPhoto}
            aria-label="사진 제거"
            className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-ink/60 text-white transition hover:bg-ink/80"
          >
            <X size={16} />
          </button>
          <button
            type="button"
            onClick={openPicker}
            disabled={busy}
            className="absolute bottom-2 right-2 rounded-md bg-white/90 px-3 py-1.5 text-xs font-semibold text-ink shadow-card transition hover:bg-white disabled:opacity-50"
          >
            {busy ? "처리 중" : "다른 사진 선택"}
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={openPicker}
          onDragOver={(event) => {
            event.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          disabled={busy}
          className={`mb-4 flex w-full flex-col items-center justify-center gap-2 rounded-md border-2 border-dashed px-4 py-8 text-center transition disabled:cursor-wait ${
            dragging
              ? "border-primary bg-primary/5"
              : "border-line bg-surface hover:border-primary/60"
          }`}
        >
          {busy ? (
            <Loader2 size={28} className="animate-spin text-primary" aria-hidden="true" />
          ) : (
            <ImagePlus
              size={28}
              className={dragging ? "text-primary" : "text-ink-muted"}
              aria-hidden="true"
            />
          )}
          <span className="text-sm font-medium text-ink">
            {busy ? "사진을 확인하는 중" : "사진을 끌어다 놓거나 클릭해서 선택"}
          </span>
          <span className="text-xs text-ink-muted">JPG · PNG · HEIC 이미지</span>
        </button>
      )}
      {status && <StatusPill status={status} className="mb-4" />}
    </>
  );
}

function buildPhotoStatus(photo: PreparedReportPhoto): StatusMessage {
  switch (photo.conversion) {
    case "converted":
      return photo.coordinates
        ? {
            tone: "success",
            text: "사진 GPS를 찾고 HEIC 사진을 JPEG로 변환했어요.",
          }
        : {
            tone: "warning",
            text: "HEIC 사진을 JPEG로 변환했지만 위치 정보는 없어요.",
          };
    case "none":
      return photo.coordinates
        ? { tone: "success", text: "사진에서 GPS 위치를 찾았어요." }
        : {
            tone: "warning",
            text: "사진에 위치 정보가 없어요.",
          };
  }
}
