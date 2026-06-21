import { NextRequest } from "next/server";
import { getServiceClient } from "@/lib/supabaseServer";
import { getUserFromRequest, jsonError } from "@/lib/auth";

interface Ctx {
  params: Promise<{ id: string }>;
}

// POST /api/posts/:id/comments — 댓글 작성 (로그인 필요)
export async function POST(req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const user = await getUserFromRequest(req);
  if (!user) return jsonError("UNAUTHORIZED", "로그인이 필요합니다.", 401);

  const body = await req.json().catch(() => null);
  if (!body?.content) return jsonError("BAD_REQUEST", "내용이 필요합니다.", 400);

  const supabase = getServiceClient();
  const { data, error } = await supabase
    .from("comments")
    .insert({ post_id: id, user_id: user.id, content: body.content })
    .select()
    .single();

  if (error) return jsonError("DB_ERROR", error.message, 500);
  return Response.json({ data }, { status: 201 });
}
