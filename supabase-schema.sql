-- LoreKeeper Supabase Schema
-- Run this in the Supabase SQL Editor to set up the database.

-- ============================================================
-- 1. PROFILES (extends auth.users)
-- ============================================================
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================================
-- 2. BOOKS
-- ============================================================
create table if not exists public.books (
  id text not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  emoji text,
  color text,
  type text,
  updated_at timestamptz default now(),
  primary key (user_id, id)
);

-- ============================================================
-- 3. PHASES
-- ============================================================
create table if not exists public.phases (
  id int not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  label text,
  weeks int[2],
  color text,
  description text,
  updated_at timestamptz default now(),
  primary key (user_id, id)
);

-- ============================================================
-- 4. SCHEDULE
-- ============================================================
create table if not exists public.schedule (
  week int not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  manga_title text,
  manga_vols text,
  novel_title text,
  novel_section text,
  tip text,
  companion text,
  updated_at timestamptz default now(),
  primary key (user_id, week)
);

-- ============================================================
-- 5. ENTRIES (JSONB for nested metadata)
-- ============================================================
create table if not exists public.entries (
  id text not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  date text,
  book text not null,
  chapter text,
  mood text,
  reingreso text,
  quotes jsonb default '[]'::jsonb,
  characters jsonb default '[]'::jsonb,
  places jsonb default '[]'::jsonb,
  glossary jsonb default '[]'::jsonb,
  world_rules jsonb default '[]'::jsonb,
  connections jsonb default '[]'::jsonb,
  manga_panels text[] default '{}',
  updated_at timestamptz default now(),
  primary key (user_id, id)
);

-- ============================================================
-- 6. COMPLETED WEEKS
-- ============================================================
create table if not exists public.completed_weeks (
  week int not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  updated_at timestamptz default now(),
  primary key (user_id, week)
);

-- ============================================================
-- 7. ORACLE REPLIES
-- ============================================================
create table if not exists public.oracle_replies (
  entity_name text not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  reply text,
  updated_at timestamptz default now(),
  primary key (user_id, entity_name)
);

-- ============================================================
-- 8. SYNC LOG
-- ============================================================
create table if not exists public.sync_log (
  user_id uuid not null references auth.users(id) on delete cascade,
  device_id text not null,
  table_name text not null,
  last_synced_at timestamptz default now(),
  primary key (user_id, device_id, table_name)
);

-- ============================================================
-- AUTO-UPDATE updated_at TRIGGER
-- ============================================================
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Apply trigger to all tables with updated_at
do $$
declare
  t text;
begin
  for t in select unnest(array[
    'profiles', 'books', 'phases', 'schedule',
    'entries', 'completed_weeks', 'oracle_replies', 'sync_log'
  ]) loop
    execute format(
      'drop trigger if exists set_updated_at on public.%I; '
      'create trigger set_updated_at before update on public.%I '
      'for each row execute function public.handle_updated_at();',
      t, t
    );
  end loop;
end;
$$;

-- ============================================================
-- AUTO-CREATE PROFILE ON SIGN-UP
-- ============================================================
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id) values (new.id);
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
alter table public.profiles enable row level security;
alter table public.books enable row level security;
alter table public.phases enable row level security;
alter table public.schedule enable row level security;
alter table public.entries enable row level security;
alter table public.completed_weeks enable row level security;
alter table public.oracle_replies enable row level security;
alter table public.sync_log enable row level security;

-- Each user can only access their own data
create policy "Users can manage own profile" on public.profiles
  for all using (auth.uid() = id) with check (auth.uid() = id);

create policy "Users can manage own books" on public.books
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users can manage own phases" on public.phases
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users can manage own schedule" on public.schedule
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users can manage own entries" on public.entries
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users can manage own completed_weeks" on public.completed_weeks
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users can manage own oracle_replies" on public.oracle_replies
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users can manage own sync_log" on public.sync_log
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ============================================================
-- STORAGE: manga-panels bucket
-- ============================================================
insert into storage.buckets (id, name, public)
values ('manga-panels', 'manga-panels', false)
on conflict (id) do nothing;

-- Storage RLS: users can only access their own folder
create policy "Users can upload own panels" on storage.objects
  for insert with check (
    bucket_id = 'manga-panels'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users can read own panels" on storage.objects
  for select using (
    bucket_id = 'manga-panels'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users can delete own panels" on storage.objects
  for delete using (
    bucket_id = 'manga-panels'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
