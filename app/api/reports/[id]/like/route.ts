import { NextRequest } from "next/server";
import { getUserFromRequest, jsonError } from "@/lib/auth";
import { getServiceClient } from "@/lib/supabaseServer";
import { awardTrust } from "@/lib/trust";

interface Ctx {
  params: Promise<{ id: string }>;
}

export async function POST(req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const user = await getUserFromRequest(req);
  if (!user) return jsonError("UNAUTHORIZED", "로그인이 필요합니다.", 401);

  const supabase = getServiceClient();
  const { data: report } = await supabase
    .from("reports")
    .select("user_id")
    .eq("id", id)
    .maybeSingle();
  if (!report) return jsonError("NOT_FOUND", "제보를 찾을 수 없습니다.", 404);

  const { data: existing } = await supabase
    .from("report_likes")
    .select("report_id")
    .eq("report_id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  const liked = !existing;
  const mutation = existing
    ? supabase
        .from("report_likes")
        .delete()
        .eq("report_id", id)
        .eq("user_id", user.id)
    : supabase.from("report_likes").insert({ report_id: id, user_id: user.id });
  const { error } = await mutation;
  if (error) return jsonError("DB_ERROR", error.message, 500);

  if (report.user_id && report.user_id !== user.id) {
    await awardTrust(supabase, report.user_id, liked ? 2 : -2);
  }

  const { count } = await supabase
    .from("report_likes")
    .select("*", { count: "exact", head: true })
    .eq("report_id", id);

  return Response.json({ data: { liked, like_count: count ?? 0 } });
}
