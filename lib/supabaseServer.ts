import { createClient } from "@supabase/supabase-js";

// 서버 전용 클라이언트 — service_role 키 사용, RLS 우회.
// API route 내부에서만 import 할 것. 클라이언트 번들에 절대 포함 금지.
export function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error("Supabase 환경변수가 설정되지 않았습니다.");
  }

  return createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
