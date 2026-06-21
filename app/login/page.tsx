"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/Button";
import { supabase } from "@/lib/supabaseClient";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function google() {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: typeof window !== "undefined" ? window.location.origin : undefined },
    });
  }

  async function emailAuth() {
    setBusy(true);
    setMessage("");
    try {
      const { data, error } =
        mode === "login"
          ? await supabase.auth.signInWithPassword({ email, password })
          : await supabase.auth.signUp({ email, password });
      if (error) throw error;

      if (data.session) {
        router.replace("/");
        router.refresh();
        return;
      }

      if (mode === "signup") {
        setMessage("가입 확인 메일을 보냈습니다. 이메일 인증 후 로그인해 주세요.");
        setMode("login");
      } else {
        setMessage("로그인 세션을 만들지 못했습니다. 이메일 인증 여부를 확인해 주세요.");
      }
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto max-w-sm p-6">
      <h1 className="mb-1 text-xl font-bold text-primary">마찰지도</h1>
      <p className="mb-6 text-sm text-ink-muted">
        도시의 불편을 찍으면, 모두의 지도가 됩니다.
      </p>

      <Button onClick={google} variant="secondary" className="mb-4 w-full">
        구글로 계속하기
      </Button>

      <div className="mb-4 text-center text-xs text-ink-muted">또는 이메일로</div>

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
      {message && (
        <p className="mt-3 rounded-md bg-surface p-3 text-sm text-ink-muted">{message}</p>
      )}

      <button
        onClick={() => setMode(mode === "login" ? "signup" : "login")}
        className="mt-4 w-full text-center text-sm text-ink-muted"
      >
        {mode === "login" ? "계정이 없으신가요? 회원가입" : "이미 계정이 있으신가요? 로그인"}
      </button>

      <p className="mt-6 text-center text-[11px] text-ink-muted">
        사진에 사람 얼굴·차량 번호판 등 개인정보가 포함되지 않도록 주의해 주세요.
      </p>
    </main>
  );
}
