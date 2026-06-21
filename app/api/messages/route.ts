import { NextRequest } from "next/server";
import { getServiceClient } from "@/lib/supabaseServer";
import { getUserFromRequest, jsonError } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user) return jsonError("UNAUTHORIZED", "로그인이 필요합니다.", 401);

  const peerId = req.nextUrl.searchParams.get("peer_id");
  if (!peerId) return jsonError("BAD_REQUEST", "상대 사용자가 필요합니다.", 400);

  const supabase = getServiceClient();
  const { data, error } = await supabase
    .from("direct_messages")
    .select("*, sender:profiles!direct_messages_sender_id_fkey(nickname)")
    .or(`and(sender_id.eq.${user.id},receiver_id.eq.${peerId}),and(sender_id.eq.${peerId},receiver_id.eq.${user.id})`)
    .order("created_at", { ascending: true });

  if (error) {
    if (error.code === "42P01") return Response.json({ data: [] });
    return jsonError("DB_ERROR", error.message, 500);
  }

  return Response.json({
    data: (data ?? []).map((m: any) => ({ ...m, sender_nickname: m.sender?.nickname })),
  });
}

export async function POST(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user) return jsonError("UNAUTHORIZED", "로그인이 필요합니다.", 401);

  const body = await req.json().catch(() => null);
  if (!body?.receiver_id || !body?.content) {
    return jsonError("BAD_REQUEST", "받는 사람과 메시지가 필요합니다.", 400);
  }

  const supabase = getServiceClient();
  const { data: friendship } = await supabase
    .from("friendships")
    .select("id")
    .eq("status", "accepted")
    .or(
      `and(requester_id.eq.${user.id},addressee_id.eq.${body.receiver_id}),and(requester_id.eq.${body.receiver_id},addressee_id.eq.${user.id})`
    )
    .maybeSingle();
  if (!friendship) return jsonError("FORBIDDEN", "친구에게만 귓속말을 보낼 수 있습니다.", 403);

  const { data, error } = await supabase
    .from("direct_messages")
    .insert({ sender_id: user.id, receiver_id: body.receiver_id, content: body.content })
    .select()
    .single();

  if (error) return jsonError("DB_ERROR", error.message, 500);
  return Response.json({ data }, { status: 201 });
}
