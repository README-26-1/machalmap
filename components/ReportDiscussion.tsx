"use client";

import { Heart, MessageCircle, Send } from "lucide-react";
import type { FormEvent } from "react";
import type { ReportComment } from "@/types/report";

export interface ReportDiscussionState {
  readonly comments: readonly ReportComment[];
  readonly liked: boolean;
  readonly likeCount: number;
  readonly loading: boolean;
  readonly error: string | null;
}

interface Props {
  readonly comment: string;
  readonly discussion: ReportDiscussionState;
  readonly likeBusy: boolean;
  readonly commentBusy: boolean;
  readonly onCommentChange: (value: string) => void;
  readonly onLike: () => void;
  readonly onSubmitComment: (event: FormEvent<HTMLFormElement>) => void;
}

export default function ReportDiscussion({
  comment,
  discussion,
  likeBusy,
  commentBusy,
  onCommentChange,
  onLike,
  onSubmitComment,
}: Props) {
  return (
    <section className="mt-5 border-t border-line pt-4" aria-label="댓글과 좋아요">
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={onLike}
          disabled={likeBusy}
          aria-pressed={discussion.liked}
          className={`inline-flex h-10 items-center gap-1.5 rounded-md border px-3 text-sm font-semibold transition active:scale-[0.98] disabled:opacity-50 ${
            discussion.liked
              ? "border-marker-danger bg-marker-danger/10 text-marker-danger"
              : "border-line bg-white text-ink-muted hover:bg-surface hover:text-ink"
          }`}
        >
          <Heart size={16} className={discussion.liked ? "fill-marker-danger" : ""} />
          {discussion.likeCount}
        </button>
        <div className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink-muted">
          <MessageCircle size={16} />
          댓글 {discussion.comments.length}
        </div>
      </div>

      {discussion.error && (
        <p className="mt-3 rounded-md border border-marker-danger/30 bg-marker-danger/10 px-3 py-2 text-xs font-medium text-marker-danger">
          {discussion.error}
        </p>
      )}

      <div className="mt-4 space-y-3">
        {discussion.loading ? (
          <p className="rounded-md bg-surface px-3 py-3 text-sm text-ink-muted">
            댓글을 불러오는 중…
          </p>
        ) : discussion.comments.length ? (
          discussion.comments.map((item) => (
            <article key={item.id} className="rounded-md bg-surface px-3 py-3">
              <div className="flex items-center justify-between gap-2">
                <p className="truncate text-xs font-semibold text-ink-muted">
                  {item.author_nickname ?? "익명"}
                </p>
                <time className="shrink-0 text-xs text-ink-muted">
                  {new Date(item.created_at).toLocaleString("ko-KR")}
                </time>
              </div>
              <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-ink">
                {item.content}
              </p>
            </article>
          ))
        ) : (
          <p className="rounded-md bg-surface px-3 py-3 text-sm text-ink-muted">
            아직 댓글이 없어요.
          </p>
        )}
      </div>

      <form onSubmit={onSubmitComment} className="mt-4 flex gap-2">
        <input
          value={comment}
          onChange={(event) => onCommentChange(event.target.value)}
          maxLength={500}
          placeholder="댓글 작성"
          className="h-11 min-w-0 flex-1 rounded-md border border-line px-3 text-sm text-ink outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
        />
        <button
          type="submit"
          disabled={!comment.trim() || commentBusy}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-primary text-white transition hover:bg-primary-dark active:scale-[0.98] disabled:opacity-40"
          aria-label="댓글 등록"
        >
          <Send size={17} />
        </button>
      </form>
    </section>
  );
}
