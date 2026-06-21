"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/Button";
import { apiSend, uploadImage } from "@/lib/api";
import { supabase } from "@/lib/supabaseClient";
import { CATEGORIES, Category, Coordinates, Report } from "@/types/report";

function parseCoordinate(value: string | null): number | null {
  if (!value) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export default function NewReportPage() {
  const router = useRouter();
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>("");
  const [category, setCategory] = useState<Category>(CATEGORIES[0]);
  const [description, setDescription] = useState("");
  const [coords, setCoords] = useState<Coordinates | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setAuthed(!!data.session));
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const lat = parseCoordinate(params.get("lat"));
    const lng = parseCoordinate(params.get("lng"));
    if (lat === null || lng === null) return;
    setCoords({ lat, lng });
  }, []);

  function pickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
  }

  function getLocation() {
    navigator.geolocation.getCurrentPosition(
      (pos) => setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => alert("위치 권한이 거부되었습니다. 지도에서 직접 선택하는 기능은 추후 추가됩니다.")
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
      router.push("/");
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  if (authed === false) {
    return (
      <main className="mx-auto max-w-md p-6 text-center">
        <p className="mb-4 text-ink-muted">제보하려면 로그인이 필요합니다.</p>
        <Button onClick={() => router.push("/login")}>로그인하러 가기</Button>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-md p-4">
      <h1 className="mb-4 text-lg font-bold">제보하기</h1>

      <label className="mb-2 block text-sm font-medium">사진</label>
      <input type="file" accept="image/*" onChange={pickFile} className="mb-2" />
      {preview && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={preview} alt="미리보기" className="mb-4 max-h-56 w-full rounded-md object-cover" />
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
    </main>
  );
}
