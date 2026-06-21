import { NextRequest } from "next/server";
import { getUserFromRequest, jsonError } from "@/lib/auth";
import { getServiceClient } from "@/lib/supabaseServer";

interface Ctx {
  params: { id: string };
}

const MAX_COMMENT_LENGTH = 500;

// GET /api/reports/:id/comments — 제보 댓글 목록
export async function GET(_req: NextRequest, { params }: Ctx) {
  const supabase = getServiceClient();
  const { data: comments, error } = await supabase
    .from("report_comments")
    .select("id, report_id, user_id, content, created_at")
    .eq("report_id", params.id)
    .order("created_at", { ascending: true });

  if (error) return jsonError("DB_ERROR", error.message, 500);

  const userIds = [
    ...new Set(
      (comments ?? [])
        .map((comment) => comment.user_id)
        .filter((userId): userId is string => Boolean(userId))
    ),
  ];
  const { data: profiles } = userIds.length
    ? await supabase.from("profiles").select("id, nickname").in("id", userIds)
    : { data: [] as { id: string; nickname: string }[] };
  const nicknames = new Map(profiles?.map((profile) => [profile.id, profile.nickname]));

  return Response.json({
    data: (comments ?? []).map((comment) => ({
      ...comment,
      author_nickname: nicknames.get(comment.user_id) ?? "익명",
    })),
  });
}

// POST /api/reports/:id/comments — 댓글 작성 (로그인 필요)
export async function POST(req: NextRequest, { params }: Ctx) {
  const user = await getUserFromRequest(req);
  if (!user) return jsonError("UNAUTHORIZED", "로그인이 필요합니다.", 401);

  const body = await req.json().catch(() => null);
  const content = typeof body?.content === "string" ? body.content.trim() : "";
  if (!content) return jsonError("BAD_REQUEST", "내용을 입력해 주세요.", 400);
  if (content.length > MAX_COMMENT_LENGTH) {
    return jsonError(
      "BAD_REQUEST",
      `댓글은 ${MAX_COMMENT_LENGTH}자까지 입력할 수 있습니다.`,
      400
    );
  }

  const supabase = getServiceClient();
  const { data: report, error: reportError } = await supabase
    .from("reports")
    .select("id")
    .eq("id", params.id)
    .maybeSingle();
  if (reportError) return jsonError("DB_ERROR", reportError.message, 500);
  if (!report) return jsonError("NOT_FOUND", "제보를 찾을 수 없습니다.", 404);

  const { data, error } = await supabase
    .from("report_comments")
    .insert({ report_id: params.id, user_id: user.id, content })
    .select("id, report_id, user_id, content, created_at")
    .single();

  if (error) return jsonError("DB_ERROR", error.message, 500);

  const { data: profile } = await supabase
    .from("profiles")
    .select("nickname")
    .eq("id", user.id)
    .maybeSingle();

  return Response.json(
    { data: { ...data, author_nickname: profile?.nickname ?? "익명" } },
    { status: 201 }
  );
}
