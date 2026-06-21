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

-- 7. polls (커뮤니티 투표)
create table if not exists polls (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null unique references posts(id) on delete cascade,
  question text not null,
  created_at timestamptz not null default now()
);

create table if not exists poll_options (
  id uuid primary key default gen_random_uuid(),
  poll_id uuid not null references polls(id) on delete cascade,
  label text not null,
  created_at timestamptz not null default now()
);

create table if not exists poll_votes (
  poll_id uuid not null references polls(id) on delete cascade,
  option_id uuid not null references poll_options(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (poll_id, user_id)
);

-- 8. favorite places (장소 추천 취향)
create table if not exists favorite_places (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  name text not null,
  category text not null,
  image_url text,
  description text not null default '',
  lat double precision not null,
  lng double precision not null,
  note text,
  recommender_note text,
  created_at timestamptz not null default now()
);
create index if not exists favorite_places_user_idx on favorite_places(user_id, created_at desc);
alter table favorite_places add column if not exists image_url text;
alter table favorite_places add column if not exists description text not null default '';
alter table favorite_places add column if not exists recommender_note text;

-- 9. friendships + direct messages
create table if not exists friendships (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references profiles(id) on delete cascade,
  addressee_id uuid not null references profiles(id) on delete cascade,
  user_low_id uuid not null references profiles(id) on delete cascade,
  user_high_id uuid not null references profiles(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending','accepted')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (requester_id <> addressee_id),
  unique (user_low_id, user_high_id)
);

create table if not exists direct_messages (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references profiles(id) on delete cascade,
  receiver_id uuid not null references profiles(id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now(),
  check (sender_id <> receiver_id)
);
create index if not exists direct_messages_pair_idx on direct_messages(sender_id, receiver_id, created_at);

-- RLS (안전망 — API route는 service_role로 우회)
alter table reports enable row level security;
alter table posts enable row level security;
alter table comments enable row level security;
alter table likes enable row level security;
alter table feedbacks enable row level security;
alter table polls enable row level security;
alter table poll_options enable row level security;
alter table poll_votes enable row level security;
alter table favorite_places enable row level security;
alter table friendships enable row level security;
alter table direct_messages enable row level security;

drop policy if exists "reports read all" on reports;
drop policy if exists "reports insert auth" on reports;
drop policy if exists "reports update own" on reports;
drop policy if exists "reports delete own" on reports;
drop policy if exists "posts read all" on posts;
drop policy if exists "posts insert auth" on posts;
drop policy if exists "posts delete own" on posts;
drop policy if exists "comments read all" on comments;
drop policy if exists "comments insert auth" on comments;
drop policy if exists "comments delete own" on comments;
drop policy if exists "likes read all" on likes;
drop policy if exists "likes insert auth" on likes;
drop policy if exists "likes delete own" on likes;
drop policy if exists "feedbacks read all" on feedbacks;
drop policy if exists "feedbacks insert" on feedbacks;
drop policy if exists "polls read all" on polls;
drop policy if exists "poll options read all" on poll_options;
drop policy if exists "poll votes read all" on poll_votes;
drop policy if exists "poll votes own insert" on poll_votes;
drop policy if exists "poll votes own update" on poll_votes;
drop policy if exists "favorite places own read" on favorite_places;
drop policy if exists "favorite places own insert" on favorite_places;
drop policy if exists "favorite places own delete" on favorite_places;
drop policy if exists "friendships own read" on friendships;
drop policy if exists "friendships own insert" on friendships;
drop policy if exists "friendships accept received" on friendships;
drop policy if exists "direct messages pair read" on direct_messages;
drop policy if exists "direct messages own insert" on direct_messages;

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

create policy "polls read all" on polls for select using (true);
create policy "poll options read all" on poll_options for select using (true);
create policy "poll votes read all" on poll_votes for select using (true);
create policy "poll votes own insert" on poll_votes for insert with check (auth.uid() = user_id);
create policy "poll votes own update" on poll_votes for update using (auth.uid() = user_id);

create policy "favorite places own read" on favorite_places for select using (auth.uid() = user_id);
create policy "favorite places own insert" on favorite_places for insert with check (auth.uid() = user_id);
create policy "favorite places own delete" on favorite_places for delete using (auth.uid() = user_id);

create policy "friendships own read" on friendships
  for select using (auth.uid() = requester_id or auth.uid() = addressee_id);
create policy "friendships own insert" on friendships
  for insert with check (auth.uid() = requester_id);
create policy "friendships accept received" on friendships
  for update using (auth.uid() = addressee_id);

create policy "direct messages pair read" on direct_messages
  for select using (auth.uid() = sender_id or auth.uid() = receiver_id);
create policy "direct messages own insert" on direct_messages
  for insert with check (auth.uid() = sender_id);

-- Storage 버킷은 대시보드에서 'report-images' (public) 으로 생성.
