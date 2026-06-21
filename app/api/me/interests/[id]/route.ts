import { NextRequest } from "next/server";
import { getServiceClient } from "@/lib/supabaseServer";
import { getUserFromRequest, jsonError } from "@/lib/auth";

interface Ctx {
  params: Promise<{ id: string }>;
}

// DELETE /api/me/interests/:id — 관심 지역 삭제 (본인만)
export async function DELETE(req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const user = await getUserFromRequest(req);
  if (!user) return jsonError("UNAUTHORIZED", "로그인이 필요합니다.", 401);

  const supabase = getServiceClient();
  const { error } = await supabase
    .from("interest_areas")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return jsonError("DB_ERROR", error.message, 500);
  return Response.json({ data: { ok: true } });
}
