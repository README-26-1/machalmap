import { NextRequest } from "next/server";
import { getServiceClient } from "@/lib/supabaseServer";
import { getUserFromRequest, jsonError } from "@/lib/auth";

interface Ctx {
  params: Promise<{ id: string }>;
}

// GET /api/reports/:id — 제보 상세
export async function GET(req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const supabase = getServiceClient();
  const { data: report, error } = await supabase
    .from("reports")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) return jsonError("DB_ERROR", error.message, 500);
  if (!report) return jsonError("NOT_FOUND", "제보를 찾을 수 없습니다.", 404);

  const [{ data: comments }, { count: likeCount }] = await Promise.all([
    supabase
      .from("report_comments")
      .select("*")
      .eq("report_id", id)
      .order("created_at", { ascending: true }),
    supabase
      .from("report_likes")
      .select("*", { count: "exact", head: true })
      .eq("report_id", id),
  ]);

  const userIds = (comments ?? []).map((comment) => comment.user_id);
  const { data: profiles } = userIds.length
    ? await supabase.from("profiles").select("id, nickname").in("id", userIds)
    : { data: [] as { id: string; nickname: string }[] };
  const nicknameOf = (id: string) =>
    profiles?.find((profile) => profile.id === id)?.nickname ?? "익명";

  const user = await getUserFromRequest(req);
  let liked = false;
  if (user) {
    const { data: likeRow } = await supabase
      .from("report_likes")
      .select("report_id")
      .eq("report_id", id)
      .eq("user_id", user.id)
      .maybeSingle();
    liked = !!likeRow;
  }

  return Response.json({
    data: {
      ...report,
      liked,
      like_count: likeCount ?? 0,
      comments: (comments ?? []).map((comment) => ({
        ...comment,
        author_nickname: nicknameOf(comment.user_id),
      })),
    },
  });
}

// PATCH /api/reports/:id — 작성자만 수정
export async function PATCH(req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const user = await getUserFromRequest(req);
  if (!user) return jsonError("UNAUTHORIZED", "로그인이 필요합니다.", 401);

  const supabase = getServiceClient();
  const { data: existing } = await supabase
    .from("reports")
    .select("user_id")
    .eq("id", id)
    .single();

  if (!existing) return jsonError("NOT_FOUND", "제보를 찾을 수 없습니다.", 404);
  if (existing.user_id !== user.id)
    return jsonError("FORBIDDEN", "권한이 없습니다.", 403);

  const body = await req.json().catch(() => ({}));
  const { description, category } = body;

  const { data, error } = await supabase
    .from("reports")
    .update({ description, category })
    .eq("id", id)
    .select()
    .single();

  if (error) return jsonError("DB_ERROR", error.message, 500);
  return Response.json({ data });
}

// DELETE /api/reports/:id — 작성자만 삭제
export async function DELETE(req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const user = await getUserFromRequest(req);
  if (!user) return jsonError("UNAUTHORIZED", "로그인이 필요합니다.", 401);

  const supabase = getServiceClient();
  const { data: existing } = await supabase
    .from("reports")
    .select("user_id")
    .eq("id", id)
    .single();

  if (!existing) return jsonError("NOT_FOUND", "제보를 찾을 수 없습니다.", 404);
  if (existing.user_id !== user.id)
    return jsonError("FORBIDDEN", "권한이 없습니다.", 403);

  const { error } = await supabase.from("reports").delete().eq("id", id);
  if (error) return jsonError("DB_ERROR", error.message, 500);
  return Response.json({ data: { ok: true } });
}
