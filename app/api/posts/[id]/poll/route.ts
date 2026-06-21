import { NextRequest } from "next/server";
import { getServiceClient } from "@/lib/supabaseServer";
import { getUserFromRequest, jsonError } from "@/lib/auth";

interface Ctx {
  params: { id: string };
}

export async function POST(req: NextRequest, { params }: Ctx) {
  const user = await getUserFromRequest(req);
  if (!user) return jsonError("UNAUTHORIZED", "로그인이 필요합니다.", 401);

  const body = await req.json().catch(() => null);
  if (!body?.option_id) return jsonError("BAD_REQUEST", "투표 옵션이 필요합니다.", 400);

  const supabase = getServiceClient();
  const { data: poll, error: pollError } = await supabase
    .from("polls")
    .select("id")
    .eq("post_id", params.id)
    .single();
  if (pollError || !poll) return jsonError("NOT_FOUND", "투표를 찾을 수 없습니다.", 404);

  const { data: option } = await supabase
    .from("poll_options")
    .select("id")
    .eq("id", body.option_id)
    .eq("poll_id", poll.id)
    .single();
  if (!option) return jsonError("BAD_REQUEST", "잘못된 투표 옵션입니다.", 400);

  const { error } = await supabase
    .from("poll_votes")
    .upsert(
      { poll_id: poll.id, option_id: body.option_id, user_id: user.id },
      { onConflict: "poll_id,user_id" }
    );
  if (error) return jsonError("DB_ERROR", error.message, 500);

  return Response.json({ data: { ok: true } });
}
