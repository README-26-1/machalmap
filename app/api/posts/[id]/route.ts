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
    .select("*, profiles!posts_user_id_fkey(nickname)")
    .eq("id", params.id)
    .single();
  if (error || !post) return jsonError("NOT_FOUND", "글을 찾을 수 없습니다.", 404);

  const { data: comments } = await supabase
    .from("comments")
    .select("*, profiles!comments_user_id_fkey(nickname)")
    .eq("post_id", params.id)
    .order("created_at", { ascending: true });

  let poll = null;
  const { data: pollData, error: pollError } = await supabase
    .from("polls")
    .select("id, post_id, question, poll_options(id, poll_id, label)")
    .eq("post_id", params.id)
    .maybeSingle();

  if (pollData && !pollError) {
    const options = (pollData as any).poll_options ?? [];
    const optionIds = options.map((option: any) => option.id);
    const votesResult =
      optionIds.length > 0
        ? await supabase.from("poll_votes").select("option_id").in("option_id", optionIds)
        : { data: [] };
    const counts = new Map<string, number>();
    for (const vote of votesResult.data ?? []) {
      counts.set((vote as any).option_id, (counts.get((vote as any).option_id) ?? 0) + 1);
    }
    poll = {
      id: pollData.id,
      post_id: pollData.post_id,
      question: pollData.question,
      options: options.map((option: any) => ({
        id: option.id,
        poll_id: option.poll_id,
        label: option.label,
        vote_count: counts.get(option.id) ?? 0,
      })),
    };
  }

  return Response.json({
    data: {
      ...post,
      author_nickname: (post as any).profiles?.nickname ?? "익명",
      poll,
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
