"use client";

import { supabase } from "./supabaseClient";

// 클라이언트에서 API route를 호출하는 헬퍼. 로그인 시 access token을 자동 첨부.
async function authHeader(): Promise<Record<string, string>> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session ? { Authorization: `Bearer ${session.access_token}` } : {};
}

export async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(path, { headers: { ...(await authHeader()) } });
  const json = await res.json();
  if (!res.ok) throw new Error(json?.error?.message ?? "요청 실패");
  return json.data as T;
}

export async function apiSend<T>(
  path: string,
  method: "POST" | "PATCH" | "DELETE",
  body?: unknown
): Promise<T> {
  const res = await fetch(path, {
    method,
    headers: { "Content-Type": "application/json", ...(await authHeader()) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json?.error?.message ?? "요청 실패");
  return json.data as T;
}

// 사진을 Supabase Storage에 업로드하고 public URL 반환
export async function uploadImage(file: File): Promise<string> {
  const ext = file.name.split(".").pop() ?? "jpg";
  const path = `${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage
    .from("report-images")
    .upload(path, file, { upsert: false });
  if (error) throw new Error(error.message);
  const { data } = supabase.storage.from("report-images").getPublicUrl(path);
  return data.publicUrl;
}
