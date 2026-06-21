import { NextRequest } from "next/server";
import { getServiceClient } from "@/lib/supabaseServer";
import { getUserFromRequest, jsonError } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user) return jsonError("UNAUTHORIZED", "로그인이 필요합니다.", 401);

  const supabase = getServiceClient();
  const { data, error } = await supabase
    .from("friendships")
    .select("id, requester_id, addressee_id, status, requester:profiles!friendships_requester_id_fkey(id,nickname,trust_score), addressee:profiles!friendships_addressee_id_fkey(id,nickname,trust_score)")
    .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`)
    .order("created_at", { ascending: false });

  if (error) {
    if (error.code === "42P01") return Response.json({ data: [] });
    return jsonError("DB_ERROR", error.message, 500);
  }

  const mapped = (data ?? []).map((row: any) => {
    const other = row.requester_id === user.id ? row.addressee : row.requester;
    return {
      id: other.id,
      nickname: other.nickname,
      trust_score: other.trust_score,
      status: row.status,
      direction:
        row.status === "accepted" ? "friend" : row.requester_id === user.id ? "sent" : "received",
    };
  });

  return Response.json({ data: mapped });
}

export async function POST(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user) return jsonError("UNAUTHORIZED", "로그인이 필요합니다.", 401);

  const body = await req.json().catch(() => null);
  if (!body?.nickname) return jsonError("BAD_REQUEST", "닉네임이 필요합니다.", 400);

  const supabase = getServiceClient();
  const { data: target } = await supabase
    .from("profiles")
    .select("id")
    .ilike("nickname", body.nickname)
    .neq("id", user.id)
    .maybeSingle();
  if (!target) return jsonError("NOT_FOUND", "사용자를 찾을 수 없습니다.", 404);

  const first = user.id < target.id ? user.id : target.id;
  const second = user.id < target.id ? target.id : user.id;
  const { data, error } = await supabase
    .from("friendships")
    .upsert(
      { requester_id: user.id, addressee_id: target.id, user_low_id: first, user_high_id: second },
      { onConflict: "user_low_id,user_high_id" }
    )
    .select()
    .single();

  if (error) return jsonError("DB_ERROR", error.message, 500);
  return Response.json({ data }, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user) return jsonError("UNAUTHORIZED", "로그인이 필요합니다.", 401);

  const body = await req.json().catch(() => null);
  if (!body?.friend_id) return jsonError("BAD_REQUEST", "친구 ID가 필요합니다.", 400);

  const supabase = getServiceClient();
  const { data, error } = await supabase
    .from("friendships")
    .update({ status: "accepted" })
    .eq("requester_id", body.friend_id)
    .eq("addressee_id", user.id)
    .select()
    .single();

  if (error) return jsonError("DB_ERROR", error.message, 500);
  return Response.json({ data });
}
