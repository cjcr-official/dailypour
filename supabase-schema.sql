-- ============================================================
-- The Daily Pour — Supabase schema
-- ============================================================
-- Run this in your Supabase project's SQL editor.
--
-- Auth model: Supabase Auth (username + password). The login UI
-- in the app maps username → `{username}@{USERNAME_DOMAIN}` and
-- creates a normal Supabase Auth user. user_id is the Supabase
-- user's uuid (auth.uid()).
--
-- RLS: strict. Every row is partitioned by user_id and only
-- visible to the owner via the anon key + a valid session JWT.
-- ============================================================

-- ---------- favorites ----------
create table if not exists public.favorites (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  name        text not null,
  emoji       text not null,
  color       text not null,
  created_at  timestamptz not null default now(),
  unique (user_id, name)
);

create index if not exists favorites_user_idx on public.favorites (user_id);

-- ---------- orders (daily coffee log) ----------
create table if not exists public.orders (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  date        date not null,
  name        text not null,
  emoji       text not null,
  color       text not null,
  created_at  timestamptz not null default now(),
  unique (user_id, date)
);

create index if not exists orders_user_date_idx on public.orders (user_id, date);

-- ---------- RLS ----------
-- Each user can only see and modify their own rows. The check
-- enforces that user_id matches the signed-in user's uuid.

alter table public.favorites enable row level security;
alter table public.orders    enable row level security;

drop policy if exists "favorites read own"   on public.favorites;
drop policy if exists "favorites insert own" on public.favorites;
drop policy if exists "favorites update own" on public.favorites;
drop policy if exists "favorites delete own" on public.favorites;

create policy "favorites read own" on public.favorites
  for select using (auth.uid() = user_id);
create policy "favorites insert own" on public.favorites
  for insert with check (auth.uid() = user_id);
create policy "favorites update own" on public.favorites
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "favorites delete own" on public.favorites
  for delete using (auth.uid() = user_id);

drop policy if exists "orders read own"   on public.orders;
drop policy if exists "orders insert own" on public.orders;
drop policy if exists "orders update own" on public.orders;
drop policy if exists "orders delete own" on public.orders;

create policy "orders read own" on public.orders
  for select using (auth.uid() = user_id);
create policy "orders insert own" on public.orders
  for insert with check (auth.uid() = user_id);
create policy "orders update own" on public.orders
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "orders delete own" on public.orders
  for delete using (auth.uid() = user_id);
