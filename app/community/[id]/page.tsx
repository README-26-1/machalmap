"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Heart } from "lucide-react";
import Button from "@/components/Button";
import { apiGet, apiSend } from "@/lib/api";
import { Comment, PollOption, Post } from "@/types/community";

type PostDetail = Post & { comments: Comment[] };

export default function PostDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [post, setPost] = useState<PostDetail | null>(null);
  const [comment, setComment] = useState("");
  const [likeCount, setLikeCount] = useState(0);

  async function load() {
    const data = await apiGet<PostDetail>(`/api/posts/${id}`);
    setPost(data);
    setLikeCount(data.like_count);
  }

  useEffect(() => {
    load().catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function like() {
    try {
      const data = await apiSend<{ liked: boolean; like_count: number }>(
        `/api/posts/${id}/like`,
        "POST"
      );
      setLikeCount(data.like_count);
    } catch (e) {
      alert((e as Error).message);
    }
  }

  async function addComment() {
    if (!comment.trim()) return;
    try {
      await apiSend(`/api/posts/${id}/comments`, "POST", { content: comment });
      setComment("");
      await load();
    } catch (e) {
      alert((e as Error).message);
    }
  }

  async function vote(option: PollOption) {
    try {
      await apiSend(`/api/posts/${id}/poll`, "POST", { option_id: option.id });
      await load();
    } catch (e) {
      alert((e as Error).message);
    }
  }

  if (!post) return <main className="p-6 text-ink-muted">불러오는 중…</main>;

  return (
    <main className="mx-auto max-w-md p-4">
      <h1 className="text-xl font-bold">{post.title}</h1>
      <p className="mt-1 text-xs text-ink-muted">
        {post.author_nickname} · {new Date(post.created_at).toLocaleString("ko-KR")}
      </p>
      <p className="mt-4 whitespace-pre-wrap text-sm">{post.content}</p>

      <button
        onClick={like}
        className="mt-4 flex items-center gap-1 rounded-full border border-line px-3 py-1.5 text-sm"
      >
        <Heart size={15} /> {likeCount}
      </button>

      {post.poll && (
        <section className="mt-5 rounded-md bg-surface p-4 shadow-card">
          <h2 className="mb-3 text-sm font-semibold">{post.poll.question}</h2>
          <div className="space-y-2">
            {post.poll.options.map((option) => {
              const total = post.poll?.options.reduce((sum, item) => sum + item.vote_count, 0) ?? 0;
              const percent = total > 0 ? Math.round((option.vote_count / total) * 100) : 0;
              return (
                <button
                  key={option.id}
                  onClick={() => vote(option)}
                  className="w-full rounded-md border border-line bg-white p-3 text-left"
                >
                  <div className="flex items-center justify-between text-sm">
                    <span>{option.label}</span>
                    <span className="text-ink-muted">{option.vote_count}표</span>
                  </div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-line">
                    <div className="h-full bg-primary" style={{ width: `${percent}%` }} />
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      )}

      <hr className="my-5 border-line" />

      <h2 className="mb-3 text-sm font-semibold">댓글 {post.comments.length}</h2>
      <ul className="space-y-3">
        {post.comments.map((c) => (
          <li key={c.id} className="rounded-md bg-surface p-3">
            <p className="text-xs text-ink-muted">{c.author_nickname}</p>
            <p className="text-sm">{c.content}</p>
          </li>
        ))}
      </ul>

      <div className="mt-4 flex gap-2">
        <input
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="댓글 달기"
          className="h-11 flex-1 rounded-md border border-line px-3 text-sm"
        />
        <Button onClick={addComment} className="h-11 px-4">
          등록
        </Button>
      </div>
    </main>
  );
}
