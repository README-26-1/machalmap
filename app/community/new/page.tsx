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
  const [pollEnabled, setPollEnabled] = useState(false);
  const [pollOptions, setPollOptions] = useState(["", ""]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setAuthed(!!data.session));
  }, []);

  async function submit() {
    if (!title.trim()) return alert("제목을 입력해 주세요.");
    setBusy(true);
    try {
      const options = pollOptions.map((option) => option.trim()).filter(Boolean);
      if (pollEnabled && options.length < 2) {
        alert("투표 옵션은 2개 이상 입력해 주세요.");
        return;
      }

      const payload: {
        title: string;
        content: string;
        poll_question?: string;
        poll_options?: string[];
      } = {
        title,
        content,
      };

      if (pollEnabled) {
        payload.poll_question = title;
        payload.poll_options = options;
      }

      const post = await apiSend<Post>("/api/posts", "POST", payload);
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
      {!pollEnabled ? (
        <button
          type="button"
          onClick={() => setPollEnabled(true)}
          className="mb-4 h-11 w-full rounded-md border border-line bg-surface text-sm font-semibold text-primary"
        >
          투표 작성
        </button>
      ) : (
        <section className="mb-4 rounded-md bg-surface p-3">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-sm font-semibold">투표 옵션</h2>
            <button
              type="button"
              onClick={() => {
                setPollEnabled(false);
                setPollOptions(["", ""]);
              }}
              className="text-xs text-ink-muted"
            >
              투표 제거
            </button>
          </div>
          <div className="space-y-2">
            {pollOptions.map((option, index) => (
              <input
                key={index}
                value={option}
                onChange={(e) =>
                  setPollOptions((prev) =>
                    prev.map((item, itemIndex) => (itemIndex === index ? e.target.value : item))
                  )
                }
                placeholder={`옵션 ${index + 1}`}
                className="h-10 w-full rounded-md border border-line px-3 text-sm"
              />
            ))}
          </div>
          <button
            type="button"
            onClick={() => setPollOptions((prev) => (prev.length >= 5 ? prev : [...prev, ""]))}
            className="mt-2 text-sm text-primary"
          >
            옵션 추가
          </button>
        </section>
      )}
      <Button onClick={submit} disabled={busy} className="w-full">
        {busy ? "등록 중…" : "등록"}
      </Button>
    </main>
  );
}
