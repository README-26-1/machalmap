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
  return data.user;
}

export function jsonError(code: string, message: string, status: number) {
  return Response.json({ error: { code, message } }, { status });
}
