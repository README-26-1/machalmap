import { NextRequest } from "next/server";
import { getServiceClient } from "@/lib/supabaseServer";
import { getUserFromRequest, jsonError } from "@/lib/auth";

const categoryLabels: Record<string, string> = {
  cafe: "카페",
  park: "공원",
  food: "식당",
  walk: "산책",
  study: "공부",
  exercise: "운동",
  other: "기타",
};

export async function GET(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user) return jsonError("UNAUTHORIZED", "로그인이 필요합니다.", 401);

  const supabase = getServiceClient();
  const { data: favorites, error: favError } = await supabase
    .from("favorite_places")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (favError) {
    if (favError.code === "42P01") return Response.json({ data: { favorites: [], recommendations: [] } });
    return jsonError("DB_ERROR", favError.message, 500);
  }

  const preferred = new Map<string, number>();
  for (const place of favorites ?? []) {
    preferred.set(place.category, (preferred.get(place.category) ?? 0) + 1);
  }

  const { data: reports } = await supabase
    .from("favorite_places")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(30);

  const recommendations = (reports ?? [])
    .filter((place: any) => place.user_id !== user.id)
    .map((place: any) => {
      const categoryWeight = preferred.get(place.category) ?? 0;
      return {
        id: place.id,
        name: place.name,
        category: place.category,
        image_url: place.image_url,
        description: place.description ?? "",
        lat: place.lat,
        lng: place.lng,
        reason:
          categoryWeight > 0
            ? `내가 좋아한 ${categoryLabels[place.category] ?? place.category} 성향과 가까워요.`
            : "다른 사용자가 사진과 함께 추천한 장소예요.",
        recommender_note: place.recommender_note ?? null,
        score: categoryWeight * 5 + (place.image_url ? 2 : 0),
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 8);

  return Response.json({ data: { favorites: favorites ?? [], recommendations } });
}

export async function POST(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user) return jsonError("UNAUTHORIZED", "로그인이 필요합니다.", 401);

  const body = await req.json().catch(() => null);
  if (
    !body?.name ||
    !body?.category ||
    !body?.image_url ||
    typeof body.lat !== "number" ||
    typeof body.lng !== "number"
  ) {
    return jsonError("BAD_REQUEST", "장소 이름, 카테고리, 사진, 좌표가 필요합니다.", 400);
  }

  const supabase = getServiceClient();
  const { data, error } = await supabase
    .from("favorite_places")
    .insert({
      user_id: user.id,
      name: body.name,
      category: body.category,
      image_url: body.image_url,
      description: body.description ?? "",
      lat: body.lat,
      lng: body.lng,
      note: body.note ?? null,
      recommender_note: body.recommender_note ?? null,
    })
    .select()
    .single();

  if (error) return jsonError("DB_ERROR", error.message, 500);
  return Response.json({ data }, { status: 201 });
}
