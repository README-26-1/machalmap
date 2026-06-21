import { NextRequest } from "next/server";
import { getServiceClient } from "@/lib/supabaseServer";
import { getUserFromRequest, jsonError } from "@/lib/auth";
import { toCoordinates } from "@/lib/coordinates";
import { isCategory } from "@/types/report";

interface ReportRequestBody {
  readonly image_url?: unknown;
  readonly category?: unknown;
  readonly description?: unknown;
  readonly lat?: unknown;
  readonly lng?: unknown;
}

// GET /api/reports — 제보 목록(지도 마커용). category 필터 옵션.
export async function GET(req: NextRequest) {
  const supabase = getServiceClient();
  const category = req.nextUrl.searchParams.get("category");

  let query = supabase.from("reports").select("*").order("created_at", { ascending: false });
  if (category) {
    if (!isCategory(category)) {
      return jsonError("BAD_REQUEST", "유효하지 않은 카테고리입니다.", 400);
    }
    query = query.eq("category", category);
  }

  const { data, error } = await query;
  if (error) return jsonError("DB_ERROR", error.message, 500);
  return Response.json({ data });
}

// POST /api/reports — 제보 등록 (로그인 필요)
export async function POST(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user) return jsonError("UNAUTHORIZED", "로그인이 필요합니다.", 401);

  const body = await readReportRequestBody(req);
  if (!body) return jsonError("BAD_REQUEST", "잘못된 요청입니다.", 400);

  const { image_url, category, description, lat, lng } = body;
  if (!isCategory(category)) {
    return jsonError("BAD_REQUEST", "유효하지 않은 카테고리입니다.", 400);
  }

  const coordinates = toCoordinates(lat, lng);
  if (!coordinates) {
    return jsonError("BAD_REQUEST", "위치 정보가 필요합니다.", 400);
  }

  if (image_url !== undefined && image_url !== null && typeof image_url !== "string") {
    return jsonError("BAD_REQUEST", "이미지 URL 형식이 올바르지 않습니다.", 400);
  }

  if (description !== undefined && typeof description !== "string") {
    return jsonError("BAD_REQUEST", "설명 형식이 올바르지 않습니다.", 400);
  }

  const supabase = getServiceClient();
  const { data, error } = await supabase
    .from("reports")
    .insert({
      user_id: user.id,
      image_url: image_url ?? null,
      category,
      description: description ?? "",
      lat: coordinates.lat,
      lng: coordinates.lng,
      status: "확인 필요",
    })
    .select()
    .single();

  if (error) return jsonError("DB_ERROR", error.message, 500);
  return Response.json({ data }, { status: 201 });
}

async function readReportRequestBody(req: NextRequest): Promise<ReportRequestBody | null> {
  try {
    const value: unknown = await req.json();
    if (!isReportRequestBody(value)) return null;
    return value;
  } catch (error) {
    if (error instanceof Error) return null;
    return null;
  }
}

function isReportRequestBody(value: unknown): value is ReportRequestBody {
  return typeof value === "object" && value !== null;
}
