-- ==========================================================================
-- キウイ農園 — production harvest schema
--
-- Initial migration for a new Supabase database. Paste the complete file into
-- Supabase SQL Editor and run it once. Re-running the unchanged file is safe.
-- Existing Supabase Auth users are backfilled into public.profiles.
-- ==========================================================================

begin;

create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- profiles — one staff profile per Supabase Auth user -----------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null check (btrim(display_name) <> ''),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(
      nullif(btrim(new.raw_user_meta_data ->> 'display_name'), ''),
      nullif(btrim(new.raw_user_meta_data ->> 'full_name'), ''),
      nullif(split_part(coalesce(new.email, ''), '@', 1), ''),
      nullif(btrim(coalesce(new.phone, '')), ''),
      new.id::text
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

-- Backfill accounts created before this migration.
insert into public.profiles (id, display_name)
select
  u.id,
  coalesce(
    nullif(btrim(u.raw_user_meta_data ->> 'display_name'), ''),
    nullif(btrim(u.raw_user_meta_data ->> 'full_name'), ''),
    nullif(split_part(coalesce(u.email, ''), '@', 1), ''),
    nullif(btrim(coalesce(u.phone, '')), ''),
    u.id::text
  )
from auth.users u
on conflict (id) do nothing;

-- Master data — 品種 / 番地 / 樹体 -----------------------------------------
-- Obsolete choices are deactivated with is_active instead of deleted.
create table if not exists public.varieties (
  id uuid primary key default gen_random_uuid(),
  name text not null check (btrim(name) <> ''),
  legacy_code text,
  is_active boolean not null default true,
  sort_order integer not null default 100,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists varieties_name_unique
  on public.varieties (lower(btrim(name)));
create unique index if not exists varieties_legacy_code_unique
  on public.varieties (legacy_code) where legacy_code is not null;

create table if not exists public.plots (
  id uuid primary key default gen_random_uuid(),
  name text not null check (btrim(name) <> ''),
  legacy_code text,
  is_active boolean not null default true,
  sort_order integer not null default 100,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists plots_name_unique
  on public.plots (lower(btrim(name)));
create unique index if not exists plots_legacy_code_unique
  on public.plots (legacy_code) where legacy_code is not null;

create table if not exists public.tree_blocks (
  id uuid primary key default gen_random_uuid(),
  plot_id uuid not null references public.plots(id)
    on update cascade on delete restrict,
  name text not null check (btrim(name) <> ''),
  is_active boolean not null default true,
  sort_order integer not null default 100,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists tree_blocks_plot_name_unique
  on public.tree_blocks (plot_id, lower(btrim(name)));
create index if not exists tree_blocks_plot_idx on public.tree_blocks (plot_id);

drop trigger if exists varieties_set_updated_at on public.varieties;
create trigger varieties_set_updated_at
  before update on public.varieties
  for each row execute function public.set_updated_at();

drop trigger if exists plots_set_updated_at on public.plots;
create trigger plots_set_updated_at
  before update on public.plots
  for each row execute function public.set_updated_at();

drop trigger if exists tree_blocks_set_updated_at on public.tree_blocks;
create trigger tree_blocks_set_updated_at
  before update on public.tree_blocks
  for each row execute function public.set_updated_at();

-- Clean master data observed in the CSV. Harvest rows are not imported.
-- NULL and '_' legacy placeholders are intentionally not seeded.
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
on conflict do nothing;

insert into public.plots (name, legacy_code, sort_order) values
  ('おおくまキウイ再生クラブ第一圃場_0', '73eabf6a', 10),
  ('末澤農園_0',                          '0aff8103', 20),
  ('深山のキウイ_0',                      '2760dbc9', 30),
  ('渡邉忠一園_0',                        'aedafe66', 40)
on conflict do nothing;

insert into public.tree_blocks (plot_id, name, sort_order)
select p.id, seed.name, seed.sort_order
from public.plots p
cross join (
  values ('105', 10), ('204', 20), ('206', 30), ('304', 40), ('304南', 41)
) as seed(name, sort_order)
where p.legacy_code = '73eabf6a'
on conflict do nothing;

insert into public.tree_blocks (plot_id, name, sort_order)
select p.id, '0', 10
from public.plots p
where p.legacy_code = '0aff8103'
on conflict do nothing;

-- harvest_logs — 収穫入力 --------------------------------------------------
create table if not exists public.harvest_logs (
  id uuid primary key default gen_random_uuid(),
  legacy_id text unique,                         -- old 作業記録ID, future import only

  staff_id uuid not null default auth.uid()
    references public.profiles(id) on update cascade on delete restrict,

  work_date date not null
    default ((now() at time zone 'Asia/Tokyo')::date),
  work_time time(0) not null
    default ((now() at time zone 'Asia/Tokyo')::time(0)),

  harvest_year smallint generated always as
    (extract(year from work_date)::smallint) stored,
  harvest_month smallint generated always as
    (extract(month from work_date)::smallint) stored,

  plot_id uuid not null references public.plots(id)
    on update cascade on delete restrict,
  tree_block_id uuid references public.tree_blocks(id)
    on update cascade on delete restrict,
  variety_id uuid not null references public.varieties(id)
    on update cascade on delete restrict,
  branch text,

  sorting_deadline date not null,                -- defaults to work_date + 30
  weight_kg numeric(12,2) not null,              -- intentionally no range rule
  title text not null,                            -- composed automatically
  notes text check (notes is null or char_length(notes) <= 500),

  created_at timestamptz not null default now(), -- 入力TS
  updated_at timestamptz not null default now()
);

create index if not exists harvest_logs_work_date_idx
  on public.harvest_logs (work_date desc);
create index if not exists harvest_logs_plot_idx on public.harvest_logs (plot_id);
create index if not exists harvest_logs_tree_block_idx on public.harvest_logs (tree_block_id);
create index if not exists harvest_logs_variety_idx on public.harvest_logs (variety_id);
create index if not exists harvest_logs_staff_idx on public.harvest_logs (staff_id);
create index if not exists harvest_logs_sorting_deadline_idx
  on public.harvest_logs (sorting_deadline);

create or replace function public.prepare_harvest_log()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  variety_name text;
  plot_name text;
  tree_name text;
begin
  if tg_op = 'INSERT' then
    -- A client cannot attribute a new record to another staff member.
    new.staff_id := (select auth.uid());
  else
    -- Shared corrections are allowed, but original identity/audit fields stay.
    new.id := old.id;
    new.staff_id := old.staff_id;
    new.created_at := old.created_at;
  end if;

  if new.staff_id is null then
    raise exception 'Authentication is required';
  end if;

  if new.sorting_deadline is null then
    new.sorting_deadline := new.work_date + 30;
  end if;

  select v.name into variety_name
  from public.varieties v where v.id = new.variety_id;
  select p.name into plot_name
  from public.plots p where p.id = new.plot_id;
  select t.name into tree_name
  from public.tree_blocks t where t.id = new.tree_block_id;

  new.title := to_char(new.work_date, 'MM/DD/YYYY') || '収穫'
    || coalesce(variety_name, '')
    || coalesce(plot_name, '')
    || coalesce(tree_name, '');

  new.branch := nullif(btrim(new.branch), '');
  new.notes := nullif(btrim(new.notes), '');
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists harvest_logs_prepare on public.harvest_logs;
create trigger harvest_logs_prepare
  before insert or update on public.harvest_logs
  for each row execute function public.prepare_harvest_log();

-- CSV-shaped read view. security_invoker applies the caller's RLS. ----------
create or replace view public.harvest_logs_expanded
with (security_invoker = true) as
select
  h.created_at as input_ts,                       -- 入力TS
  h.id as work_record_id,                         -- 作業記録ID
  h.legacy_id,
  h.staff_id,                                     -- スタッフID
  pr.display_name as staff_name,                  -- スタッフ名
  h.title,                                        -- 収穫タイトル
  h.work_date,                                    -- 作業日
  h.work_time,                                    -- 作業時間
  h.harvest_year,                                 -- 収穫年
  h.harvest_month,                                -- 収穫月
  h.plot_id,                                      -- 番地ID
  pl.name as plot_name,                           -- 番地名
  h.tree_block_id,                                -- 樹体ID
  tb.name as tree_block_name,                     -- 樹体名
  h.variety_id,                                   -- 品種ID
  v.name as variety_name,                         -- 品種名
  h.branch,                                       -- 枝
  h.sorting_deadline,                             -- 選果期限
  h.weight_kg,                                    -- 収穫量(kg)
  h.notes,
  h.updated_at
from public.harvest_logs h
join public.profiles pr on pr.id = h.staff_id
join public.plots pl on pl.id = h.plot_id
join public.varieties v on v.id = h.variety_id
left join public.tree_blocks tb on tb.id = h.tree_block_id;

-- Row Level Security — all signed-in staff are equal ------------------------
alter table public.profiles enable row level security;
alter table public.varieties enable row level security;
alter table public.plots enable row level security;
alter table public.tree_blocks enable row level security;
alter table public.harvest_logs enable row level security;

drop policy if exists profiles_select on public.profiles;
drop policy if exists profiles_update_own on public.profiles;
create policy profiles_select on public.profiles
  for select to authenticated using (true);
create policy profiles_update_own on public.profiles
  for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

do $$
declare
  table_name text;
begin
  foreach table_name in array array['varieties', 'plots', 'tree_blocks'] loop
    execute format('drop policy if exists %I on public.%I', table_name || '_select', table_name);
    execute format('drop policy if exists %I on public.%I', table_name || '_insert', table_name);
    execute format('drop policy if exists %I on public.%I', table_name || '_update', table_name);
    execute format('create policy %I on public.%I for select to authenticated using (true)', table_name || '_select', table_name);
    execute format('create policy %I on public.%I for insert to authenticated with check (true)', table_name || '_insert', table_name);
    execute format('create policy %I on public.%I for update to authenticated using (true) with check (true)', table_name || '_update', table_name);
  end loop;
end $$;

drop policy if exists harvest_select on public.harvest_logs;
drop policy if exists harvest_insert_self on public.harvest_logs;
drop policy if exists harvest_update_shared on public.harvest_logs;
create policy harvest_select on public.harvest_logs
  for select to authenticated using (true);
create policy harvest_insert_self on public.harvest_logs
  for insert to authenticated
  with check (staff_id = (select auth.uid()));
create policy harvest_update_shared on public.harvest_logs
  for update to authenticated using (true) with check (true);
-- No DELETE grants and no DELETE policies: production records are not removed.

-- Explicit least-privilege grants. RLS then decides accessible rows.
revoke all on table
  public.profiles,
  public.varieties,
  public.plots,
  public.tree_blocks,
  public.harvest_logs,
  public.harvest_logs_expanded
from public, anon, authenticated;

grant usage on schema public to authenticated;
grant select on table public.profiles to authenticated;
grant update (display_name) on table public.profiles to authenticated;
grant select, insert, update on table
  public.varieties,
  public.plots,
  public.tree_blocks,
  public.harvest_logs
to authenticated;
grant select on table public.harvest_logs_expanded to authenticated;

-- Trigger helpers are internal and cannot be called through the Data API.
revoke execute on function public.set_updated_at() from public, anon, authenticated;
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.prepare_harvest_log() from public, anon, authenticated;

commit;
