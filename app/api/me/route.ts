import { NextRequest } from "next/server";
import { getServiceClient } from "@/lib/supabaseServer";
import { getUserFromRequest, jsonError } from "@/lib/auth";

// GET /api/me — 현재 로그인 사용자 프로필
export async function GET(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user) return jsonError("UNAUTHORIZED", "로그인이 필요합니다.", 401);

  const supabase = getServiceClient();
  let { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  // 프로필이 없으면 기본 생성
  if (!profile) {
    const nickname =
      (user.user_metadata?.name as string) ||
      user.email?.split("@")[0] ||
      "사용자";
    const { data } = await supabase
      .from("profiles")
      .insert({ id: user.id, nickname })
      .select()
      .single();
    profile = data;
  }

  return Response.json({ data: profile });
}
