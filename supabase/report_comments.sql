-- 핀(제보)별 댓글 기능
-- Supabase Dashboard > SQL Editor에서 이 파일 전체를 실행하세요.

create extension if not exists "pgcrypto";

create table if not exists public.report_comments (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references public.reports(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now()
);

-- 이미 테이블이 만들어진 환경에서도 댓글 길이 제약을 추가한다.
do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'report_comments_content_length_check'
      and conrelid = 'public.report_comments'::regclass
  ) then
    alter table public.report_comments
      add constraint report_comments_content_length_check
      check (char_length(btrim(content)) between 1 and 500);
  end if;
end
$$;

create index if not exists report_comments_report_created_idx
  on public.report_comments(report_id, created_at, id);

alter table public.report_comments enable row level security;

-- 여러 번 실행해도 정책이 중복되지 않게 기존 정책을 교체한다.
drop policy if exists "report comments read all" on public.report_comments;
drop policy if exists "report comments insert own" on public.report_comments;
drop policy if exists "report comments delete own" on public.report_comments;
drop policy if exists "rc read all" on public.report_comments;
drop policy if exists "rc insert auth" on public.report_comments;
drop policy if exists "rc delete own" on public.report_comments;

create policy "report comments read all"
  on public.report_comments
  for select
  using (true);

create policy "report comments insert own"
  on public.report_comments
  for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "report comments delete own"
  on public.report_comments
  for delete
  to authenticated
  using (auth.uid() = user_id);

grant select on table public.report_comments to anon, authenticated;
grant insert, delete on table public.report_comments to authenticated;
