import { NextRequest } from "next/server";
import { getServiceClient } from "@/lib/supabaseServer";
import { getUserFromRequest, jsonError } from "@/lib/auth";

// GET /api/posts — 커뮤니티 글 목록
export async function GET() {
  const supabase = getServiceClient();
  const { data: posts, error } = await supabase
    .from("posts")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[GET /api/posts] DB error:", error);
    return jsonError("DB_ERROR", error.message, 500);
  }

  const userIds = (posts ?? []).map((p) => p.user_id).filter(Boolean);
  const { data: profiles } = userIds.length
    ? await supabase.from("profiles").select("id, nickname").in("id", userIds)
    : { data: [] as { id: string; nickname: string }[] };

  const mapped = (posts ?? []).map((p) => ({
    ...p,
    author_nickname:
      profiles?.find((pr) => pr.id === p.user_id)?.nickname ?? "익명",
  }));
  return Response.json({ data: mapped });
}

// POST /api/posts — 글 작성 (로그인 필요)
export async function POST(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user) return jsonError("UNAUTHORIZED", "로그인이 필요합니다.", 401);

  const body = await req.json().catch(() => null);
  if (!body?.title) return jsonError("BAD_REQUEST", "제목이 필요합니다.", 400);

  const supabase = getServiceClient();
  const { data, error } = await supabase
    .from("posts")
    .insert({
      user_id: user.id,
      title: body.title,
      content: body.content ?? "",
      report_id: body.report_id ?? null,
    })
    .select()
    .single();

  if (error) return jsonError("DB_ERROR", error.message, 500);
  return Response.json({ data }, { status: 201 });
}
