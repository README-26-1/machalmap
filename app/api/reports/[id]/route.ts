import { NextRequest } from "next/server";
import { getServiceClient } from "@/lib/supabaseServer";
import { getUserFromRequest, jsonError } from "@/lib/auth";

interface Ctx {
  params: { id: string };
}

// GET /api/reports/:id — 제보 상세
export async function GET(_req: NextRequest, { params }: Ctx) {
  const supabase = getServiceClient();
  const { data, error } = await supabase
    .from("reports")
    .select("*")
    .eq("id", params.id)
    .single();

  if (error) return jsonError("NOT_FOUND", "제보를 찾을 수 없습니다.", 404);
  return Response.json({ data });
}

// PATCH /api/reports/:id — 작성자만 수정
export async function PATCH(req: NextRequest, { params }: Ctx) {
  const user = await getUserFromRequest(req);
  if (!user) return jsonError("UNAUTHORIZED", "로그인이 필요합니다.", 401);

  const supabase = getServiceClient();
  const { data: existing } = await supabase
    .from("reports")
    .select("user_id")
    .eq("id", params.id)
    .single();

  if (!existing) return jsonError("NOT_FOUND", "제보를 찾을 수 없습니다.", 404);
  if (existing.user_id !== user.id)
    return jsonError("FORBIDDEN", "권한이 없습니다.", 403);

  const body = await req.json().catch(() => ({}));
  const { description, category } = body;

  const { data, error } = await supabase
    .from("reports")
    .update({ description, category })
    .eq("id", params.id)
    .select()
    .single();

  if (error) return jsonError("DB_ERROR", error.message, 500);
  return Response.json({ data });
}

// DELETE /api/reports/:id — 작성자만 삭제
export async function DELETE(req: NextRequest, { params }: Ctx) {
  const user = await getUserFromRequest(req);
  if (!user) return jsonError("UNAUTHORIZED", "로그인이 필요합니다.", 401);

  const supabase = getServiceClient();
  const { data: existing } = await supabase
    .from("reports")
    .select("user_id")
    .eq("id", params.id)
    .single();

  if (!existing) return jsonError("NOT_FOUND", "제보를 찾을 수 없습니다.", 404);
  if (existing.user_id !== user.id)
    return jsonError("FORBIDDEN", "권한이 없습니다.", 403);

  const { error } = await supabase.from("reports").delete().eq("id", params.id);
  if (error) return jsonError("DB_ERROR", error.message, 500);
  return Response.json({ data: { ok: true } });
}
