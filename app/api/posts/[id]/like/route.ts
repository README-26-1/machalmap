import { NextRequest } from "next/server";
import { getServiceClient } from "@/lib/supabaseServer";
import { getUserFromRequest, jsonError } from "@/lib/auth";
import { awardTrust } from "@/lib/trust";

interface Ctx {
  params: { id: string };
}

// POST /api/posts/:id/like — 좋아요 토글 (로그인 필요)
export async function POST(req: NextRequest, { params }: Ctx) {
  const user = await getUserFromRequest(req);
  if (!user) return jsonError("UNAUTHORIZED", "로그인이 필요합니다.", 401);

  const supabase = getServiceClient();
  const { data: post } = await supabase
    .from("posts")
    .select("user_id")
    .eq("id", params.id)
    .maybeSingle();

  const { data: existing } = await supabase
    .from("likes")
    .select("post_id")
    .eq("post_id", params.id)
    .eq("user_id", user.id)
    .maybeSingle();

  let liked: boolean;
  if (existing) {
    await supabase.from("likes").delete().eq("post_id", params.id).eq("user_id", user.id);
    liked = false;
  } else {
    await supabase.from("likes").insert({ post_id: params.id, user_id: user.id });
    liked = true;
  }

  // 좋아요 받은 글 작성자에게 +2P (취소 시 -2P), 본인 글은 제외
  if (post?.user_id && post.user_id !== user.id) {
    await awardTrust(supabase, post.user_id, liked ? 2 : -2);
  }

  // like_count 재계산
  const { count } = await supabase
    .from("likes")
    .select("*", { count: "exact", head: true })
    .eq("post_id", params.id);

  await supabase.from("posts").update({ like_count: count ?? 0 }).eq("id", params.id);

  return Response.json({ data: { liked, like_count: count ?? 0 } });
}
