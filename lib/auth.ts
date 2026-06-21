import { NextRequest } from "next/server";
import { getServiceClient } from "./supabaseServer";

// Authorization: Bearer <token> 헤더에서 사용자를 식별한다.
// 토큰이 없거나 유효하지 않으면 null 반환.
export async function getUserFromRequest(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;

  const token = authHeader.slice("Bearer ".length);
  const supabase = getServiceClient();
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) return null;

  // 이메일/소셜 가입 직후에도 FK가 걸린 테이블에 바로 쓸 수 있도록
  // 최초 인증 API 요청에서 기본 프로필을 보장한다.
  const nickname =
    (typeof data.user.user_metadata?.name === "string" &&
      data.user.user_metadata.name.trim()) ||
    (typeof data.user.user_metadata?.full_name === "string" &&
      data.user.user_metadata.full_name.trim()) ||
    data.user.email?.split("@")[0] ||
    "사용자";
  const { error: profileError } = await supabase
    .from("profiles")
    .upsert(
      { id: data.user.id, nickname },
      { onConflict: "id", ignoreDuplicates: true }
    );
  if (profileError) {
    console.error("[auth] 프로필 자동 생성 실패:", profileError);
  }

  return data.user;
}

export function jsonError(code: string, message: string, status: number) {
  return Response.json({ error: { code, message } }, { status });
}
