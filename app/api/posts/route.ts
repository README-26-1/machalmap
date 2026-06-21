import { NextRequest } from "next/server";
import { getServiceClient } from "@/lib/supabaseServer";
import { getUserFromRequest, jsonError } from "@/lib/auth";

// GET /api/posts — 커뮤니티 글 목록
export async function GET() {
  const supabase = getServiceClient();
  const { data, error } = await supabase
    .from("posts")
    .select("*, profiles!posts_user_id_fkey(nickname)")
    .order("created_at", { ascending: false });

  if (error) return jsonError("DB_ERROR", error.message, 500);
  const postIds = (data ?? []).map((p: any) => p.id);
  const pollsResult =
    postIds.length > 0
      ? await supabase.from("polls").select("id, post_id, question").in("post_id", postIds)
      : { data: [], error: null };
  const polls = pollsResult.error?.code === "42P01" ? [] : pollsResult.data ?? [];

  const mapped = (data ?? []).map((p: any) => {
    const poll = polls.find((item: any) => item.post_id === p.id);
    return {
      ...p,
      author_nickname: p.profiles?.nickname ?? "익명",
      poll: poll ? { ...poll, options: [] } : null,
    };
  });
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

  const options = Array.isArray(body.poll_options)
    ? body.poll_options.map((option: unknown) => String(option).trim()).filter(Boolean).slice(0, 5)
    : [];
  if (options.length >= 2) {
    const { data: poll, error: pollError } = await supabase
      .from("polls")
      .insert({ post_id: data.id, question: body.poll_question || body.title })
      .select()
      .single();
    if (pollError?.code === "42P01") return Response.json({ data }, { status: 201 });
    if (pollError) return jsonError("DB_ERROR", pollError.message, 500);

    const { error: optionError } = await supabase
      .from("poll_options")
      .insert(options.map((label: string) => ({ poll_id: poll.id, label })));
    if (optionError?.code === "42P01") return Response.json({ data }, { status: 201 });
    if (optionError) return jsonError("DB_ERROR", optionError.message, 500);
  }

  return Response.json({ data }, { status: 201 });
}
