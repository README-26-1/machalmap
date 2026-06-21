"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Camera,
  CheckCircle2,
  ChevronRight,
  History,
  LogOut,
  MapPin,
  Settings,
  Shield,
} from "lucide-react";
import Button from "@/components/Button";
import { apiGet } from "@/lib/api";
import { supabase } from "@/lib/supabaseClient";

interface MeData {
  id: string;
  nickname: string;
  avatar_url: string | null;
  trust_score: number;
  email: string | null;
  report_count: number;
  feedback_count: number;
}

// 신뢰도 등급 구간 (점수 임계값)
const TIER_THRESHOLDS = [0, 300, 700, 1200, 2000];

function tierInfo(score: number) {
  let idx = 0;
  TIER_THRESHOLDS.forEach((min, i) => {
    if (score >= min) idx = i;
  });
  const curMin = TIER_THRESHOLDS[idx];
  const nextMin = TIER_THRESHOLDS[idx + 1];
  const level = idx + 1;
  if (nextMin === undefined) {
    return { level, percent: 100, remaining: 0, isMax: true };
  }
  const span = nextMin - curMin;
  const percent = Math.min(100, Math.round(((score - curMin) / span) * 100));
  return { level, percent, remaining: nextMin - score, isMax: false };
}

export default function MePage() {
  const router = useRouter();
  const [me, setMe] = useState<MeData | null>(null);
  const [authed, setAuthed] = useState<boolean | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      const ok = !!data.session;
      setAuthed(ok);
      if (ok) apiGet<MeData>("/api/me").then(setMe).catch(() => {});
    });
  }, []);

  async function logout() {
    await supabase.auth.signOut();
    router.push("/");
  }

  function comingSoon() {
    alert("준비 중인 기능이에요.");
  }

  if (authed === false) {
    return (
      <main className="mx-auto max-w-md p-6 text-center">
        <p className="mb-4 text-ink-muted">로그인이 필요합니다.</p>
        <Button onClick={() => router.push("/login")}>로그인</Button>
      </main>
    );
  }

  const tier = me ? tierInfo(me.trust_score) : null;
  const handle = me?.email?.split("@")[0] ?? me?.nickname ?? "";

  return (
    <main className="mx-auto max-w-md p-4 pb-10">
      {/* 프로필 */}
      <section className="mb-5 flex items-center gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-2xl font-bold text-primary">
          {me?.nickname?.[0] ?? "?"}
        </div>
        <div className="min-w-0">
          <h1 className="truncate text-lg font-bold text-ink">
            {me?.nickname ?? "불러오는 중…"}
          </h1>
          {handle && <p className="text-sm text-ink-muted">@{handle}</p>}
        </div>
      </section>

      {/* 신뢰도 점수 */}
      <section className="mb-4 rounded-lg border border-line bg-white p-4 shadow-card">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-ink-muted">신뢰도 점수</p>
            <p className="mt-1 text-3xl font-bold text-primary">
              {me?.trust_score.toLocaleString() ?? "—"}
              <span className="ml-1 text-base font-semibold text-ink-muted">P</span>
            </p>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-marker-warn/15 text-marker-warn">
            <Shield size={24} />
          </div>
        </div>
        <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-surface">
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{ width: `${tier?.percent ?? 0}%` }}
          />
        </div>
        <div className="mt-2 flex items-center justify-between text-xs text-ink-muted">
          <span>Lv.{tier?.level ?? 1}</span>
          <span>
            {tier?.isMax ? "최고 등급" : `다음 등급까지 ${tier?.remaining ?? 0}P`}
          </span>
        </div>
      </section>

      {/* 내 제보 / 내 피드백 */}
      <section className="mb-4 grid grid-cols-2 gap-3">
        <StatCard
          icon={<Camera size={18} />}
          tint="bg-primary/10 text-primary"
          label="내 제보"
          value={me ? `${me.report_count}건` : "—"}
        />
        <StatCard
          icon={<CheckCircle2 size={18} />}
          tint="bg-marker-warn/15 text-marker-warn"
          label="내 피드백"
          value={me ? `${me.feedback_count}건` : "—"}
        />
      </section>

      {/* 메뉴 */}
      <section className="overflow-hidden rounded-lg border border-line bg-white shadow-card">
        <MenuRow icon={<History size={18} />} label="제보 및 활동 내역" href="/me/activity" />
        <MenuRow icon={<MapPin size={18} />} label="관심 지역 설정" href="/me/interests" />
        <MenuRow icon={<Settings size={18} />} label="앱 설정" onClick={comingSoon} />
        <MenuRow
          icon={<LogOut size={18} />}
          label="로그아웃"
          danger
          onClick={logout}
          hideChevron
        />
      </section>

      <p className="mt-6 text-center text-xs text-ink-muted">
        마찰지도 v0.1.0
        <br />© 2026 마찰지도
      </p>
    </main>
  );
}

function StatCard({
  icon,
  tint,
  label,
  value,
}: {
  readonly icon: React.ReactNode;
  readonly tint: string;
  readonly label: string;
  readonly value: string;
}) {
  return (
    <div className="rounded-lg border border-line bg-white p-4 shadow-card">
      <div
        className={`mb-2 flex h-9 w-9 items-center justify-center rounded-md ${tint}`}
      >
        {icon}
      </div>
      <p className="text-sm text-ink-muted">{label}</p>
      <p className="mt-0.5 text-xl font-bold text-ink">{value}</p>
    </div>
  );
}

function MenuRow({
  icon,
  label,
  href,
  onClick,
  danger,
  hideChevron,
}: {
  readonly icon: React.ReactNode;
  readonly label: string;
  readonly href?: string;
  readonly onClick?: () => void;
  readonly danger?: boolean;
  readonly hideChevron?: boolean;
}) {
  const rowClass =
    "flex w-full items-center gap-3 border-b border-line px-4 py-4 text-left transition-colors last:border-b-0 hover:bg-surface";
  const inner = (
    <>
      <span className={danger ? "text-marker-danger" : "text-ink-muted"}>
        {icon}
      </span>
      <span
        className={`flex-1 text-sm font-medium ${
          danger ? "text-marker-danger" : "text-ink"
        }`}
      >
        {label}
      </span>
      {!hideChevron && <ChevronRight size={18} className="text-ink-muted" />}
    </>
  );

  if (href) {
    return (
      <Link href={href} className={rowClass}>
        {inner}
      </Link>
    );
  }
  return (
    <button type="button" onClick={onClick} className={rowClass}>
      {inner}
    </button>
  );
}
