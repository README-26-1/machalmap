import { SupabaseClient } from "@supabase/supabase-js";

// 사용자 신뢰도 점수 증감 (음수면 차감, 0 미만으로는 안 내려감).
// 동시성까지 엄밀히 보장하진 않지만 해커톤 수준에선 충분.
export async function awardTrust(
  supabase: SupabaseClient,
  userId: string | null | undefined,
  delta: number
): Promise<void> {
  if (!userId || !delta) return;
  const { data } = await supabase
    .from("profiles")
    .select("trust_score")
    .eq("id", userId)
    .maybeSingle();
  const current = (data?.trust_score as number | undefined) ?? 0;
  const next = Math.max(0, current + delta);
  await supabase.from("profiles").update({ trust_score: next }).eq("id", userId);
}
