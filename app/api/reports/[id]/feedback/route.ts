import { NextRequest } from "next/server";
import { getServiceClient } from "@/lib/supabaseServer";
import { getUserFromRequest, jsonError } from "@/lib/auth";
import { applyFeedback } from "@/lib/status";
import { FeedbackType } from "@/types/report";

interface Ctx {
  params: { id: string };
}

const VALID: FeedbackType[] = ["still", "danger", "resolved"];

// POST /api/reports/:id/feedback — 피드백 등록 + 상태 전이
export async function POST(req: NextRequest, { params }: Ctx) {
  const body = await req.json().catch(() => null);
  const type = body?.type as FeedbackType | undefined;
  if (!type || !VALID.includes(type)) {
    return jsonError("BAD_REQUEST", "유효하지 않은 피드백 유형입니다.", 400);
  }

  const user = await getUserFromRequest(req); // 비로그인 허용(중복 제한은 로그인 시)
  const supabase = getServiceClient();

  const { data: report, error: rErr } = await supabase
    .from("reports")
    .select("status, still_count, danger_count, resolved_count")
    .eq("id", params.id)
    .single();
  if (rErr || !report) return jsonError("NOT_FOUND", "제보를 찾을 수 없습니다.", 404);

  // 중복 방지(로그인 사용자 한정)
  if (user) {
    const { error: insErr } = await supabase
      .from("feedbacks")
      .insert({ report_id: params.id, user_id: user.id, type });
    if (insErr && insErr.code === "23505") {
      return jsonError("CONFLICT", "이미 같은 피드백을 남겼습니다.", 409);
    }
  } else {
    await supabase.from("feedbacks").insert({ report_id: params.id, user_id: null, type });
  }

  const { counts, status } = applyFeedback(
    report.status,
    {
      still_count: report.still_count,
      danger_count: report.danger_count,
      resolved_count: report.resolved_count,
    },
    type
  );

  const { data, error } = await supabase
    .from("reports")
    .update({ ...counts, status })
    .eq("id", params.id)
    .select("status, still_count, danger_count, resolved_count")
    .single();

  if (error) return jsonError("DB_ERROR", error.message, 500);
  return Response.json({ data });
}
