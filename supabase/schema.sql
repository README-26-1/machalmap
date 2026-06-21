-- 마찰지도 DB 스키마 (01_API_백엔드_기획 3장)
-- Supabase SQL Editor에 붙여넣어 실행한다.

-- 확장
create extension if not exists "pgcrypto";

-- 1. profiles (auth.users 1:1)
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nickname text not null,
  avatar_url text,
  trust_score int not null default 0,
  created_at timestamptz not null default now()
);

-- 2. reports
create table if not exists reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete set null,
  image_url text,
  category text not null,
  description text not null default '',
  lat double precision not null,
  lng double precision not null,
  status text not null default '확인 필요',
  still_count int not null default 0,
  danger_count int not null default 0,
  resolved_count int not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists reports_created_idx on reports(created_at desc);

-- 3. feedbacks (1인 1회 제한)
create table if not exists feedbacks (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references reports(id) on delete cascade,
  user_id uuid references profiles(id) on delete set null,
  type text not null check (type in ('still','danger','resolved')),
  created_at timestamptz not null default now(),
  unique (report_id, user_id, type)
);

-- 4. posts (커뮤니티)
create table if not exists posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  title text not null,
  content text not null default '',
  report_id uuid references reports(id) on delete set null,
  like_count int not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists posts_created_idx on posts(created_at desc);

-- 5. comments
create table if not exists comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references posts(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now()
);

-- 6. likes
create table if not exists likes (
  post_id uuid not null references posts(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

-- RLS (안전망 — API route는 service_role로 우회)
alter table reports enable row level security;
alter table posts enable row level security;
alter table comments enable row level security;
alter table likes enable row level security;
alter table feedbacks enable row level security;

create policy "reports read all" on reports for select using (true);
create policy "reports insert auth" on reports for insert with check (auth.uid() = user_id);
create policy "reports update own" on reports for update using (auth.uid() = user_id);
create policy "reports delete own" on reports for delete using (auth.uid() = user_id);

create policy "posts read all" on posts for select using (true);
create policy "posts insert auth" on posts for insert with check (auth.uid() = user_id);
create policy "posts delete own" on posts for delete using (auth.uid() = user_id);

create policy "comments read all" on comments for select using (true);
create policy "comments insert auth" on comments for insert with check (auth.uid() = user_id);
create policy "comments delete own" on comments for delete using (auth.uid() = user_id);

create policy "likes read all" on likes for select using (true);
create policy "likes insert auth" on likes for insert with check (auth.uid() = user_id);
create policy "likes delete own" on likes for delete using (auth.uid() = user_id);

create policy "feedbacks read all" on feedbacks for select using (true);
create policy "feedbacks insert" on feedbacks for insert with check (true);

-- 7. interest_areas (관심 지역)
create table if not exists interest_areas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  label text not null,
  lat double precision not null,
  lng double precision not null,
  created_at timestamptz not null default now()
);
alter table interest_areas enable row level security;
create policy "interest read own" on interest_areas for select using (auth.uid() = user_id);
create policy "interest insert own" on interest_areas for insert with check (auth.uid() = user_id);
create policy "interest delete own" on interest_areas for delete using (auth.uid() = user_id);

-- 8. report_comments (제보별 댓글)
create table if not exists report_comments (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references reports(id) on delete cascade,
  user_id uuid references profiles(id) on delete set null,
  content text not null constraint report_comments_content_length_check
    check (char_length(btrim(content)) between 1 and 500),
  created_at timestamptz not null default now()
);
create index if not exists report_comments_report_created_idx
  on report_comments(report_id, created_at, id);
alter table report_comments enable row level security;
create policy "report comments read all" on report_comments for select using (true);
create policy "report comments insert own" on report_comments for insert to authenticated
  with check (auth.uid() = user_id);
create policy "report comments delete own" on report_comments for delete to authenticated
  using (auth.uid() = user_id);
grant select on table report_comments to anon, authenticated;
grant insert, delete on table report_comments to authenticated;

-- Storage 버킷은 대시보드에서 'report-images' (public) 으로 생성.
