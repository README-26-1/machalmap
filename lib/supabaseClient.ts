"use client";

import { createClient } from "@supabase/supabase-js";

// 브라우저용 클라이언트 — anon 키 사용(공개 안전). 주로 Auth 처리에 사용.
const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(url, anonKey);
