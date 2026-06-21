"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, MapPin, Trash2 } from "lucide-react";
import Button from "@/components/Button";
import LocationPicker from "@/components/LocationPicker";
import { apiGet, apiSend } from "@/lib/api";
import { supabase } from "@/lib/supabaseClient";
import { Coordinates } from "@/types/report";
import { InterestArea } from "@/types/interest";

export default function InterestsPage() {
  const router = useRouter();
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [items, setItems] = useState<InterestArea[] | null>(null);
  const [label, setLabel] = useState("");
  const [coords, setCoords] = useState<Coordinates | null>(null);
  const [busy, setBusy] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);

  async function load() {
    const data = await apiGet<InterestArea[]>("/api/me/interests");
    setItems(data);
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      const ok = !!data.session;
      setAuthed(ok);
      if (ok) load().catch(() => setItems([]));
    });
  }, []);

  function getLocation() {
    navigator.geolocation.getCurrentPosition(
      (pos) => setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => alert("위치 권한이 거부되었습니다.")
    );
  }

  async function add() {
    if (!label.trim()) return alert("이름을 입력해 주세요.");
    if (!coords) return alert("위치를 먼저 가져와 주세요.");
    setBusy(true);
    try {
      await apiSend<InterestArea>("/api/me/interests", "POST", {
        label: label.trim(),
        lat: coords.lat,
        lng: coords.lng,
      });
      setLabel("");
      setCoords(null);
      await load();
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    try {
      await apiSend(`/api/me/interests/${id}`, "DELETE");
      await load();
    } catch (e) {
      alert((e as Error).message);
    }
  }

  if (authed === false) {
    return (
      <main className="mx-auto max-w-md p-6 text-center">
        <p className="mb-4 text-ink-muted">로그인이 필요합니다.</p>
        <Button onClick={() => router.push("/login")}>로그인</Button>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-md p-4">
      <div className="mb-4 flex items-center gap-2">
        <Link
          href="/me"
          className="flex h-9 w-9 items-center justify-center rounded-full text-ink-muted transition hover:bg-surface"
          aria-label="뒤로"
        >
          <ChevronLeft size={20} />
        </Link>
        <h1 className="text-lg font-bold">관심 지역 설정</h1>
      </div>

      <p className="mb-4 text-sm text-ink-muted">
        자주 다니는 지역을 등록해 두면, 앞으로 해당 지역의 알림·요약 기능에 활용돼요.
      </p>

      {/* 추가 폼 */}
      <section className="mb-6 rounded-lg border border-line bg-white p-4 shadow-card">
        <label className="mb-1 block text-sm font-medium">지역 이름</label>
        <input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="예: 집, 회사, 학교"
          className="mb-3 h-11 w-full rounded-md border border-line px-3 text-sm"
        />
        <div className="mb-2 grid grid-cols-2 gap-2">
          <Button variant="secondary" onClick={getLocation}>
            현재 위치
          </Button>
          <Button variant="secondary" onClick={() => setPickerOpen(true)}>
            지도에서 선택
          </Button>
        </div>
        {coords && (
          <p className="mb-3 text-xs text-ink-muted">
            위도 {coords.lat.toFixed(5)} / 경도 {coords.lng.toFixed(5)}
          </p>
        )}
        <Button onClick={add} disabled={busy} className="w-full">
          {busy ? "추가 중…" : "관심 지역 추가"}
        </Button>
      </section>

      {/* 목록 */}
      {items === null ? (
        <p className="text-ink-muted">불러오는 중…</p>
      ) : items.length === 0 ? (
        <p className="py-10 text-center text-ink-muted">등록된 관심 지역이 없어요.</p>
      ) : (
        <ul className="space-y-2">
          {items.map((it) => (
            <li
              key={it.id}
              className="flex items-center gap-3 rounded-lg border border-line bg-white p-3 shadow-card"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10 text-primary">
                <MapPin size={18} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-ink">{it.label}</p>
                <p className="text-xs text-ink-muted">
                  {it.lat.toFixed(4)}, {it.lng.toFixed(4)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => remove(it.id)}
                aria-label="삭제"
                className="flex h-9 w-9 items-center justify-center rounded-full text-ink-muted transition hover:bg-surface hover:text-marker-danger"
              >
                <Trash2 size={18} />
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* 지도에서 위치 선택 (검색 포함) */}
      <LocationPicker
        open={pickerOpen}
        initial={coords}
        onClose={() => setPickerOpen(false)}
        onSelect={(c) => {
          setCoords(c);
          setPickerOpen(false);
        }}
      />
    </main>
  );
}
