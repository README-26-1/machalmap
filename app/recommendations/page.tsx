"use client";

import { useEffect, useMemo, useState } from "react";
import { Camera, MapPin, Plus, Sparkles, X } from "lucide-react";
import Button from "@/components/Button";
import PlaceMap from "@/components/PlaceMap";
import { apiGet, apiSend, uploadImage } from "@/lib/api";
import { FavoritePlace, PlaceRecommendation } from "@/types/place";

const categories = [
  { value: "cafe", label: "카페" },
  { value: "park", label: "공원" },
  { value: "food", label: "식당" },
  { value: "walk", label: "산책" },
  { value: "study", label: "공부" },
  { value: "exercise", label: "운동" },
  { value: "other", label: "기타" },
];

type PlacePin =
  | (FavoritePlace & { pinType: "favorite" })
  | (PlaceRecommendation & { pinType: "recommendation" });

export default function RecommendationsPage() {
  const [favorites, setFavorites] = useState<FavoritePlace[]>([]);
  const [recommendations, setRecommendations] = useState<PlaceRecommendation[]>([]);
  const [selected, setSelected] = useState<PlacePin | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [name, setName] = useState("");
  const [category, setCategory] = useState("cafe");
  const [description, setDescription] = useState("");
  const [recommenderNote, setRecommenderNote] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [busy, setBusy] = useState(false);

  const pins = useMemo<PlacePin[]>(
    () => [
      ...favorites.map((place) => ({ ...place, pinType: "favorite" as const })),
      ...recommendations.map((place) => ({ ...place, pinType: "recommendation" as const })),
    ],
    [favorites, recommendations]
  );

  async function load() {
    const data = await apiGet<{
      favorites: FavoritePlace[];
      recommendations: PlaceRecommendation[];
    }>("/api/recommendations");
    setFavorites(data.favorites);
    setRecommendations(data.recommendations);
  }

  useEffect(() => {
    load().catch(() => {});
  }, []);

  function pickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const next = e.target.files?.[0];
    if (!next) return;
    setFile(next);
    setPreview(URL.createObjectURL(next));
  }

  function getLocation() {
    navigator.geolocation.getCurrentPosition(
      (pos) => setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => alert("위치 권한이 거부되었습니다.")
    );
  }

  async function addPlace() {
    if (!name.trim()) return alert("장소 이름을 입력해 주세요.");
    if (!file) return alert("장소 사진을 올려 주세요.");
    if (!coords) return alert("위치를 먼저 가져와 주세요.");
    setBusy(true);
    try {
      const imageUrl = await uploadImage(file);
      await apiSend("/api/recommendations", "POST", {
        name,
        category,
        image_url: imageUrl,
        description,
        recommender_note: recommenderNote,
        note: recommenderNote,
        lat: coords.lat,
        lng: coords.lng,
      });
      setName("");
      setDescription("");
      setRecommenderNote("");
      setFile(null);
      setPreview("");
      setFormOpen(false);
      await load();
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="relative h-[calc(100vh-4rem)] w-full overflow-hidden pb-16">
      <div className="absolute left-0 right-0 top-0 z-20 bg-white/95 px-4 py-3 shadow-card backdrop-blur">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles size={20} className="text-primary" />
            <h1 className="text-lg font-bold">장소 추천</h1>
          </div>
          <button
            onClick={() => setFormOpen(true)}
            className="flex items-center gap-1 text-sm font-semibold text-primary"
          >
            <Plus size={16} /> 추천하기
          </button>
        </div>
      </div>

      <PlaceMap places={pins} onMarkerClick={setSelected} />

      <div className="absolute bottom-20 left-4 right-4 z-20 flex gap-2 overflow-x-auto">
        {recommendations.map((place) => (
          <button
            key={place.id}
            onClick={() => setSelected({ ...place, pinType: "recommendation" })}
            className="min-w-56 rounded-md bg-white p-3 text-left shadow-float"
          >
            <p className="font-semibold">{place.name}</p>
            <p className="line-clamp-2 text-xs text-ink-muted">{place.reason}</p>
          </button>
        ))}
      </div>

      {formOpen && (
        <div className="absolute inset-x-0 bottom-0 z-40 max-h-[86vh] overflow-y-auto rounded-t-lg bg-white p-4 shadow-float">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-bold">사진으로 장소 추천</h2>
            <button onClick={() => setFormOpen(false)} className="text-ink-muted">
              <X size={20} />
            </button>
          </div>
          <label className="mb-2 block text-sm font-medium">장소 사진</label>
          <input type="file" accept="image/*" onChange={pickFile} className="mb-2" />
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt="장소 미리보기" className="mb-3 max-h-48 w-full rounded-md object-cover" />
          ) : (
            <div className="mb-3 flex h-32 items-center justify-center rounded-md bg-surface text-ink-muted">
              <Camera size={24} />
            </div>
          )}
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="장소 이름"
            className="mb-2 h-11 w-full rounded-md border border-line px-3 text-sm"
          />
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="mb-2 h-11 w-full rounded-md border border-line px-3 text-sm"
          >
            {categories.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="장소에 대한 대략적인 설명"
            className="mb-2 w-full rounded-md border border-line p-3 text-sm"
          />
          <textarea
            value={recommenderNote}
            onChange={(e) => setRecommenderNote(e.target.value)}
            rows={2}
            placeholder="추천자가 알려주고 싶은 정보"
            className="mb-3 w-full rounded-md border border-line p-3 text-sm"
          />
          <Button variant="secondary" onClick={getLocation} className="mb-2 w-full">
            <MapPin size={16} /> 현재 위치 가져오기
          </Button>
          {coords && (
            <p className="mb-3 text-xs text-ink-muted">
              위도 {coords.lat.toFixed(5)} / 경도 {coords.lng.toFixed(5)}
            </p>
          )}
          <Button onClick={addPlace} disabled={busy} className="w-full">
            {busy ? "등록 중..." : "추천 등록"}
          </Button>
        </div>
      )}

      {selected && (
        <div className="absolute inset-x-0 bottom-0 z-30 rounded-t-lg bg-white p-4 shadow-float">
          <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-line" />
          <div className="mb-2 flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold text-primary">
                {selected.pinType === "favorite" ? "내가 좋아한 장소" : "추천 장소"}
              </p>
              <h2 className="text-lg font-bold">{selected.name}</h2>
            </div>
            <button onClick={() => setSelected(null)} className="text-ink-muted">
              닫기
            </button>
          </div>
          {selected.image_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={selected.image_url} alt={selected.name} className="mb-3 max-h-52 w-full rounded-md object-cover" />
          )}
          <p className="text-sm text-ink">{selected.description || "설명이 아직 없습니다."}</p>
          {"reason" in selected && <p className="mt-2 text-xs text-ink-muted">{selected.reason}</p>}
          {selected.recommender_note && (
            <p className="mt-2 rounded-md bg-surface p-3 text-sm text-ink-muted">
              {selected.recommender_note}
            </p>
          )}
        </div>
      )}
    </main>
  );
}
