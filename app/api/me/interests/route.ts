import { NextRequest } from "next/server";
import { getServiceClient } from "@/lib/supabaseServer";
import { getUserFromRequest, jsonError } from "@/lib/auth";

// GET /api/me/interests — 내 관심 지역 목록
export async function GET(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user) return jsonError("UNAUTHORIZED", "로그인이 필요합니다.", 401);

  const supabase = getServiceClient();
  const { data, error } = await supabase
    .from("interest_areas")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) return jsonError("DB_ERROR", error.message, 500);
  return Response.json({ data });
}

// POST /api/me/interests — 관심 지역 추가
export async function POST(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user) return jsonError("UNAUTHORIZED", "로그인이 필요합니다.", 401);

  const body = await req.json().catch(() => null);
  const label = (body?.label as string | undefined)?.trim();
  const { lat, lng } = body ?? {};
  if (!label) return jsonError("BAD_REQUEST", "이름을 입력해 주세요.", 400);
  if (typeof lat !== "number" || typeof lng !== "number") {
    return jsonError("BAD_REQUEST", "위치 정보가 필요합니다.", 400);
  }

  const supabase = getServiceClient();
  const { data, error } = await supabase
    .from("interest_areas")
    .insert({ user_id: user.id, label, lat, lng })
    .select()
    .single();

  if (error) return jsonError("DB_ERROR", error.message, 500);
  return Response.json({ data }, { status: 201 });
}
