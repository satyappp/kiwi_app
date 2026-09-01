-- ============================================================================
-- キウイ農園 — harvest (収穫入力) schema
--
-- Paste this whole file into the Supabase SQL editor and run it.
-- It is safe to run more than once.
--
-- Covers: profiles (担当者), master data (品種 / 番地 / 樹体), harvest_logs,
-- auto-derived fields, a read view, and Row Level Security.
-- ============================================================================

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- shared helper: keep updated_at fresh
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- ===========================================================================
-- profiles — one row per auth user, holds the staff display name (スタッフ名)
-- ===========================================================================
create table if not exists public.profiles (
  id           uuid primary key references auth.users (id) on delete cascade,
  display_name text not null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

drop trigger if exists trg_profiles_updated_at on public.profiles;
create trigger trg_profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- auto-create a profile whenever an auth user signs up
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(
      nullif(new.raw_user_meta_data ->> 'display_name', ''),
      nullif(new.raw_user_meta_data ->> 'full_name', ''),
      split_part(new.email, '@', 1)
    )
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- backfill profiles for any users that already exist
insert into public.profiles (id, display_name)
select u.id,
       coalesce(
         nullif(u.raw_user_meta_data ->> 'display_name', ''),
         nullif(u.raw_user_meta_data ->> 'full_name', ''),
         split_part(u.email, '@', 1)
       )
from auth.users u
on conflict (id) do nothing;

-- ===========================================================================
-- master data — 品種 (varieties) / 番地 (plots) / 樹体 (tree_blocks)
-- new rows can be added straight from the app ("その他 / 新規")
-- ===========================================================================
create table if not exists public.varieties (
  id          uuid primary key default gen_random_uuid(),
  name        text not null unique,
  legacy_code text unique,                 -- 品種ID from the old CSV
  is_active   boolean not null default true,
  sort_order  int not null default 100,
  created_at  timestamptz not null default now()
);

create table if not exists public.plots (
  id          uuid primary key default gen_random_uuid(),
  name        text not null unique,
  legacy_code text unique,                 -- 番地ID from the old CSV
  is_active   boolean not null default true,
  sort_order  int not null default 100,
  created_at  timestamptz not null default now()
);

create table if not exists public.tree_blocks (
  id         uuid primary key default gen_random_uuid(),
  plot_id    uuid not null references public.plots (id) on delete cascade,
  name       text not null,                -- 樹体名 (e.g. 204, 304南)
  is_active  boolean not null default true,
  created_at timestamptz not null default now(),
  unique (plot_id, name)
);
create index if not exists idx_tree_blocks_plot on public.tree_blocks (plot_id);

-- seed from the historical CSV ----------------------------------------------
insert into public.varieties (name, legacy_code, sort_order) values
  ('紅妃',                   'be188951', 10),
  ('ヘイワード',             '651ae19b', 20),
  ('香緑',                   '77794d93', 30),
  ('香緑_加工用',            'fde29e2f', 31),
  ('ミニ香緑(第一)',         '7b957014', 32),
  ('東京ゴールド',           'da62169f', 40),
  ('センセーションアップル', '053d5e36', 50),
  ('シカクイキウイ',         '2ff54c56', 60),
  ('さぬきキウイっこ1号',    'ee6bfdb9', 70),
  ('さぬきキウイっこ5号',    '1d4a4a8d', 71)
on conflict (name) do nothing;

insert into public.plots (name, legacy_code, sort_order) values
  ('おおくまキウイ再生クラブ第一圃場_0', '73eabf6a', 10),
  ('末澤農園_0',                          '0aff8103', 20),
  ('深山のキウイ_0',                      '2760dbc9', 30),
  ('渡邉忠一園_0',                        'aedafe66', 40)
on conflict (name) do nothing;

insert into public.tree_blocks (plot_id, name)
select p.id, b.name
from public.plots p
cross join (values ('105'), ('204'), ('206'), ('304')) as b(name)
where p.legacy_code = '73eabf6a'
on conflict (plot_id, name) do nothing;

-- ===========================================================================
-- harvest_logs — 収穫入力
-- ===========================================================================
create table if not exists public.harvest_logs (
  id               uuid primary key default gen_random_uuid(),
  legacy_id        text unique,                                   -- 作業記録ID (for a future CSV import)

  staff_id         uuid not null default auth.uid()
                     references public.profiles (id),             -- スタッフ (auto = signed-in user)

  work_date        date not null
                     default ((now() at time zone 'Asia/Tokyo')::date),   -- 作業日
  work_time        time,                                          -- 作業時間 (任意)

  harvest_year     int not null,                                  -- 収穫年  (auto from work_date)
  harvest_month    int not null,                                  -- 収穫月  (auto from work_date)

  plot_id          uuid not null references public.plots (id),          -- 番地
  tree_block_id    uuid references public.tree_blocks (id),             -- 樹体 (任意)
  variety_id       uuid not null references public.varieties (id),      -- 品種
  branch           text,                                               -- 枝 (北/南/… 任意)

  sorting_deadline date not null,                                 -- 選果期限 (default = 作業日 + 30日)
  weight_kg        numeric(10,2) not null check (weight_kg > 0),  -- 収穫量(kg)

  title            text not null,                                 -- 収穫タイトル (auto)
  notes            text,                                          -- メモ

  created_at       timestamptz not null default now(),            -- 入力TS
  updated_at       timestamptz not null default now()
);

create index if not exists idx_harvest_work_date        on public.harvest_logs (work_date);
create index if not exists idx_harvest_plot             on public.harvest_logs (plot_id);
create index if not exists idx_harvest_variety          on public.harvest_logs (variety_id);
create index if not exists idx_harvest_staff            on public.harvest_logs (staff_id);
create index if not exists idx_harvest_sorting_deadline on public.harvest_logs (sorting_deadline);

-- default the 選果期限, compose the 収穫タイトル, tidy optional text — every write
create or replace function public.harvest_logs_before_write()
returns trigger language plpgsql as $$
declare
  v_variety text;
  v_plot    text;
  v_tree    text;
begin
  new.harvest_year  := extract(year  from new.work_date);
  new.harvest_month := extract(month from new.work_date);

  if new.sorting_deadline is null then
    new.sorting_deadline := new.work_date + 30;
  end if;

  select name into v_variety from public.varieties   where id = new.variety_id;
  select name into v_plot    from public.plots       where id = new.plot_id;
  select name into v_tree    from public.tree_blocks where id = new.tree_block_id;

  new.title := to_char(new.work_date, 'MM/DD/YYYY') || '収穫'
             || coalesce(v_variety, '')
             || coalesce(v_plot, '')
             || coalesce(v_tree, '');

  new.branch     := nullif(btrim(new.branch), '');
  new.notes      := nullif(btrim(new.notes), '');
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_harvest_logs_before_write on public.harvest_logs;
create trigger trg_harvest_logs_before_write
  before insert or update on public.harvest_logs
  for each row execute function public.harvest_logs_before_write();

-- ===========================================================================
-- read view — flattened, matches the old CSV columns (for lists / export)
-- security_invoker: the caller's RLS still applies
-- ===========================================================================
drop view if exists public.harvest_logs_expanded;
create view public.harvest_logs_expanded
with (security_invoker = true) as
select
  h.id,
  h.legacy_id,
  h.created_at              as input_ts,          -- 入力TS
  h.staff_id,
  pr.display_name           as staff_name,        -- スタッフ名
  h.title,                                        -- 収穫タイトル
  h.work_date,                                    -- 作業日
  h.work_time,                                    -- 作業時間
  h.harvest_year,                                 -- 収穫年
  h.harvest_month,                                -- 収穫月
  h.plot_id,
  pl.name                   as plot_name,         -- 番地名
  h.tree_block_id,
  tb.name                   as tree_block_name,   -- 樹体名
  h.variety_id,
  v.name                    as variety_name,      -- 品種名
  h.branch,                                       -- 枝
  h.sorting_deadline,                             -- 選果期限
  h.weight_kg,                                    -- 収穫量(kg)
  h.notes,
  h.updated_at
from public.harvest_logs h
join public.profiles     pr on pr.id = h.staff_id
join public.plots        pl on pl.id = h.plot_id
join public.varieties    v  on v.id  = h.variety_id
left join public.tree_blocks tb on tb.id = h.tree_block_id;

-- ===========================================================================
-- Row Level Security
--   anon          → no access
--   authenticated → read everything; add harvest rows as themselves;
--                   add / rename master data; nobody can delete
-- ===========================================================================
alter table public.profiles     enable row level security;
alter table public.varieties    enable row level security;
alter table public.plots        enable row level security;
alter table public.tree_blocks  enable row level security;
alter table public.harvest_logs enable row level security;

-- profiles ------------------------------------------------------------------
drop policy if exists "profiles_select"     on public.profiles;
drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_select" on public.profiles
  for select to authenticated using (true);
create policy "profiles_update_own" on public.profiles
  for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

-- master data: read + add + rename ----------------------------------------
do $$
declare t text;
begin
  foreach t in array array['varieties', 'plots', 'tree_blocks'] loop
    execute format('drop policy if exists "%1$s_select" on public.%1$s', t);
    execute format('drop policy if exists "%1$s_insert" on public.%1$s', t);
    execute format('drop policy if exists "%1$s_update" on public.%1$s', t);
    execute format('create policy "%1$s_select" on public.%1$s for select to authenticated using (true)', t);
    execute format('create policy "%1$s_insert" on public.%1$s for insert to authenticated with check (true)', t);
    execute format('create policy "%1$s_update" on public.%1$s for update to authenticated using (true) with check (true)', t);
  end loop;
end $$;

-- harvest_logs ------------------------------------------------------------
drop policy if exists "harvest_select"      on public.harvest_logs;
drop policy if exists "harvest_insert_self" on public.harvest_logs;
drop policy if exists "harvest_update"      on public.harvest_logs;
create policy "harvest_select" on public.harvest_logs
  for select to authenticated using (true);
create policy "harvest_insert_self" on public.harvest_logs
  for insert to authenticated with check (staff_id = auth.uid());
create policy "harvest_update" on public.harvest_logs
  for update to authenticated using (true) with check (true);
-- no delete policy → deletes are impossible for everyone

-- ===========================================================================
-- privileges (RLS still gates every row)
-- ===========================================================================
grant usage on schema public to authenticated;
grant select, insert, update
  on public.profiles, public.varieties, public.plots, public.tree_blocks, public.harvest_logs
  to authenticated;
grant select on public.harvest_logs_expanded to authenticated;

revoke all
  on public.profiles, public.varieties, public.plots, public.tree_blocks, public.harvest_logs
  from anon;
