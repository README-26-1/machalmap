import { NextRequest } from "next/server";
import { getServiceClient } from "@/lib/supabaseServer";
import { getUserFromRequest, jsonError } from "@/lib/auth";
import { deriveStatus } from "@/lib/status";
import { awardTrust } from "@/lib/trust";
import { FeedbackType } from "@/types/report";

interface Ctx {
  params: { id: string };
}

const VALID: FeedbackType[] = ["still", "danger", "resolved"];

// POST /api/reports/:id/feedback — 피드백 토글(등록/취소) + 상태 재계산
export async function POST(req: NextRequest, { params }: Ctx) {
  const body = await req.json().catch(() => null);
  const type = body?.type as FeedbackType | undefined;
  if (!type || !VALID.includes(type)) {
    return jsonError("BAD_REQUEST", "유효하지 않은 피드백 유형입니다.", 400);
  }

  const user = await getUserFromRequest(req);
  const supabase = getServiceClient();

  const { data: report, error: rErr } = await supabase
    .from("reports")
    .select("user_id, status")
    .eq("id", params.id)
    .single();
  if (rErr || !report) return jsonError("NOT_FOUND", "제보를 찾을 수 없습니다.", 404);

  // 로그인 사용자는 토글(취소 가능), 비로그인은 등록만.
  let active: boolean;
  if (user) {
    const { data: existing } = await supabase
      .from("feedbacks")
      .select("id")
      .eq("report_id", params.id)
      .eq("user_id", user.id)
      .eq("type", type)
      .maybeSingle();

    if (existing) {
      await supabase.from("feedbacks").delete().eq("id", existing.id);
      active = false;
    } else {
      await supabase
        .from("feedbacks")
        .insert({ report_id: params.id, user_id: user.id, type });
      active = true;
    }
  } else {
    await supabase
      .from("feedbacks")
      .insert({ report_id: params.id, user_id: null, type });
    active = true;
  }

  // 카운트를 feedbacks 테이블에서 다시 집계(증감 모두 정확)
  const [stillRes, dangerRes, resolvedRes] = await Promise.all([
    supabase.from("feedbacks").select("*", { count: "exact", head: true }).eq("report_id", params.id).eq("type", "still"),
    supabase.from("feedbacks").select("*", { count: "exact", head: true }).eq("report_id", params.id).eq("type", "danger"),
    supabase.from("feedbacks").select("*", { count: "exact", head: true }).eq("report_id", params.id).eq("type", "resolved"),
  ]);
  const counts = {
    still_count: stillRes.count ?? 0,
    danger_count: dangerRes.count ?? 0,
    resolved_count: resolvedRes.count ?? 0,
  };
  const status = deriveStatus(counts);

  const { data, error } = await supabase
    .from("reports")
    .update({ ...counts, status })
    .eq("id", params.id)
    .select("status, still_count, danger_count, resolved_count")
    .single();
  if (error) return jsonError("DB_ERROR", error.message, 500);

  // 신뢰도 점수 (작성자에게) — 등록 시 +, 취소 시 -
  let delta = 0;
  const isOther = user && report.user_id && user.id !== report.user_id;
  if (isOther && (type === "still" || type === "danger")) {
    delta += active ? 5 : -5;
  }
  if (report.status !== "해결 완료" && status === "해결 완료") delta += 20;
  if (report.status === "해결 완료" && status !== "해결 완료") delta -= 20;
  if (delta !== 0) await awardTrust(supabase, report.user_id, delta);

  return Response.json({ data: { ...data, type, active } });
}
