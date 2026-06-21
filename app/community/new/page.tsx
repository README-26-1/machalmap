"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/Button";
import { apiSend } from "@/lib/api";
import { supabase } from "@/lib/supabaseClient";
import { Post } from "@/types/community";

export default function NewPostPage() {
  const router = useRouter();
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setAuthed(!!data.session));
  }, []);

  async function submit() {
    if (!title.trim()) return alert("제목을 입력해 주세요.");
    setBusy(true);
    try {
      const post = await apiSend<Post>("/api/posts", "POST", { title, content });
      router.push(`/community/${post.id}`);
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  if (authed === false) {
    return (
      <main className="mx-auto max-w-md p-6 text-center">
        <p className="mb-4 text-ink-muted">글을 쓰려면 로그인이 필요합니다.</p>
        <Button onClick={() => router.push("/login")}>로그인하러 가기</Button>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-md p-4">
      <h1 className="mb-4 text-lg font-bold">글쓰기</h1>
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="제목"
        className="mb-3 h-12 w-full rounded-md border border-line px-3"
      />
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={8}
        placeholder="내용을 입력하세요."
        className="mb-4 w-full rounded-md border border-line p-3 text-sm"
      />
      <Button onClick={submit} disabled={busy} className="w-full">
        {busy ? "등록 중…" : "등록"}
      </Button>
    </main>
  );
}
