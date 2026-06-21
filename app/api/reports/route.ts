import { NextRequest } from "next/server";
import { getServiceClient } from "@/lib/supabaseServer";
import { getUserFromRequest, jsonError } from "@/lib/auth";
import { CATEGORIES, Category } from "@/types/report";

// GET /api/reports — 제보 목록(지도 마커용). category 필터 옵션.
export async function GET(req: NextRequest) {
  const supabase = getServiceClient();
  const category = req.nextUrl.searchParams.get("category");

  let query = supabase.from("reports").select("*").order("created_at", { ascending: false });
  if (category) query = query.eq("category", category);

  const { data, error } = await query;
  if (error) return jsonError("DB_ERROR", error.message, 500);
  return Response.json({ data });
}

// POST /api/reports — 제보 등록 (로그인 필요)
export async function POST(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user) return jsonError("UNAUTHORIZED", "로그인이 필요합니다.", 401);

  const body = await req.json().catch(() => null);
  if (!body) return jsonError("BAD_REQUEST", "잘못된 요청입니다.", 400);

  const { image_url, category, description, lat, lng } = body;
  if (!CATEGORIES.includes(category as Category)) {
    return jsonError("BAD_REQUEST", "유효하지 않은 카테고리입니다.", 400);
  }
  if (typeof lat !== "number" || typeof lng !== "number") {
    return jsonError("BAD_REQUEST", "위치 정보가 필요합니다.", 400);
  }

  const supabase = getServiceClient();
  const { data, error } = await supabase
    .from("reports")
    .insert({
      user_id: user.id,
      image_url: image_url ?? null,
      category,
      description: description ?? "",
      lat,
      lng,
      status: "확인 필요",
    })
    .select()
    .single();

  if (error) return jsonError("DB_ERROR", error.message, 500);
  return Response.json({ data }, { status: 201 });
}
