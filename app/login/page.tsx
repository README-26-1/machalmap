"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/Button";
import { supabase } from "@/lib/supabaseClient";

// 카카오 로그인은 Supabase가 account_email 스코프를 강제 요청 → 개인(비즈앱 아님) 카카오 앱에서는
// KOE205로 막힘. 비즈앱 전환 전까지 비활성화하고 구글 + 이메일 로그인만 노출한다.
type OAuthProvider = "google";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [busy, setBusy] = useState(false);

  async function oauth(provider: OAuthProvider) {
    await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo:
          typeof window !== "undefined" ? window.location.origin : undefined,
      },
    });
  }

  async function emailAuth() {
    setBusy(true);
    try {
      const fn =
        mode === "login"
          ? supabase.auth.signInWithPassword({ email, password })
          : supabase.auth.signUp({ email, password });
      const { error } = await fn;
      if (error) throw error;
      router.push("/");
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto max-w-sm p-6">
      <h1 className="mb-1 text-xl font-bold text-primary">불편핑</h1>
      <p className="mb-6 text-sm text-ink-muted">
        도시의 불편을 찍으면, 모두의 지도가 됩니다.
      </p>

      {/* 소셜 로그인 — 각 브랜드 가이드 준수 */}
      <div className="space-y-3">
        <GoogleButton onClick={() => oauth("google")} />
      </div>

      <div className="my-5 flex items-center gap-3 text-xs text-ink-muted">
        <span className="h-px flex-1 bg-line" />
        또는 이메일로
        <span className="h-px flex-1 bg-line" />
      </div>

      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="이메일"
        className="mb-2 h-12 w-full rounded-md border border-line px-3"
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="비밀번호"
        className="mb-4 h-12 w-full rounded-md border border-line px-3"
      />
      <Button onClick={emailAuth} disabled={busy} className="w-full">
        {mode === "login" ? "로그인" : "회원가입"}
      </Button>

      <button
        onClick={() => setMode(mode === "login" ? "signup" : "login")}
        className="mt-4 w-full text-center text-sm text-ink-muted"
      >
        {mode === "login"
          ? "계정이 없으신가요? 회원가입"
          : "이미 계정이 있으신가요? 로그인"}
      </button>

      <p className="mt-6 text-center text-[11px] text-ink-muted">
        사진에 사람 얼굴·차량 번호판 등 개인정보가 포함되지 않도록 주의해 주세요.
      </p>
    </main>
  );
}

/* ---------- 브랜드 버튼 ---------- */

// Google: 흰 배경 + 4색 G 로고 (공식 가이드라인)
function GoogleButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex h-12 w-full items-center justify-center gap-3 rounded-md border border-[#747775] bg-white text-sm font-medium text-[#1f1f1f] transition hover:bg-[#f8f9fa] active:scale-[0.99]"
    >
      <GoogleLogo />
      Google 계정으로 로그인
    </button>
  );
}

function GoogleLogo() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"
      />
      <path
        fill="#FBBC05"
        d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.997 8.997 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"
      />
      <path
        fill="#EA4335"
        d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"
      />
    </svg>
  );
}
