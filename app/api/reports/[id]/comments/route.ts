import { NextRequest } from "next/server";
import { getUserFromRequest, jsonError } from "@/lib/auth";
import { getServiceClient } from "@/lib/supabaseServer";

interface Ctx {
  params: { id: string };
}

interface CommentRequestBody {
  readonly content?: unknown;
}

export async function POST(req: NextRequest, { params }: Ctx) {
  const user = await getUserFromRequest(req);
  if (!user) return jsonError("UNAUTHORIZED", "로그인이 필요합니다.", 401);

  const body = await readCommentRequestBody(req);
  const content = typeof body?.content === "string" ? body.content.trim() : "";
  if (!content) return jsonError("BAD_REQUEST", "내용이 필요합니다.", 400);
  if (content.length > 500) {
    return jsonError("BAD_REQUEST", "댓글은 500자 이내로 작성해 주세요.", 400);
  }

  const supabase = getServiceClient();
  const { data: report } = await supabase
    .from("reports")
    .select("id")
    .eq("id", params.id)
    .maybeSingle();
  if (!report) return jsonError("NOT_FOUND", "제보를 찾을 수 없습니다.", 404);

  const { data, error } = await supabase
    .from("report_comments")
    .insert({ report_id: params.id, user_id: user.id, content })
    .select()
    .single();

  if (error) return jsonError("DB_ERROR", error.message, 500);

  const { data: profile } = await supabase
    .from("profiles")
    .select("nickname")
    .eq("id", user.id)
    .maybeSingle();

  return Response.json(
    { data: { ...data, author_nickname: profile?.nickname ?? "익명" } },
    { status: 201 }
  );
}

async function readCommentRequestBody(req: NextRequest): Promise<CommentRequestBody | null> {
  try {
    const value: unknown = await req.json();
    if (!isCommentRequestBody(value)) return null;
    return value;
  } catch (error) {
    if (error instanceof Error) return null;
    return null;
  }
}

function isCommentRequestBody(value: unknown): value is CommentRequestBody {
  return typeof value === "object" && value !== null;
}
