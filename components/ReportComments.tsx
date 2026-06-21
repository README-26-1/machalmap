"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Send } from "lucide-react";
import { apiGet, apiSend } from "@/lib/api";
import { supabase } from "@/lib/supabaseClient";
import { ReportComment } from "@/types/reportComment";

interface Props {
  readonly reportId: string;
}

const MAX_COMMENT_LENGTH = 500;

export default function ReportComments({ reportId }: Props) {
  const [comments, setComments] = useState<ReportComment[]>([]);
  const [content, setContent] = useState("");
  const [authed, setAuthed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [busy, setBusy] = useState(false);
  const loadSequence = useRef(0);

  const load = useCallback(async () => {
    const sequence = ++loadSequence.current;
    setLoading(true);
    setLoadError(false);

    try {
      const data = await apiGet<ReportComment[]>(`/api/reports/${reportId}/comments`);
      if (sequence === loadSequence.current) setComments(data);
    } catch {
      if (sequence === loadSequence.current) setLoadError(true);
    } finally {
      if (sequence === loadSequence.current) setLoading(false);
    }
  }, [reportId]);

  useEffect(() => {
    setComments([]);
    setContent("");
    void load();

    void supabase.auth.getSession().then(({ data }) => setAuthed(!!data.session));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuthed(!!session);
    });

    return () => {
      loadSequence.current += 1;
      listener.subscription.unsubscribe();
    };
  }, [load]);

  async function submit() {
    const trimmed = content.trim();
    if (busy || !trimmed) return;

    setBusy(true);
    try {
      await apiSend(`/api/reports/${reportId}/comments`, "POST", {
        content: trimmed,
      });
      setContent("");
      await load();
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <p className="mb-2 text-xs font-semibold text-ink-muted">
        댓글 {comments.length}
      </p>

      <ul className="mb-3 space-y-2">
        {loading && comments.length === 0 ? (
          <li className="text-xs text-ink-muted">댓글을 불러오는 중…</li>
        ) : loadError ? (
          <li className="text-xs text-danger">
            댓글을 불러오지 못했어요.{" "}
            <button type="button" onClick={() => void load()} className="underline">
              다시 시도
            </button>
          </li>
        ) : comments.length === 0 ? (
          <li className="text-xs text-ink-muted">첫 댓글을 남겨보세요.</li>
        ) : (
          comments.map((c) => (
            <li key={c.id} className="rounded-md bg-surface px-3 py-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-ink">
                  {c.author_nickname}
                </span>
                <span className="text-[10px] text-ink-muted">
                  {new Date(c.created_at).toLocaleDateString("ko-KR")}
                </span>
              </div>
              <p className="mt-0.5 whitespace-pre-wrap text-sm text-ink">
                {c.content}
              </p>
            </li>
          ))
        )}
      </ul>

      {authed ? (
        <div className="flex items-end gap-2">
          <div className="min-w-0 flex-1">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                  e.preventDefault();
                  void submit();
                }
              }}
              maxLength={MAX_COMMENT_LENGTH}
              rows={2}
              aria-label="댓글 내용"
              placeholder="댓글 달기 (Shift+Enter로 줄바꿈)"
              className="block max-h-28 min-h-16 w-full resize-none rounded-md border border-line px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
            {content.length > MAX_COMMENT_LENGTH * 0.8 && (
              <p className="mt-1 text-right text-[10px] text-ink-muted">
                {content.length}/{MAX_COMMENT_LENGTH}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={() => void submit()}
            disabled={busy || !content.trim()}
            aria-label="댓글 등록"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary text-white transition hover:bg-primary-dark disabled:opacity-40"
          >
            <Send size={16} />
          </button>
        </div>
      ) : (
        <p className="text-xs text-ink-muted">댓글을 쓰려면 로그인이 필요합니다.</p>
      )}
    </div>
  );
}
