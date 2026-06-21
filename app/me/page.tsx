"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/Button";
import { apiGet } from "@/lib/api";
import { supabase } from "@/lib/supabaseClient";
import { Profile } from "@/types/user";

export default function MePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [authed, setAuthed] = useState<boolean | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      const ok = !!data.session;
      setAuthed(ok);
      if (ok) apiGet<Profile>("/api/me").then(setProfile).catch(() => {});
    });
  }, []);

  async function logout() {
    await supabase.auth.signOut();
    router.push("/");
  }

  if (authed === false) {
    return (
      <main className="mx-auto max-w-md p-6 text-center">
        <p className="mb-4 text-ink-muted">로그인이 필요합니다.</p>
        <Button onClick={() => router.push("/login")}>로그인</Button>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-md p-4">
      <h1 className="mb-4 text-lg font-bold">마이페이지</h1>
      {profile && (
        <div className="rounded-md bg-surface p-4 shadow-card">
          <p className="text-base font-semibold">{profile.nickname}</p>
          <p className="mt-1 text-xs text-ink-muted">신뢰도 {profile.trust_score}</p>
        </div>
      )}
      <Button variant="secondary" onClick={logout} className="mt-6 w-full">
        로그아웃
      </Button>
    </main>
  );
}
