"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import StatusBadge from "@/components/StatusBadge";
import Button from "@/components/Button";
import { apiGet } from "@/lib/api";
import { supabase } from "@/lib/supabaseClient";
import { Report } from "@/types/report";

export default function ActivityPage() {
  const router = useRouter();
  const [reports, setReports] = useState<Report[] | null>(null);
  const [authed, setAuthed] = useState<boolean | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      const ok = !!data.session;
      setAuthed(ok);
      if (ok) {
        apiGet<Report[]>("/api/me/reports")
          .then(setReports)
          .catch(() => setReports([]));
      }
    });
  }, []);

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
      <div className="mb-4 flex items-center gap-2">
        <Link
          href="/me"
          className="flex h-9 w-9 items-center justify-center rounded-full text-ink-muted transition hover:bg-surface"
          aria-label="뒤로"
        >
          <ChevronLeft size={20} />
        </Link>
        <h1 className="text-lg font-bold">제보 및 활동 내역</h1>
      </div>

      {reports === null ? (
        <p className="text-ink-muted">불러오는 중…</p>
      ) : reports.length === 0 ? (
        <div className="py-16 text-center text-ink-muted">
          <p>아직 등록한 제보가 없어요.</p>
          <Link href="/report/new" className="mt-3 inline-block text-sm font-semibold text-primary">
            첫 제보 남기기
          </Link>
        </div>
      ) : (
        <ul className="space-y-3">
          {reports.map((r) => (
            <li key={r.id}>
              <Link
                href={`/report/${r.id}`}
                className="flex gap-3 rounded-lg border border-line bg-white p-3 shadow-card transition hover:bg-surface"
              >
                {r.image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={r.image_url}
                    alt={r.category}
                    className="h-16 w-16 shrink-0 rounded-md object-cover"
                  />
                ) : (
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-md bg-surface text-xs text-ink-muted">
                    사진 없음
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-ink">{r.category}</span>
                    <StatusBadge status={r.status} />
                  </div>
                  <p className="mt-1 line-clamp-2 text-sm text-ink-muted">{r.description}</p>
                  <p className="mt-1 text-xs text-ink-muted">
                    {new Date(r.created_at).toLocaleDateString("ko-KR")}
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
