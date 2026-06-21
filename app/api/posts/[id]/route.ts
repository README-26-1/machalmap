import { NextRequest } from "next/server";
import { getServiceClient } from "@/lib/supabaseServer";
import { getUserFromRequest, jsonError } from "@/lib/auth";

interface Ctx {
  params: { id: string };
}

// GET /api/posts/:id — 글 상세 + 댓글
export async function GET(_req: NextRequest, { params }: Ctx) {
  const supabase = getServiceClient();
  const { data: post, error } = await supabase
    .from("posts")
    .select("*, profiles(nickname)")
    .eq("id", params.id)
    .single();
  if (error || !post) return jsonError("NOT_FOUND", "글을 찾을 수 없습니다.", 404);

  const { data: comments } = await supabase
    .from("comments")
    .select("*, profiles(nickname)")
    .eq("post_id", params.id)
    .order("created_at", { ascending: true });

  return Response.json({
    data: {
      ...post,
      author_nickname: (post as any).profiles?.nickname ?? "익명",
      comments: (comments ?? []).map((c: any) => ({
        ...c,
        author_nickname: c.profiles?.nickname ?? "익명",
      })),
    },
  });
}

// DELETE /api/posts/:id — 작성자만
export async function DELETE(req: NextRequest, { params }: Ctx) {
  const user = await getUserFromRequest(req);
  if (!user) return jsonError("UNAUTHORIZED", "로그인이 필요합니다.", 401);

  const supabase = getServiceClient();
  const { data: existing } = await supabase
    .from("posts")
    .select("user_id")
    .eq("id", params.id)
    .single();
  if (!existing) return jsonError("NOT_FOUND", "글을 찾을 수 없습니다.", 404);
  if (existing.user_id !== user.id)
    return jsonError("FORBIDDEN", "권한이 없습니다.", 403);

  const { error } = await supabase.from("posts").delete().eq("id", params.id);
  if (error) return jsonError("DB_ERROR", error.message, 500);
  return Response.json({ data: { ok: true } });
}
