"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Heart, MessageCircle, PenLine } from "lucide-react";
import { apiGet } from "@/lib/api";
import { Post } from "@/types/community";

export default function CommunityPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiGet<Post[]>("/api/posts")
      .then(setPosts)
      .catch(() => setPosts([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <main className="mx-auto max-w-md p-4">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-lg font-bold">커뮤니티</h1>
        <Link href="/community/new" className="flex items-center gap-1 text-sm text-primary">
          <PenLine size={16} /> 글쓰기
        </Link>
      </div>

      {loading ? (
        <p className="text-ink-muted">불러오는 중…</p>
      ) : posts.length === 0 ? (
        <p className="py-10 text-center text-ink-muted">아직 글이 없습니다.</p>
      ) : (
        <ul className="space-y-3">
          {posts.map((p) => (
            <li key={p.id}>
              <Link
                href={`/community/${p.id}`}
                className="block rounded-md bg-surface p-4 shadow-card"
              >
                <h2 className="font-semibold">{p.title}</h2>
                <p className="mt-1 line-clamp-2 text-sm text-ink-muted">{p.content}</p>
                <div className="mt-2 flex items-center gap-3 text-xs text-ink-muted">
                  <span>{p.author_nickname ?? "익명"}</span>
                  <span className="flex items-center gap-1">
                    <Heart size={13} /> {p.like_count}
                  </span>
                  <span className="flex items-center gap-1">
                    <MessageCircle size={13} /> {p.comment_count ?? 0}
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
